import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const CompletionCelebration = ({ show = false, onComplete }) => {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.2}
      />
      <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-lg">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-3">Congratulations!</h2>
        <p className="text-lg mb-4">You've completed this course!</p>
        <button 
          onClick={() => {
            setIsActive(false);
            if (onComplete) onComplete();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default CompletionCelebration;
