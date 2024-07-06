import React from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';

const CartSidebar: React.FC = () => {
  const { cart, isOpen, closeCart, removeFromCart } = useCart();
  const router = useRouter();
  const { restaurantId, tableId } = router.query;

  const handleProceedToPayment = () => {
    router.push({
      pathname: '/payment',
      query: { restaurantId, tableId }
    });
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Your Cart</h2>
          <button onClick={closeCart} className="text-gray-700 hover:text-gray-900">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div>
          {cart.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center mb-4">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-gray-600">${item.price.toFixed(2)} x {item.quantity}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-blue-500 text-white py-2 mt-4 rounded-lg hover:bg-blue-600 transition"
          >
            Proceed to Payment
          </button>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
