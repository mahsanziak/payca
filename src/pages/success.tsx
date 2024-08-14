import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const SuccessPage: React.FC = () => {
  const router = useRouter();
  const { session_id, restaurant_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!session_id) return;

      try {
        let attempts = 0;
        let maxAttempts = 5;
        let receiptFound = false;

        while (attempts < maxAttempts && !receiptFound) {
          const response = await fetch(`/api/get-checkout-session?session_id=${session_id}`);
          const session = await response.json();

          if (session?.receipt_url) {
            setReceiptUrl(session.receipt_url);
            receiptFound = true;
          } else {
            attempts += 1;
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching checkout session:', error);
        setLoading(false);
      }
    };

    fetchSession();
  }, [session_id]);

  const handleSubmitFeedback = async () => {
    if (!restaurant_id) return;

    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id,
          feedback_text: feedback,
          rating,
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container">
      <h1 className="text-center text-3xl font-bold my-8">Payment Successful!</h1>
      <p className="text-center">Thank you for your payment. Your transaction was successful.</p>
      
      {receiptUrl ? (
        <div className="text-center my-8">
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            View Receipt
          </a>
          <a href={receiptUrl} download="receipt.pdf" className="btn-secondary ml-4">
            Download Receipt
          </a>
        </div>
      ) : (
        <p className="text-center">We are generating your receipt. Please wait...</p>
      )}

      <div className="text-center my-8">
        <button onClick={() => router.push('/')} className="btn-secondary">
          Return to Home
        </button>
      </div>

      <div className="feedback-section my-8">
        <h2 className="text-2xl font-semibold">We value your feedback!</h2>
        {!feedbackSubmitted ? (
          <div className="feedback-form my-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              className="feedback-textarea"
            />
            <div className="rating-section my-4">
              <label htmlFor="rating" className="rating-label">Rating: </label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value, 10))}
                className="rating-select"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleSubmitFeedback} className="btn-primary">
              Submit Feedback
            </button>
          </div>
        ) : (
          <p className="text-green-500">Thank you for your feedback!</p>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .btn-primary {
          background-color: #0070f3;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
        }
        .btn-primary:hover {
          background-color: #005bb5;
        }
        .btn-secondary {
          background-color: #eaeaea;
          color: black;
          padding: 10px 20px;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background-color: #cacaca;
        }
        .ml-4 {
          margin-left: 1rem;
        }
        .feedback-section {
          margin-top: 2rem;
        }
        .feedback-textarea {
          width: 100%;
          padding: 10px;
          margin-top: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          resize: vertical;
          min-height: 100px;
        }
        .rating-section {
          margin-top: 10px;
        }
        .rating-label {
          font-weight: bold;
        }
        .rating-select {
          margin-left: 10px;
          padding: 5px;
          border-radius: 5px;
          border: 1px solid #ccc;
        }
      `}</style>
    </div>
  );
};

export default SuccessPage;
