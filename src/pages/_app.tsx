import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }: AppProps) {
  const tableId = '02c57c9d-e882-4350-8d1d-81ec2c5c0ba5'; // Replace with actual table ID from your application context

  return (
    <AuthProvider>
      <CartProvider tableId={tableId}>
        <Component {...pageProps} />
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
