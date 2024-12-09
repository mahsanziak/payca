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
            = ${(item.price * item.quantity).toFixed(2)}
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
    width: 90%; /* Adjust width for smaller devices */
    max-width: 625px; /* Limit max width for larger screens */
    margin: 40px auto;
    background-color: #2a2a2a;
    border: 1px solid #ffcc00;
    border-radius: 8px;
    padding: 20px;
  }
  .order-summary-heading {
    text-align: center;
    font-size: 24px; /* Adjust heading size */
    margin-bottom: 20px;
    color: #ffcc00;
  }
  .cart-items {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
  }
  .cart-item {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap; /* Wrap content for smaller screens */
    padding: 10px;
    background-color: #333;
    border: 1px solid #ffcc00;
    border-radius: 5px;
  }
  .cart-item-name {
    font-weight: bold;
    color: #fff;
    flex: 1; /* Adjust name size dynamically */
    margin-bottom: 5px; /* Add spacing for smaller screens */
  }
  .cart-item-pricing {
    display: flex;
    justify-content: space-between;
    width: 100%; /* Adjust for smaller screens */
  }
  .cart-item-breakdown {
    color: #ffcc00;
  }
  .cart-item-total {
    font-weight: bold;
    color: #ffcc00;
  }
  .order-summary-totals {
    margin-top: 20px;
  }
  .order-total-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-top: 1px solid #444;
    font-size: 14px; /* Adjust font size for smaller screens */
  }
  .order-total-item.total {
    border-top: 2px solid #ffcc00;
    font-weight: bold;
  }
  .order-total-label {
    color: #ccc;
  }
  .order-total-value {
    color: #ffcc00;
  }
  .button-container {
    display: flex;
    flex-direction: column; /* Stack buttons vertically on smaller screens */
    gap: 10px;
    margin-top: 20px;
  }
  .send-order-button,
  .back-to-menu-button {
    padding: 10px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    color: #ffcc00;
    background-color: #333;
    border: 1px solid #ffcc00;
    border-radius: 5px;
    cursor: pointer;
    width: 100%; /* Make buttons take full width on smaller screens */
  }
  .send-order-button:hover,
  .back-to-menu-button:hover {
    background-color: #444;
  }
  .send-order-button:disabled {
    background-color: #555;
    color: #777;
    cursor: not-allowed;
  }

  /* Media Query for Smartphones */
  @media (max-width: 768px) {
    .order-summary-heading {
      font-size: 20px;
    }
    .order-total-item {
      font-size: 12px;
    }
    .cart-item {
      padding: 8px;
    }
    .cart-item-name {
      font-size: 14px;
    }
    .cart-item-pricing {
      flex-direction: column; /* Stack price and total vertically */
      align-items: flex-start;
    }
    .send-order-button,
    .back-to-menu-button {
      font-size: 14px;
    }
  }

  /* Media Query for Extra Small Devices */
  @media (max-width: 480px) {
    .container {
      padding: 15px;
    }
    .order-summary-heading {
      font-size: 18px;
    }
    .cart-item-name {
      font-size: 12px;
    }
    .cart-item-pricing {
      font-size: 12px;
    }
  }
`}</style>

  </div>
  
  );
};

export default PaymentPage;
