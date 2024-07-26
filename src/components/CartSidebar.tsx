import React, { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';

type CartSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleProceedToPayment = () => {
    router.push('/payment');
  };

  const handleDecreaseQuantity = (item) => {
    updateCartItemQuantity(item.menu_item_id, item.quantity - 1);
  };

  const handleIncreaseQuantity = (item) => {
    updateCartItemQuantity(item.menu_item_id, item.quantity + 1);
  };

  const handleClearCart = async () => {
    clearCart();
  };

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out flex flex-col`}
    >
      <div className="p-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Your Cart</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-900">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {cart.length === 0 ? (
          <p className="text-gray-600">Your cart is empty.</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center mb-4">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">${item.price.toFixed(2)}</p>
                <div className="flex items-center mt-2">
                  <button
                    onClick={() => handleDecreaseQuantity(item)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-l"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 bg-gray-100">{item.quantity}</span>
                  <button
                    onClick={() => handleIncreaseQuantity(item)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-r"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-700 ml-4"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))
        )}
      </div>
      {cart.length > 0 && (
        <div className="p-4 flex-shrink-0 bg-white shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Subtotal</h3>
            <p className="text-gray-600">${subtotal.toFixed(2)}</p>
          </div>
          <button
            onClick={handleClearCart}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition mb-2"
          >
            Clear Cart
          </button>
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
