import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type FeedbacksProps = {
  restaurantId: string;
};

const Feedbacks: React.FC<FeedbacksProps> = ({ restaurantId }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);

  const handleFeedbackSubmit = async () => {
    if (!restaurantId) {
      alert('Restaurant ID is missing!');
      return;
    }

    if (!feedbackText || rating === 0) {
      alert('Please provide a valid feedback and rating.');
      return;
    }

    try {
      const { error } = await supabase.from('feedbacks').insert({
        restaurant_id: restaurantId,
        feedback_text: feedbackText,
        rating,
      });

      if (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback.');
      } else {
        setFeedbackText('');
        setRating(0);
        alert('Thank you for your feedback!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred.');
    }
  };

  return (
    <div className="feedbacks-container">
      <h2 className="text-3xl font-bold text-center text-gold mb-4">Leave Your Feedback</h2>
      <textarea
        className="feedback-textarea"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder="Write your feedback here..."
      />
      <div className="rating-container">
        <label className="text-gold text-lg">Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rating-dropdown"
        >
          <option value={0}>Select a rating</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <button className="submit-button" onClick={handleFeedbackSubmit}>
        Submit Feedback
      </button>
      <style jsx>{`
        .feedbacks-container {
          background-color: #2a2a2a;
          color: #f4f4f4;
          border: 1px solid #ffcc00;
          padding: 20px;
          border-radius: 8px;
          margin-top: 32px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .feedback-textarea {
          width: 100%;
          height: 100px;
          margin: 16px 0;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #ffcc00;
          background-color: #333;
          color: #f4f4f4;
        }
        .feedback-textarea::placeholder {
          color: #aaa;
        }
        .rating-container {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        .rating-container label {
          margin-right: 8px;
        }
        .rating-dropdown {
          padding: 8px;
          border-radius: 5px;
          border: 1px solid #ffcc00;
          background-color: #333;
          color: #f4f4f4;
        }
        .submit-button {
          display: block;
          width: 100%;
          padding: 12px 16px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          background-color: #ffcc00;
          color: #2a2a2a;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .submit-button:hover {
          background-color: #f7d200;
        }
      `}</style>
    </div>
  );
};

export default Feedbacks;
