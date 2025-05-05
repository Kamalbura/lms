import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import confetti from 'canvas-confetti';
import Button from './Button';

const CompletionCelebration = ({ 
  title = 'Congratulations!',
  message = 'You have successfully completed this course.',
  onContinue,
  score,
  showConfetti = true,
  achievement,
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (showConfetti) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }

    // Animate content after confetti
    setTimeout(() => setShowContent(true), 300);
  }, [showConfetti]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`
          bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 text-center
          transform transition-all duration-300
          ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}
      >
        {achievement && (
          <div className="w-24 h-24 mx-auto mb-6 animate-float">
            <img 
              src={achievement.icon} 
              alt={achievement.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {score !== undefined && (
          <div className="mb-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              {/* Progress circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-gray-100"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-primary-500"
                  strokeDasharray={352} // 2 * PI * radius
                  strokeDashoffset={352 - (352 * score) / 100}
                />
              </svg>
              {/* Score text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {score}%
                </span>
              </div>
            </div>
          </div>
        )}

        {achievement && (
          <div className="mb-6 p-4 bg-primary-50 rounded-lg">
            <h3 className="font-semibold text-primary-900 mb-1">
              {achievement.name}
            </h3>
            <p className="text-sm text-primary-700">
              {achievement.description}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onContinue}
          >
            Continue Learning
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            href="/dashboard"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

CompletionCelebration.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onContinue: PropTypes.func.isRequired,
  score: PropTypes.number,
  showConfetti: PropTypes.bool,
  achievement: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }),
};

export default CompletionCelebration;
