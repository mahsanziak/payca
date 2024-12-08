import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

type CartItem = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'name' | 'price'>) => void;
  updateCartItemQuantity: (menu_item_id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
};

type CartProviderProps = {
  children: ReactNode;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Extract restaurantId and tableId from the URL
  const { restaurantId, tableId } = router.query;

  // Fetch initial cart data and subscribe to real-time updates
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!restaurantId || !tableId) return;

      try {
        const { data, error } = await supabase
          .from('carts')
          .select(`
            id,
            menu_item_id,
            quantity,
            menu_items (
              name,
              price
            )
          `)
          .eq('restaurant_id', restaurantId)
          .eq('table_id', tableId);

        if (error) {
          console.error('Error fetching cart items:', error);
        } else {
          const enrichedCart = data.map((cartItem: any) => ({
            id: cartItem.id,
            menu_item_id: cartItem.menu_item_id,
            name: cartItem.menu_items?.name || '',
            price: cartItem.menu_items?.price || 0,
            quantity: cartItem.quantity,
          }));
          setCart(enrichedCart);
        }
      } catch (err) {
        console.error('Unexpected error fetching cart items:', err);
      }
    };

    const subscribeToCartUpdates = () => {
      const channel = supabase
        .channel('realtime:public:carts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'carts' },
          async (payload) => {
            const { eventType, new: newItem, old: oldItem } = payload;
    
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              try {
                // Fetch the enriched item details from the database
                const { data: enrichedItem, error } = await supabase
                  .from('menu_items')
                  .select('name, price')
                  .eq('id', newItem.menu_item_id)
                  .single();
    
                if (error) {
                  console.error('Error fetching menu item details:', error);
                  return;
                }
    
                setCart((prevCart) => {
                  if (eventType === 'INSERT') {
                    return [
                      ...prevCart,
                      {
                        ...newItem,
                        name: enrichedItem?.name || '',
                        price: enrichedItem?.price || 0,
                      },
                    ];
                  } else if (eventType === 'UPDATE') {
                    return prevCart.map((item) =>
                      item.id === oldItem.id
                        ? {
                            ...item,
                            ...newItem,
                            name: enrichedItem?.name || item.name,
                            price: enrichedItem?.price || item.price,
                          }
                        : item
                    );
                  }
                  return prevCart;
                });
              } catch (err) {
                console.error('Unexpected error during cart update:', err);
              }
            } else if (eventType === 'DELETE') {
              setCart((prevCart) => prevCart.filter((item) => item.id !== oldItem.id));
            }
          }
        )
        .subscribe();
    
      return () => {
        supabase.removeChannel(channel);
      };
    };
    

    fetchCartItems();
    const unsubscribe = subscribeToCartUpdates();

    return () => {
      unsubscribe();
    };
  }, [restaurantId, tableId]);

  const addToCart = async (item: Omit<CartItem, 'id' | 'name' | 'price'>) => {
    try {
      if (!restaurantId || !tableId) {
        console.error('Missing restaurantId or tableId in the URL');
        return;
      }
  
      // Check if the item already exists in the cart
      const { data: existingItem, error: fetchError } = await supabase
        .from('carts')
        .select('id, quantity')
        .eq('menu_item_id', item.menu_item_id)
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing cart item:', fetchError);
        return;
      }
  
      if (existingItem) {
        // If item exists, increment the quantity
        const { error: updateError } = await supabase
          .from('carts')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
  
        if (updateError) {
          console.error('Error updating cart item quantity:', updateError);
        }
      } else {
        // If item doesn't exist, insert it into the cart
        const { error: insertError } = await supabase.from('carts').insert({
          menu_item_id: item.menu_item_id,
          restaurant_id: restaurantId as string,
          table_id: tableId as string,
          quantity: 1, // Default quantity
        });
  
        if (insertError) {
          console.error('Error adding new item to cart:', insertError);
        }
      }
    } catch (err) {
      console.error('Unexpected error in addToCart:', err);
    }
  };
  

  const updateCartItemQuantity = async (menu_item_id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('carts')
        .update({ quantity })
        .eq('table_id', tableId)
        .eq('menu_item_id', menu_item_id);

      if (error) {
        console.error('Error updating cart item quantity:', error);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      const { error } = await supabase.from('carts').delete().eq('id', id);
      if (error) console.error('Error removing from cart:', error);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const clearCart = async () => {
    try {
      const { error } = await supabase.from('carts').delete().eq('table_id', tableId);
      if (error) console.error('Error clearing cart:', error);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const toggleCart = () => setIsOpen(!isOpen);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        isOpen,
        toggleCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
