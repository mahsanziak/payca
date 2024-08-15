import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../../utils/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

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
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
      } else {
        const formattedCartItems = data.map((item) => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: item.menu_items?.name || 'Unnamed item',
          price: item.menu_items?.price || 0,
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

    const formattedCartItems = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // convert price to cents
      },
      quantity: item.quantity,
    }));

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

  const handleSubmitFeedback = async () => {
    if (!restaurantId) return;

    try {
      const { error } = await supabase.from('feedbacks').insert([
        {
          feedback_text: feedback,
          restaurant_id: restaurantId,
          rating: rating,
        }
      ]);

      if (error) {
        console.error('Failed to submit feedback:', error);
        alert('Failed to submit feedback.');
      } else {
        setFeedbackSubmitted(true);
        alert('Feedback submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Unexpected error occurred.');
    }
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

      {!feedbackSubmitted ? (
        <div className="feedback-container">
          <h2 className="text-xl font-semibold">Leave Feedback</h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter your feedback here..."
            className="feedback-textarea"
          />
          <div className="rating-container">
            <label htmlFor="rating" className="rating-label">Rating:</label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="rating-select"
            >
              {[1, 2, 3, 4, 5].map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSubmitFeedback} className="submit-feedback-button">
            Submit Feedback
          </button>
        </div>
      ) : (
        <p className="text-green-500">Thank you for your feedback!</p>
      )}

      <button
        className="back-to-menu-button"
        onClick={() => router.push(`/restaurants/${restaurantId}/tables/${tableId}`)}
      >
        Back to Menu
      </button>

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
          max-height: 150px; /* Limit the height */
          overflow-y: scroll; /* Add scrollbar if necessary */
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
        .feedback-container {
          padding: 20px;
          border: 1px solid #ffcc00;
          background-color: #2a2a2a;
          border-radius: 5px;
          margin-top: 20px;
        }
        .feedback-textarea {
          width: 100%;
          padding: 10px;
          margin-top: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          resize: vertical;
          min-height: 100px;
        }
        .rating-container {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rating-label {
          font-weight: bold;
          color: #ffcc00;
        }
        .rating-select {
          padding: 5px;
          border-radius: 5px;
          border: 1px solid #ccc;
          background-color: #333;
          color: #ffcc00;
        }
        .submit-feedback-button {
          margin-top: 10px;
          padding: 10px;
          border-radius: 5px;
          background-color: #333;
          color: #ffcc00;
          border: 1px solid #ffcc00;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .submit-feedback-button:hover {
          background-color: #444;
        }
        .back-to-menu-button {
          margin-top: 20px;
          padding: 10px;
          border-radius: 5px;
          background-color: #333;
          color: #ffcc00;
          border: 1px solid #ffcc00;
          cursor: pointer;
          text-align: center;
        }
        .back-to-menu-button:hover {
          background-color: #444;
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
