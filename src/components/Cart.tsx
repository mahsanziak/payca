import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type CartItem = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
};

const Cart: React.FC<{ restaurantId: string, tableId: string }> = ({ restaurantId, tableId }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCartItems = async () => {
      const { data, error } = await supabase
        .from('carts')
        .select('id, menu_item_id, quantity, menu_items(name, price)')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId);

      if (error) {
        console.error('Error fetching cart items:', error);
      } else {
        const formattedCartItems = data.map((item) => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: item.menu_items.name,
          price: item.menu_items.price,
          quantity: item.quantity,
        }));
        setCartItems(formattedCartItems);
      }
      setLoading(false);
    };

    fetchCartItems();
  }, [restaurantId, tableId]);

  if (loading) return <p>Loading...</p>;

  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    // Implement Stripe Checkout here
    alert('Proceeding to checkout');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Cart</h2>
      {cartItems.length === 0 ? (
        <p>No items in the cart.</p>
      ) : (
        <>
          <ul>
            {cartItems.map(item => (
              <li key={item.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <h3 className="text-lg">{item.name}</h3>
                  <p className="text-sm">Quantity: {item.quantity}</p>
                </div>
                <span className="text-lg font-bold">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="text-right mt-4">
            <h3 className="text-xl font-bold">Total: ${totalAmount.toFixed(2)}</h3>
            <button
              onClick={handleCheckout}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-700 transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
