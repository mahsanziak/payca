import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient'; // Adjust the import path as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { restaurant_id, feedback_text, rating } = req.body;

    if (!restaurant_id || !feedback_text || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([
          { restaurant_id, feedback_text, rating }
        ]);

      if (error) {
        console.error('Error submitting feedback:', error);
        return res.status(500).json({ error: 'Failed to submit feedback' });
      }

      res.status(200).json({ message: 'Feedback submitted successfully', data });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
