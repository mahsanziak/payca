import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../../utils/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGooglePay, faApplePay } from '@fortawesome/free-brands-svg-icons';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

  if (loading) return <p>Loading...</p>;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * 0.15; // Example tax calculation (15%)
  const total = subtotal + taxes;

  const handleCheckout = async () => {
    setLoading(true);
  
    const stripe = await stripePromise;
  
    // Ensure all prices are correctly converted to integers (cents)
    const formattedCartItems = cartItems.map(item => {
      const priceInCents = Math.round(item.price * 100);
      console.log(`Item: ${item.name}, Price: ${item.price}, Quantity: ${item.quantity}, Price in Cents: ${priceInCents}`);
  
      if (isNaN(priceInCents) || isNaN(item.quantity)) {
        console.error('Invalid price or quantity:', { price: item.price, quantity: item.quantity });
        alert('Invalid price or quantity detected. Please check the cart items.');
        setLoading(false);
        return null; // Exit early to avoid sending bad data to the server
      }
  
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity,
      };
    }).filter(Boolean); // Filter out any null values
  
    if (formattedCartItems.length === 0) {
      setLoading(false);
      return;
    }
  
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartItems: formattedCartItems,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cancel`,
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData.error);
      alert(`Server error: ${errorData.error}`);
      setLoading(false);
      return;
    }
  
    const session = await response.json();
  
    const result = await stripe?.redirectToCheckout({
      sessionId: session.id,
    });
  
    if (result?.error) {
      alert(result.error.message);
    }
  
    setLoading(false);
  };
  

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
      <div className="payment-method-container">
        <h2 className="payment-method-heading">Payment Method</h2>
        <div className="payment-method-options">
          <button
            className="payment-method-button"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Stripe'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 625px;
          margin: 40px auto;
        }
        .cart-container,
        .payment-method-container {
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
        .order-total-name {
          font-weight: bold;
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
        .payment-method-container {
          border: 1px solid #ffcc00;
          padding: 20px;
          background-color: #2a2a2a;
        }
        .payment-method-heading {
          font-size: 24px;
          text-align: center;
          color: #ffcc00;
        }
        .payment-method-options {
          display: flex;
          justify-content: space-around;
        }
        .payment-method-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          border: 1px solid #ffcc00;
          border-radius: 5px;
          background-color: #333;
          color: #ffcc00;
          cursor: pointer;
        }
        .payment-method-button:hover {
          background-color: #444;
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
