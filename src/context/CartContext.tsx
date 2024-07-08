import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setCart: (cart: CartItem[]) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  tableId: string | null;
  setTableId: (id: string) => void;
  cartId: string | null;  // Add cartId to the context
  setCartId: (id: string) => void;  // Add setter for cartId
};

type CartProviderProps = {
  children: ReactNode;
  tableId: string;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<CartProviderProps> = ({ children, tableId }) => {
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<string>(tableId);
  const [cartId, setCartIdState] = useState<string | null>(null);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCartState((prevCart) => [
      ...prevCart,
      { ...item, id: `${item.menu_item_id}-${Date.now()}` },
    ]);
  };

  const removeFromCart = (id: string) => {
    setCartState((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartState([]);
  };

  const setCart = (cart: CartItem[]) => {
    setCartState(cart);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const setTableId = (id: string) => {
    setCurrentTableId(id);
  };

  const setCartId = (id: string) => {
    setCartIdState(id);
  };

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    const storedCartId = localStorage.getItem('cartId');
    if (storedCart) {
      setCartState(JSON.parse(storedCart));
    }
    if (storedCartId) {
      setCartIdState(storedCartId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (cartId) {
      localStorage.setItem('cartId', cartId);
    }
  }, [cart, cartId]);

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
        tableId: currentTableId,
        setTableId,
        cartId,
        setCartId,
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
