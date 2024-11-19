import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';

type CartItem = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateCartItemQuantity: (menu_item_id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  saveCartToDB: (restaurantId: string, tableId: string) => Promise<void>;
};

type CartProviderProps = {
  children: ReactNode;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Add a new item to the cart
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.menu_item_id === item.menu_item_id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.menu_item_id === item.menu_item_id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      const newItem: CartItem = { ...item, id: crypto.randomUUID() };
      return [...prevCart, newItem];
    });
  };

  // Update the quantity of a cart item
  const updateCartItemQuantity = (menu_item_id: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((cartItem) =>
        cartItem.menu_item_id === menu_item_id
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  };

  // Remove an item from the cart
  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((cartItem) => cartItem.id !== id));
  };

  // Clear all items in the cart
  const clearCart = () => {
    setCart([]);
  };

  // Save the cart to the database
  const saveCartToDB = async (restaurantId: string, tableId: string) => {
    try {
      const { data, error } = await supabase.from('carts').upsert(
        cart.map((item) => ({
          restaurant_id: restaurantId,
          table_id: tableId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
        }))
      );

      if (error) {
        console.error('Error saving cart to database:', error);
        throw error;
      }

      console.log('Cart saved to database:', data);
    } catch (error) {
      console.error('Failed to save cart to DB:', error);
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
        saveCartToDB,
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
