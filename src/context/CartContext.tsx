import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    const updatedCart = cart.map(cartItem =>
      cartItem.menu_item_id === menu_item_id
        ? { ...cartItem, quantity }
        : cartItem
    ).filter(cartItem => cartItem.quantity > 0);
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

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, isOpen, toggleCart, closeCart }}>
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
