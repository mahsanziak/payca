import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

function MyApp({ Component, pageProps }: AppProps) {
  // Extract tableId from pageProps or other sources as needed
  const tableId = pageProps.tableId || '02c57c9d-e882-4350-8d1d-81ec2c5c0ba5'; // Replace with actual logic to obtain tableId

  return (
    <AuthProvider>
      <CartProvider tableId={tableId}>
        <Component {...pageProps} />
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
