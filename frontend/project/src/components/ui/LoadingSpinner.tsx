import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${sizeClasses[size]} rounded-full border-gray-300 border-t-blue-600 animate-spin`} 
        role="status" 
        aria-label="Loading"
      ></div>
    </div>
  );
};

export default LoadingSpinner;