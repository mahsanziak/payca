import React from 'react';
import { useRouter } from 'next/router';

const OrderConfirmation: React.FC = () => {
  const router = useRouter();
  const { order_number, restaurantId, tableId } = router.query;

  const handleClose = () => {
    router.push(`/restaurants/${restaurantId}/tables/${tableId}`);
  };

  return (
    <div className="container">
      <div className="confirmation-container">
        <h1 className="confirmation-heading">Order Confirmed!</h1>
        <p className="confirmation-message">Your order is on the way!</p>
        <p className="order-number">
          <span>Your order number is:</span>
          <strong> {order_number || 'N/A'}</strong>
        </p>
        <button className="back-to-menu-button" onClick={handleClose}>
          Back to Menu
        </button>
      </div>
      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: rgba(42, 42, 42, 0.95);
          padding: 20px;
        }
        .confirmation-container {
          border: 1px solid #ffcc00;
          padding: 20px;
          background-color: #2a2a2a;
          border-radius: 10px;
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .confirmation-heading {
          font-size: 32px;
          margin-bottom: 15px;
          color: #ffcc00;
        }
        .confirmation-message {
          font-size: 18px;
          color: #fff;
          margin-bottom: 20px;
        }
        .order-number {
          font-size: 20px;
          color: #ffcc00;
          margin-bottom: 30px;
        }
        .order-number span {
          color: #fff;
        }
        .back-to-menu-button {
          padding: 10px 20px;
          background-color: #333;
          color: #ffcc00;
          border: 1px solid #ffcc00;
          border-radius: 5px;
          cursor: pointer;
          text-align: center;
        }
        .back-to-menu-button:hover {
          background-color: #444;
        }
      `}</style>
    </div>
  );
};

export default OrderConfirmation;
