import React, { useEffect } from 'react';

interface IncomingCallNotificationProps {
  caller: string;
  phoneNumber: string;  // Número de teléfono claramente separado
  onAnswer: () => void;
  onDecline: () => void;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  caller,
  phoneNumber,
  onAnswer,
  onDecline
}) => {
  // Efecto para manejar pulsaciones de tecla
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Contestar con la tecla Enter
      if (e.key === 'Enter') {
        onAnswer();
      }
      // Rechazar con la tecla Escape
      else if (e.key === 'Escape') {
        onDecline();
      }
    };

    // Añadir listener
    window.addEventListener('keydown', handleKeyPress);

    // Eliminar listener al desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onAnswer, onDecline]);

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="bg-blue-500 text-white py-3 px-4 text-center">
        <h2 className="text-xl font-semibold">Softphone</h2>
      </div>
      
      {/* Avatar y nombre del llamante */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl mb-4">
          {caller.charAt(0).toUpperCase()}
        </div>
        
        <h2 className="text-xl font-semibold mb-1 text-center">Llamada entrante</h2>
        
        {/* Mostrar solo si hay un nombre de llamante real, distinto de "Llamada entrante" y del número */}
        {caller && caller !== phoneNumber && caller !== 'Llamada entrante' && (
          <p className="text-lg font-medium text-gray-800 mb-2 text-center">{caller}</p>
        )}
        
        {/* Mostrar solo el número limpio, sin la URI SIP completa */}
        <p className="text-base text-gray-600 mb-4 text-center font-mono">
          {phoneNumber.includes('@') 
            ? phoneNumber.split(':').pop()?.split('@')[0] // Extraer solo el número de la URI SIP
            : phoneNumber}
        </p>
        
        {/* Indicador pulsante */}
        <div className="flex items-center justify-center mb-6">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          <p className="text-gray-700">Llamada entrante...</p>
        </div>
        
        {/* Botones grandes para contestar/rechazar */}
        <div className="w-full grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={onDecline}
            className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-lg font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Rechazar
          </button>
          
          <button
            onClick={onAnswer}
            className="py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-lg font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contestar
          </button>
        </div>
        
        <p className="text-gray-500 text-sm text-center">
          Presione <kbd className="bg-gray-100 px-1 rounded">Enter</kbd> para contestar o <kbd className="bg-gray-100 px-1 rounded">Esc</kbd> para rechazar
        </p>
      </div>
    </div>
  );
};

export default IncomingCallNotification;