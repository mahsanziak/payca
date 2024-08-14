import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient'; // Ensure the path is correct

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

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const existingItem = cart.find(cartItem => cartItem.menu_item_id === item.menu_item_id);

    if (existingItem) {
      const updatedCart = cart.map(cartItem =>
        cartItem.menu_item_id === item.menu_item_id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      setCart(updatedCart);
    } else {
      const newItem = { ...item, id: `${item.menu_item_id}-${Date.now()}`, quantity: 1 };
      setCart(prevCart => [...prevCart, newItem]);
    }
  };

  const updateCartItemQuantity = (menu_item_id: string, quantity: number) => {
    const updatedCart = cart
      .map(cartItem =>
        cartItem.menu_item_id === menu_item_id
          ? { ...cartItem, quantity }
          : cartItem
      )
      .filter(cartItem => cartItem.quantity > 0);
    setCart(updatedCart);
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleCart = () => setIsOpen(!isOpen);
  const closeCart = () => setIsOpen(false);

  // Function to save the cart to the database
  const saveCartToDB = async (restaurantId: string, tableId: string) => {
    try {
      const { error } = await supabase.from('carts').insert(
        cart.map(item => ({
          restaurant_id: restaurantId,
          table_id: tableId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
        }))
      );

      if (error) {
        console.error('Error saving cart to database:', error);
        alert(`Failed to save cart: ${error.message}`);
      } else {
        console.log('Cart saved to database successfully');
      }
    } catch (error) {
      console.error('Unexpected error saving cart to database:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, isOpen, toggleCart, closeCart, saveCartToDB }}>
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
