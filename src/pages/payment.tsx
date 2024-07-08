import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabaseClient';
import { useStripe, useElements, PaymentRequestButtonElement, CardElement } from '@stripe/react-stripe-js';
import { PaymentRequest, loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const Payment: React.FC = () => {
  const { cart, setCart, cartId } = useCart();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      router.push('/');
    }
  }, [router, setCart]);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: Math.round(cart.reduce((total, item) => total + item.price * item.quantity, 0) * 100), // Amount in cents
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
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error("CardElement not found");
      return;
    }

    // You need to replace '{CLIENT_SECRET}' with the actual client secret obtained from your backend
    const clientSecret = '{CLIENT_SECRET}';

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Test User',
        },
      },
    });

    if (error) {
      console.error(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      const userId = 'YOUR_USER_ID'; // Replace with actual user ID
      const restaurantId = 'YOUR_RESTAURANT_ID'; // Replace with actual restaurant ID

      const { data: order, error: orderError } = await supabase
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

      if (!orderError) {
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
        setCart([]);

        router.push('/order-confirmation');
      } else {
        console.error('Error creating order:', orderError);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">Processing Payment...</h1>
        <div className="loader mb-4"></div>
        {paymentRequest && (
          <PaymentRequestButtonElement options={{ paymentRequest }} />
        )}
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
