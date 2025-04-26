import React from 'react';

interface CallButtonProps {
  isActive: boolean;
  onCall: () => void;
  onHangup: () => void;
}

const CallButton: React.FC<CallButtonProps> = ({ isActive, onCall, onHangup }) => {
  return (
    <button
      onClick={isActive ? onHangup : onCall}
      className={`rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl shadow-lg transition-all
        ${isActive 
          ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' 
          : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
        }`}
    >
      {isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 3a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L20 6.161V5a2 2 0 00-2-2H4z" />
          <path d="M18 8.368l-8.441 4.22a1.25 1.25 0 01-1.118 0L0 8.368V14a2 2 0 002 2h16a2 2 0 002-2V8.368z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      )}
    </button>
  );
};

export default CallButton;