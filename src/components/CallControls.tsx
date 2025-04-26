import React from 'react';
import { ActiveCallState } from '../interfaces/Call';

interface CallControlsProps {
  call: ActiveCallState;
  onHangup: () => void;
  onMute: () => void;
  onHold: () => void;
  onTransfer: () => void;
  onConference: () => void;
  onToggleDialpad: () => void;
  showDialpad: boolean;
}

const CallControls: React.FC<CallControlsProps> = ({
  call,
  onHangup,
  onMute,
  onHold,
  onTransfer,
  onConference,
  onToggleDialpad,
  showDialpad
}) => {
  const isCallActive = call.status === 'established';

  return (
    <div className="w-full">
      {/* Botones principales - Primera fila */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {/* Mute */}
        <button
          onClick={onMute}
          disabled={!isCallActive}
          className={`flex flex-col items-center justify-center p-2 rounded-lg
            ${isCallActive 
              ? call.isMuted 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'opacity-50 bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {call.isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
          <span className="text-xs">{call.isMuted ? 'Activar' : 'Silenciar'}</span>
        </button>

        {/* Hold */}
        <button
          onClick={onHold}
          disabled={!isCallActive}
          className={`flex flex-col items-center justify-center p-2 rounded-lg
            ${isCallActive 
              ? call.isOnHold 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'opacity-50 bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">{call.isOnHold ? 'Reanudar' : 'En espera'}</span>
        </button>

        {/* Teclado DTMF (movido a la primera fila) */}
        <button
          onClick={onToggleDialpad}
          disabled={!isCallActive}
          className={`flex flex-col items-center justify-center p-2 rounded-lg
            ${isCallActive 
              ? showDialpad
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'opacity-50 bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs">Teclado</span>
        </button>

        {/* Transfer */}
        <button
          onClick={onTransfer}
          disabled={!isCallActive}
          className={`flex flex-col items-center justify-center p-2 rounded-lg
            ${isCallActive 
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
              : 'opacity-50 bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-xs">Transferir</span>
        </button>

        {/* Conference */}
        <button
          onClick={onConference}
          disabled={!isCallActive}
          className={`flex flex-col items-center justify-center p-2 rounded-lg
            ${isCallActive 
              ? call.isInConference 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'opacity-50 bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs">Conferencia</span>
        </button>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-2 gap-2">
        {/* Historial */}
        <button
          onClick={() => window.location.href = '#history'}
          className="py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
        >
          <span>Historial</span>
        </button>

        {/* Hangup button */}
        <button
          onClick={onHangup}
          className="py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"
        >
          <span>Colgar</span>
        </button>
      </div>
    </div>
  );
};

export default CallControls;