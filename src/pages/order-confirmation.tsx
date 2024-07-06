import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabaseClient';

const OrderConfirmation: React.FC = () => {
  const { cart, cartId } = useCart();
  const router = useRouter();

  useEffect(() => {
    const saveOrder = async () => {
      const userId = 'YOUR_USER_ID'; // Replace with actual user ID
      const restaurantId = 'YOUR_RESTAURANT_ID'; // Replace with actual restaurant ID

      const { data: order, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            restaurant_id: restaurantId,
            table_id: cartId,
            total_price: cart.reduce((total, item) => total + item.price * item.quantity, 0),
            status: 'pending',
          },
        ])
        .select('*')
        .single();

      if (!error) {
        const orderItems = cart.map((item) => ({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
        }));

        await supabase.from('order_items').insert(orderItems);

        // Clear cart (both state and local storage)
        localStorage.removeItem('cart');
        localStorage.removeItem('cartId');
      } else {
        console.error('Error creating order:', error);
      }
    };

    if (cart.length > 0) {
      saveOrder();
    } else {
      router.push('/');
    }
  }, [cart, cartId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">Your Order has been Placed!</h1>
        <div className="loader mb-4"></div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id} className="flex items-center mb-4">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">${item.price.toFixed(2)} x {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
