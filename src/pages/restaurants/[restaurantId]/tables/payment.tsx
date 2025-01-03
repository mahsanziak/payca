import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../../utils/supabaseClient';
// payment page (order summary)
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
        .select(`
          id,
          menu_item_id,
          quantity,
          menu_items (
            name,
            price
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId);

      if (error) {
        console.error('Error fetching cart items:', error);
        return;
      }

      const formattedCartItems = (data || []).map((item: any) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.menu_items?.name || 'Unknown item',
        price: item.menu_items?.price || 0,
        quantity: item.quantity,
      }));

      setCartItems(formattedCartItems);
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
        return;
      }
  
      // Clear the cart after the order is created
      const { error: clearError } = await supabase
        .from('carts')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId);
  
      if (clearError) {
        console.error('Error clearing cart:', clearError);
        alert('Failed to clear cart.');
        return;
      }
  
      const order = insertedOrder[0]; // Get the inserted order
  
      // Redirect to the order confirmation page with the order number
      router.push(
        `/restaurants/${restaurantId}/tables/order-confirmation?order_number=${order.order_number}&restaurantId=${restaurantId}&tableId=${tableId}`
      );
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
 
  const total = subtotal;

   return (
    <div className="container">
    <div className="cart-container">
      <h1 className="order-summary-heading">Order Summary</h1>
      <div className="cart-items">
  {cartItems.map((item) => (
    <div key={item.id} className="cart-item">
      <div className="cart-item-details">
        <span className="cart-item-name">{item.name}</span>
        <div className="cart-item-pricing">
          <span className="cart-item-breakdown">
            ${item.price.toFixed(2)} x {item.quantity}
          </span>
          <span className="cart-item-total">
          &nbsp;= ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  ))}
</div>

      <div className="order-summary-totals">
        <div className="order-total-item">
          <span className="order-total-label">Subtotal:</span>
          <span className="order-total-value">${subtotal.toFixed(2)}</span>
        </div>
        <div className="order-total-item total">
          <span className="order-total-label">Total:</span>
          <span className="order-total-value">${subtotal.toFixed(2)} <small>(plus applicable taxes if any)</small></span>
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
          width: 90%;
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #2a2a2a;
          border: 1px solid #ffcc00;
          border-radius: 8px;
        }
        .order-summary-heading {
          text-align: center;
          font-size: 24px;
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
          padding: 10px;
          background-color: #333;
          border: 1px solid #ffcc00;
          border-radius: 5px;
        }
        .cart-item-name {
          font-weight: bold;
          color: #fff;
          flex: 1;
        }
        .cart-item-pricing {
          color: #ffcc00;
          flex: 1;
          text-align: right;
        }
        .order-summary-totals {
          margin-top: 20px;
        }
        .order-total-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
        }
        .order-total-item.total {
          font-weight: bold;
          border-top: 2px solid #ffcc00;
        }
        .button-container {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .send-order-button,
        .back-to-menu-button {
          flex: 1;
          padding: 10px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          color: #ffcc00;
          background-color: #333;
          border: 1px solid #ffcc00;
          border-radius: 5px;
          cursor: pointer;
        }
        .send-order-button:hover,
        .back-to-menu-button:hover {
          background-color: #444;
        }
        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }
          .order-summary-heading {
            font-size: 20px;
          }
          .cart-item {
            font-size: 14px;
          }
        }
      `}</style>
  </div>
  
  );
};

export default PaymentPage;
