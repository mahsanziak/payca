import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <CartProvider tableId={pageProps.tableId || ''}>
        <Elements stripe={stripePromise}>
          <Component {...pageProps} />
        </Elements>
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
