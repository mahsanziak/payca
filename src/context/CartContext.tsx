import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
  id: string;
  menu_item_id: string;  // Add menu_item_id here
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setCart: (cart: CartItem[]) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC = ({ children }) => {
  const [cart, updateCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    updateCart((prevCart) => [
      ...prevCart,
      { ...item, id: `${item.menu_item_id}-${Date.now()}` },
    ]);
  };

  const removeFromCart = (id: string) => {
    updateCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    updateCart([]);
  };

  const setCart = (cart: CartItem[]) => {
    updateCart(cart);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      updateCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        setCart,
        isOpen,
        openCart,
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
