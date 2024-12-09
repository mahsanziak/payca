import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../../utils/supabaseClient';

type CartItem = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
};

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { restaurantId, tableId } = router.query;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!restaurantId || !tableId) return;

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


  const handleSendOrder = async () => {
    if (!restaurantId || !tableId) {
      alert('Invalid restaurant or table details.');
      return;
    }
  
    try {
      const total_price = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
      // Generate a unique order_number for the restaurant
      const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing orders:', fetchError);
      alert('Failed to generate order number.');
      return;
    }
  
    const nextOrderNumber = existingOrders.length > 0 ? existingOrders[0].order_number + 1 : 1;
  
      // Format items as requested
      const items = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        menu_item_id: item.menu_item_id,
      }));
  
      // Insert the order into the `orders` table
      const { data: insertedOrder, error: insertError } = await supabase.from('orders').insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        total_price,
        status: 'pending',
        order_number: nextOrderNumber,
        items, // Save the cart items as JSON
      }).select();
  
      if (insertError) {
        console.error('Error sending order:', insertError);
        alert('Failed to send order.');
      } else {
        const order = insertedOrder[0]; // Get the inserted order
  
        // Redirect to the order confirmation page with the order number
        router.push(
          `/restaurants/${restaurantId}/tables/order-confirmation?order_number=${order.order_number}&restaurantId=${restaurantId}&tableId=${tableId}`
        );
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred.');
    }
  };
  

  

  const handleBackToMenu = () => {
    router.push(`/restaurants/${restaurantId}/tables/${tableId}`);
  };

  if (loading) return <p>Loading...</p>;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * 0.15; // Example tax calculation (15%)
  const total = subtotal + taxes;

  return (
    <div className="container">
      <div className="cart-container">
        <h1 className="order-summary-heading">Order Summary</h1>
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-details">
                <span className="cart-item-name">{item.name}</span>
                <span className="cart-item-price">
                  ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="order-total">
          <div className="order-total-item">
            <span className="order-total-name">Subtotal</span>
            <span className="order-total-price">${subtotal.toFixed(2)}</span>
          </div>
          <div className="order-total-item">
            <span className="order-total-name">Taxes</span>
            <span className="order-total-price">${taxes.toFixed(2)}</span>
          </div>
          <div className="total-container">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="button-container">
        <button
          className="send-order-button"
          onClick={handleSendOrder}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Send Order'}
        </button>
        <button
          className="back-to-menu-button"
          onClick={handleBackToMenu}
        >
          Back to Menu
        </button>
      </div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 625px;
          margin: 40px auto;
        }
        .cart-container {
          border: 1px solid #ffcc00;
          padding: 20px;
          background-color: #2a2a2a;
        }
        .order-summary-heading {
          text-align: center;
          font-size: 32px;
          margin-bottom: 20px;
          color: #ffcc00;
        }
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cart-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px;
          background-color: #333;
          border: 1px solid #ffcc00;
          border-radius: 5px;
        }
        .order-total {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .order-total-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-total-price {
          font-size: 14px;
          color: #ffcc00;
        }
        .total-container {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 24px;
          font-weight: bold;
          color: #ffcc00;
        }
        .button-container {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .send-order-button,
        .back-to-menu-button {
          flex: 1;
          padding: 10px 20px;
          background-color: #333;
          color: #ffcc00;
          border: 1px solid #ffcc00;
          border-radius: 5px;
          cursor: pointer;
          text-align: center;
        }
        .send-order-button:hover,
        .back-to-menu-button:hover {
          background-color: #444;
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
