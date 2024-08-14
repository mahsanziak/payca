import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { cartItems, successUrl, cancelUrl } = req.body;

      // Log received data for debugging
      console.log('Received cartItems:', cartItems);
      console.log('Received successUrl:', successUrl);
      console.log('Received cancelUrl:', cancelUrl);

      // Validate the input data
      if (!cartItems || !successUrl || !cancelUrl) {
        console.error('Missing required parameters');
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cartItems.map((item: any) => {
          console.log('Processing item:', item); // Log each item to see if something is wrong
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.price_data.product_data.name,
              },
              unit_amount: item.price_data.unit_amount,
            },
            quantity: item.quantity,
          };
        }),
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`, // Include the session ID
        cancel_url: cancelUrl,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      console.error('Error creating checkout session:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
