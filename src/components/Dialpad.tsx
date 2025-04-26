import React, { useState, useEffect, useCallback } from 'react';
import { sendDTMF } from '../services/phone';
import { playDTMFTone } from '../services/audioUtils';

interface DialpadProps {
  onCall: (extension: string) => void;
  isCallActive?: boolean; // Para saber si hay una llamada activa
}

const Dialpad: React.FC<DialpadProps> = ({ onCall, isCallActive = false }) => {
  const [number, setNumber] = useState<string>('');
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Configuración para cada tecla
  const keys = [
    { value: '1', letters: '' },
    { value: '2', letters: 'ABC' },
    { value: '3', letters: 'DEF' },
    { value: '4', letters: 'GHI' },
    { value: '5', letters: 'JKL' },
    { value: '6', letters: 'MNO' },
    { value: '7', letters: 'PQRS' },
    { value: '8', letters: 'TUV' },
    { value: '9', letters: 'WXYZ' },
    { value: '*', letters: '' },
    { value: '0', letters: '+' },
    { value: '#', letters: '' },
  ];

  // Manejar presión de tecla, memoizado para evitar regeneración
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    
    // Si es un dígito, *, #, permitir
    if (/^[0-9*#]$/.test(key)) {
      // Prevenir el comportamiento predeterminado para evitar duplicados
      e.preventDefault();
      
      // Reproducir tono DTMF usando generación por frecuencias
      playDTMFTone(key, 150);
      
      // Animar el botón visualmente
      setLastKeyPressed(key);
      
      // Si hay una llamada activa, enviar DTMF
      if (isCallActive) {
        sendDTMF(key);
      } else {
        // Solo agregar al número cuando no hay llamada activa
        setNumber(prev => prev + key);
      }
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (key === 'Enter') {
      e.preventDefault();
      handleCall();
    }
  }, [isCallActive]);

  // Efecto para animar el botón presionado
  useEffect(() => {
    if (lastKeyPressed) {
      const timer = setTimeout(() => {
        setLastKeyPressed(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lastKeyPressed]);

  // Manejar eventos de teclado
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Manejar clic en botones del teclado virtual
  const handleKeyPress = (key: string) => {
    // Reproducir tono DTMF usando generación por frecuencias
    playDTMFTone(key, 150);
    
    // Animar el botón visualmente
    setLastKeyPressed(key);
    
    // Si hay una llamada activa, enviar DTMF
    if (isCallActive) {
      sendDTMF(key);
    } else {
      // Solo agregar al número cuando no hay llamada activa
      setNumber(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (number.trim()) {
      onCall(number);
      // No limpiar el número después de realizar la llamada
      // para permitir rediscar fácilmente
    }
  };

  const handleClear = () => {
    setNumber('');
  };

  // Controlar la entrada manual en el campo de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Filtrar solo caracteres permitidos: dígitos, *, #, +
    const filteredValue = e.target.value.replace(/[^0-9*#+]/g, '');
    setNumber(filteredValue);
  };

  return (
    <div className="w-full p-4">
      {/* Display */}
      <div className="mb-4">
        <input
          type="text"
          value={number}
          onChange={handleInputChange}
          className="w-full py-3 px-4 text-2xl text-center bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ingrese número"
        />
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key) => (
          <button
            key={key.value}
            onClick={() => handleKeyPress(key.value)}
            className={`relative py-4 text-center rounded-full shadow 
              transition-all duration-200 focus:outline-none
              ${lastKeyPressed === key.value 
                ? 'bg-blue-100 transform scale-95' 
                : 'bg-white hover:bg-gray-100 active:bg-gray-200'
              }`}
          >
            <div className="text-xl font-medium">{key.value}</div>
            {key.letters && <div className="text-xs text-gray-500">{key.letters}</div>}
            
            {/* Indicador de toque visual */}
            {lastKeyPressed === key.value && (
              <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20"></span>
            )}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 focus:outline-none transition"
        >
          Limpiar
        </button>
        <button
          onClick={handleBackspace}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 focus:outline-none transition"
        >
          ← Borrar
        </button>
        <button
          onClick={handleCall}
          className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 focus:outline-none transition"
          disabled={!number.trim()}
        >
          Llamar
        </button>
      </div>

      {/* Instrucciones para DTMF */}
      {isCallActive && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p>Llamada en curso: Los tonos marcados se enviarán como DTMF.</p>
        </div>
      )}
    </div>
  );
};

export default Dialpad;