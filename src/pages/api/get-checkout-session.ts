import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../utils/supabaseClient'; // Adjust the import path as needed

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    // Fetch the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent'],
    });

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
    const receiptUrl = paymentIntent?.charges?.data[0]?.receipt_url;

    // Extract restaurant_id and table_id from the session's metadata or request data
    const { restaurant_id, table_id } = session.metadata || {};

    if (!restaurant_id || !table_id) {
      return res.status(400).json({ error: 'Missing restaurant_id or table_id in session metadata' });
    }

    // Delete the cart items for the specified restaurant_id and table_id
    const { error: deleteError } = await supabase
      .from('carts')
      .delete()
      .eq('restaurant_id', restaurant_id)
      .eq('table_id', table_id);

    if (deleteError) {
      console.error('Error deleting cart items:', deleteError);
      return res.status(500).json({ error: 'Failed to delete cart items' });
    }

    res.status(200).json({ receipt_url: receiptUrl });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Unable to retrieve checkout session' });
  }
}
