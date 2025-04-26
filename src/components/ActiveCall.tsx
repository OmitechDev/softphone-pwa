import React, { useState, useEffect } from 'react';
import { ActiveCallState } from '../interfaces/Call';
import CallControls from './CallControls';
import Dialpad from './Dialpad';
import { sendDTMF } from '../services/phone';

interface ActiveCallProps {
  call: ActiveCallState;
  onHangup: () => void;
  onMute: () => void;
  onHold: () => void;
  onTransfer: () => void;
  onConference: () => void;
}

const ActiveCall: React.FC<ActiveCallProps> = ({
  call,
  onHangup,
  onMute,
  onHold,
  onTransfer,
  onConference,
}) => {
  const [duration, setDuration] = useState<number>(0);
  const [showTransferPanel, setShowTransferPanel] = useState<boolean>(false);
  const [showConferencePanel, setShowConferencePanel] = useState<boolean>(false);
  const [transferExtension, setTransferExtension] = useState<string>('');
  const [conferenceExtension, setConferenceExtension] = useState<string>('');
  const [showDialpad, setShowDialpad] = useState<boolean>(false);

  // Extraer número de teléfono de remoteIdentity (formato sip:number@domain)
  const extractPhoneNumber = (sipUri: string | undefined): string => {
    if (!sipUri) return 'Desconocido';
    
    // Intentar extraer usando regex
    const match = sipUri.match(/sip:([^@]+)@/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Si no se pudo extraer, devolver el URI completo
    return sipUri;
  };

  // Gestionar el tiempo de llamada
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (call.status === 'established' && call.startTime) {
      // Calcular la duración inicial
      const initialDuration = Math.floor((new Date().getTime() - call.startTime.getTime()) / 1000);
      setDuration(initialDuration);

      // Actualizar cada segundo
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [call.status, call.startTime]);

  // Formatear duración en MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Toggle para mostrar/ocultar teclado DTMF
  const toggleDialpad = () => {
    setShowDialpad(!showDialpad);
  };

  // Manejar transferencia
  const handleTransfer = () => {
    if (transferExtension.trim()) {
      onTransfer();
      setShowTransferPanel(false);
      setTransferExtension('');
    }
  };

  // Manejar conferencia
  const handleConference = () => {
    if (conferenceExtension.trim()) {
      onConference();
      setShowConferencePanel(false);
      setConferenceExtension('');
    }
  };

  // Manejar envío de DTMF
  const handleSendDTMF = (digit: string) => {
    if (call.status === 'established') {
      sendDTMF(digit);
    }
  };

  const displayName = call.remoteName || 'Llamada';
  const phoneNumber = extractPhoneNumber(call.remoteIdentity);
  const isCallActive = call.status === 'established';

  return (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="bg-blue-500 text-white py-3 px-4">
        <h1 className="text-lg font-semibold">Softphone</h1>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Info del llamante */}
        <div className="py-6 px-4 flex flex-col items-center justify-center bg-white">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl mb-4">
            {displayName.charAt(0).toUpperCase()}
          </div>
          
          {/* Nombre del contacto si es diferente del número */}
          {displayName && displayName !== phoneNumber && (
            <h2 className="text-xl font-semibold mb-1 text-center">{displayName}</h2>
          )}
          
          {/* Número de teléfono claramente visible */}
          <p className="text-lg font-mono mb-2 text-center text-gray-700">
            {phoneNumber}
          </p>
          
          {/* Estado de la llamada con duración */}
          <div className="flex items-center justify-center mb-2">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              call.status === 'established' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`}></span>
            <p className="text-gray-700 font-medium">
              {call.status === 'dialing'
                ? 'Llamando...'
                : call.status === 'ringing'
                ? 'Llamada entrante...'
                : formatDuration(duration)}
            </p>
          </div>
          
          {/* Estados adicionales */}
          {call.isOnHold && (
            <div className="mt-2 py-1 px-3 bg-red-100 text-red-600 rounded-full text-sm font-medium">
              En espera
            </div>
          )}
          {call.isMuted && (
            <div className="mt-2 py-1 px-3 bg-yellow-100 text-yellow-600 rounded-full text-sm font-medium">
              Silenciado
            </div>
          )}
        </div>
        
        {/* Teclado DTMF (se muestra/oculta) */}
        {showDialpad && (
          <div className="flex-1 bg-white px-4 py-4 border-t">
            <Dialpad onCall={handleSendDTMF} isCallActive={isCallActive} />
          </div>
        )}
        
        {/* Paneles de transferencia y conferencia */}
        {showTransferPanel && (
          <div className="bg-white p-4 shadow-md border-t">
            <h3 className="text-lg font-medium mb-2">Transferir llamada</h3>
            <div className="flex mb-2">
              <input
                type="text"
                value={transferExtension}
                onChange={(e) => setTransferExtension(e.target.value)}
                placeholder="Ingrese extensión"
                className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTransfer}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
              >
                Transferir
              </button>
            </div>
            <button
              onClick={() => setShowTransferPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        )}

        {showConferencePanel && (
          <div className="bg-white p-4 shadow-md border-t">
            <h3 className="text-lg font-medium mb-2">Agregar a conferencia</h3>
            <div className="flex mb-2">
              <input
                type="text"
                value={conferenceExtension}
                onChange={(e) => setConferenceExtension(e.target.value)}
                placeholder="Ingrese extensión"
                className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleConference}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
              >
                Agregar
              </button>
            </div>
            <button
              onClick={() => setShowConferencePanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        )}
        
        {/* Espaciador flexible cuando no hay paneles adicionales */}
        {!showDialpad && !showTransferPanel && !showConferencePanel && (
          <div className="flex-1"></div>
        )}
        
        {/* Controles de llamada */}
        <div className="bg-gray-100 p-4 border-t">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {/* Silenciar */}
            <button
              onClick={onMute}
              className={`flex flex-col items-center justify-center p-2 rounded-lg
                ${call.isMuted 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={call.isMuted 
                    ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
                    : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  } 
                />
              </svg>
              <span className="text-xs">{call.isMuted ? "Activar" : "Silenciar"}</span>
            </button>
            
            {/* En espera */}
            <button
              onClick={onHold}
              className={`flex flex-col items-center justify-center p-2 rounded-lg
                ${call.isOnHold 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">{call.isOnHold ? "Reanudar" : "En espera"}</span>
            </button>
            
            {/* Teclado */}
            <button
              onClick={toggleDialpad}
              className={`flex flex-col items-center justify-center p-2 rounded-lg
                ${showDialpad 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs">Teclado</span>
            </button>
            
            {/* Transferir */}
            <button
              onClick={() => setShowTransferPanel(true)}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-xs">Transferir</span>
            </button>
            
            {/* Conferencia */}
            <button
              onClick={() => setShowConferencePanel(true)}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs">Conferencia</span>
            </button>
          </div>
          
          {/* Segunda fila - Historial y Colgar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.location.href = '#history'}
              className="py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-700 font-medium"
            >
              <span>Historial</span>
            </button>
            
            <button
              onClick={onHangup}
              className="py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"
            >
              <span>Colgar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCall;