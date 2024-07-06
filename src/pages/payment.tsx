import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentRequestButtonElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const PaymentForm: React.FC = () => {
  const { cart, cartId, setCart } = useCart();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<stripe.paymentRequest.StripePaymentRequest | null>(null);
  const { restaurantId, tableId } = router.query;

  useEffect(() => {
    if (cart.length === 0) {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      } else {
        router.push('/');
        return;
      }
    }

    if (stripe) {
      const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0) * 100; // Convert to cents

      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: Math.round(totalAmount), // Ensure the amount is an integer
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (ev) => {
        const { data: session } = await axios.post('/api/create-checkout-session', {
          cartItems: cart,
          successUrl: `${window.location.origin}/order-confirmation?restaurantId=${restaurantId}&tableId=${tableId}`,
          cancelUrl: `${window.location.origin}/payment?restaurantId=${restaurantId}&tableId=${tableId}`,
        });

        const result = await stripe?.redirectToCheckout({ sessionId: session.id });

        if (result?.error) {
          ev.complete('fail');
          console.error(result.error.message);
        } else {
          ev.complete('success');
          router.push(`/order-confirmation?restaurantId=${restaurantId}&tableId=${tableId}`);
        }
      });
    }
  }, [stripe, cart, router, restaurantId, tableId]);

  if (cart.length === 0) {
    return <p>Loading...</p>;
  }

  const handlePayment = async () => {
    const stripe = await stripePromise;

    try {
      const { data: session } = await axios.post('/api/create-checkout-session', {
        cartItems: cart,
        successUrl: `${window.location.origin}/order-confirmation?restaurantId=${restaurantId}&tableId=${tableId}`,
        cancelUrl: `${window.location.origin}/payment?restaurantId=${restaurantId}&tableId=${tableId}`,
      });

      const result = await stripe?.redirectToCheckout({ sessionId: session.id });

      if (result?.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">Proceed to Payment</h1>
        <div className="loader mb-4"></div>
        {paymentRequest && (
          <PaymentRequestButtonElement
            options={{ paymentRequest }}
            className="PaymentRequestButton"
          />
        )}
        {!paymentRequest && (
          <button
            onClick={handlePayment}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          >
            Proceed to Payment
          </button>
        )}
      </div>
    </div>
  );
};

const Payment: React.FC = () => (
  <Elements stripe={stripePromise}>
    <PaymentForm />
  </Elements>
);

export default Payment;
