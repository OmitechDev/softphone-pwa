import React from 'react';

interface AnswerCallScreenProps {
  caller: string;
  phoneNumber: string;
  onAnswer: () => void;
  onDecline: () => void;
}

/**
 * Componente para mostrar una pantalla completa de contestar llamadas
 * Muestra prominentemente el número y grandes botones para contestar/rechazar
 */
const AnswerCallScreen: React.FC<AnswerCallScreenProps> = ({
  caller,
  phoneNumber,
  onAnswer,
  onDecline
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col z-50">
      {/* Cabecera */}
      <div className="bg-blue-500 text-white py-3 px-4 flex items-center">
        <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        <h1 className="text-lg font-semibold">Llamada entrante</h1>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Información del llamante */}
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg text-center">
          {/* Avatar */}
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4">
            {caller.charAt(0).toUpperCase()}
          </div>
          
          {/* Información */}
          <div className="mb-6">
            {/* Nombre del llamante (si es diferente del número) */}
            {caller && caller !== phoneNumber && (
              <h2 className="text-xl font-semibold mb-1">{caller}</h2>
            )}
            
            {/* Número de teléfono (destacado) */}
            <p className="text-lg font-mono text-gray-800 mb-2">
              {phoneNumber}
            </p>
            
            {/* Indicador pulsante */}
            <div className="flex items-center justify-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <p className="text-gray-600">Llamada entrante...</p>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-4">
            {/* Botón Rechazar */}
            <button 
              onClick={onDecline}
              className="flex flex-col items-center justify-center p-4 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">Rechazar</span>
            </button>
            
            {/* Botón Contestar */}
            <button 
              onClick={onAnswer}
              className="flex flex-col items-center justify-center p-4 rounded-full bg-green-500 hover:bg-green-600 text-white"
            >
              <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="font-medium">Contestar</span>
            </button>
          </div>
        </div>
        
        {/* Ayuda */}
        <p className="text-gray-300 mt-8 text-sm text-center">
          Presione <kbd className="bg-gray-700 px-2 py-1 rounded">Enter</kbd> para contestar o <kbd className="bg-gray-700 px-2 py-1 rounded">Esc</kbd> para rechazar
        </p>
      </div>
    </div>
  );
};

export default AnswerCallScreen;