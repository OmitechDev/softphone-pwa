import React from 'react';
import { CallHistoryItem } from '../interfaces/Call';

interface CallHistoryProps {
  history: CallHistoryItem[];
  onCallBack: (extension: string) => void;
}

const CallHistory: React.FC<CallHistoryProps> = ({ history, onCallBack }) => {
  // Formatear duración en MM:SS
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Formatear fecha
  const formatDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const callDate = new Date(date);
    const callDay = new Date(callDate.getFullYear(), callDate.getMonth(), callDate.getDate());
    
    if (callDay.getTime() === today.getTime()) {
      return 'Hoy ' + callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (callDay.getTime() === yesterday.getTime()) {
      return 'Ayer ' + callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return callDate.toLocaleDateString() + ' ' + callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="p-4 font-semibold text-lg border-b">Historial de llamadas</h2>
      
      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No hay llamadas registradas
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y">
          {history.map((call) => (
            <div 
              key={call.id} 
              className="flex items-center p-4 hover:bg-gray-50"
            >
              {/* Icono de dirección */}
              <div className={`p-2 rounded-full mr-3 
                ${call.direction === 'inbound' 
                  ? call.status === 'missed' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'
                  : 'bg-blue-100 text-blue-500'
                }`}
              >
                {call.direction === 'inbound' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              {/* Información de la llamada */}
              <div className="flex-1">
                <div className="font-medium">
                  {call.name || `Ext: ${call.extension}`}
                  {call.status === 'missed' && 
                    <span className="text-red-500 text-sm ml-2">Perdida</span>
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(new Date(call.timestamp))}
                </div>
              </div>
              
              {/* Duración y botón de llamada */}
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500 mb-1">{formatDuration(call.duration)}</div>
                <button 
                  onClick={() => onCallBack(call.extension)}
                  className="p-2 rounded-full bg-green-100 text-green-500 hover:bg-green-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CallHistory;