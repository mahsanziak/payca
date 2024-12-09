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
  cart: { [key: string]: CartItem[] };
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
  const [cart, setCart] = useState<{ [key: string]: CartItem[] }>({});
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { restaurantId, tableId } = router.query;
  const cartKey = `${restaurantId}-${tableId}`;

  // Fetch initial cart data for the specific restaurant and table
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

          setCart((prevCart) => ({
            ...prevCart,
            [cartKey]: enrichedCart,
          }));
        }
      } catch (err) {
        console.error('Unexpected error fetching cart items:', err);
      }
    };

    fetchCartItems();
  }, [restaurantId, tableId, cartKey]);

  const addToCart = async (item: Omit<CartItem, 'id' | 'name' | 'price'>) => {
    try {
      if (!restaurantId || !tableId) {
        console.error('Missing restaurantId or tableId in the URL');
        return;
      }
  
      // Check if the item exists in the `menu_items` table
      const { data: menuItemData, error: menuItemError } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .eq('id', item.menu_item_id)
        .single();
  
      if (menuItemError) {
        console.error('Menu item not found or error fetching:', menuItemError);
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
        // Increment quantity if item exists
        const { error: updateError } = await supabase
          .from('carts')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
  
        if (updateError) {
          console.error('Error updating cart item quantity:', updateError);
        } else {
          setCart((prevCart) => ({
            ...prevCart,
            [cartKey]: prevCart[cartKey].map((cartItem) =>
              cartItem.id === existingItem.id
                ? { ...cartItem, quantity: existingItem.quantity + 1 }
                : cartItem
            ),
          }));
        }
      } else {
        // Add new item to cart if it doesn't exist
        const { data: insertedData, error: insertError } = await supabase
          .from('carts')
          .insert({
            menu_item_id: item.menu_item_id,
            restaurant_id: restaurantId,
            table_id: tableId,
            quantity: 1,
          })
          .select(); // Return the inserted row
  
        if (insertError) {
          console.error('Error adding new item to cart:', insertError);
        } else {
          const newCartItem = {
            id: insertedData[0].id,
            menu_item_id: menuItemData.id,
            name: menuItemData.name,
            price: menuItemData.price,
            quantity: 1,
          };
          setCart((prevCart) => ({
            ...prevCart,
            [cartKey]: [...(prevCart[cartKey] || []), newCartItem],
          }));
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
      } else {
        setCart((prevCart) => ({
          ...prevCart,
          [cartKey]: prevCart[cartKey].map((cartItem) =>
            cartItem.menu_item_id === menu_item_id ? { ...cartItem, quantity } : cartItem
          ),
        }));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      const { error } = await supabase.from('carts').delete().eq('id', id);
      if (error) console.error('Error removing from cart:', error);
      else {
        setCart((prevCart) => ({
          ...prevCart,
          [cartKey]: prevCart[cartKey].filter((cartItem) => cartItem.id !== id),
        }));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const clearCart = async () => {
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('table_id', tableId);

      if (error) console.error('Error clearing cart:', error);
      else {
        setCart((prevCart) => ({
          ...prevCart,
          [cartKey]: [],
        }));
      }
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
