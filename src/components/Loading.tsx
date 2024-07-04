// src/components/Loading.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons';

const Loading: React.FC<{ restaurantName: string }> = ({ restaurantName }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="loader mb-4">
          <FontAwesomeIcon icon={faUtensils} size="3x" className="text-gray-700" />
        </div>
        <h1 className="text-2xl font-bold">{restaurantName}</h1>
      </div>
    </div>
  );
};

export default Loading;
