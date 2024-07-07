import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const Payment: React.FC = () => {
  const { cart, setCart, cartId } = useCart();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<stripe.paymentRequest.StripePaymentRequest | null>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      router.push('/');
    }
  }, [setCart, router]);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: cart.reduce((total, item) => total + item.price * item.quantity * 100, 0),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
        }
      });
    }
  }, [stripe, cart]);

  const handlePayment = async () => {
    const userId = '05d0b17b-3ba0-4203'; // Replace with actual user ID from authentication context
    const restaurantId = '05d0b17b-3ba0-4203-9adf-6a09085f4b13'; // Replace with actual restaurant ID

    const { data: session } = await axios.post('/api/create-checkout-session', {
      cartItems: cart,
      successUrl: `${window.location.origin}/order-confirmation`,
      cancelUrl: `${window.location.origin}/payment`,
    });

    const { error } = await stripe?.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">Processing Payment...</h1>
        <div className="loader mb-4"></div>
        <button
          onClick={handlePayment}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
        >
          Simulate Payment
        </button>
      </div>
    </div>
  );
};

export default Payment;
