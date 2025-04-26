import { useState, useEffect, useCallback } from 'react';
import { User } from '../interfaces/User';
import { ActiveCallState, CallHistoryItem } from '../interfaces/Call';
import phoneService, { 
  phoneEvents, 
  setupPhone, 
  disconnectPhone, 
  makeCall, 
  answerCall, 
  hangupCall, 
  declineCall,
  toggleMute, 
  toggleHold, 
  transferCall, 
  setupConference, 
  getCallHistory,
  isIncomingCall,
  requestCallNotificationsPermission
} from '../services/phone';

interface UsePhoneReturn {
  isConnected: boolean;
  activeCall: ActiveCallState;
  callHistory: CallHistoryItem[];
  dialNumber: (extension: string) => void;
  answer: () => void;
  hangup: () => void;
  decline: () => void;
  mute: () => void;
  hold: () => void;
  transfer: (extension: string) => void;
  conference: (extensions: string[]) => void;
  connectPhone: (user: User, serverAddress: string) => void;
  disconnectPhone: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  isIncomingCall: () => boolean;
}

const initialCallState: ActiveCallState = {
  isOnHold: false,
  isMuted: false,
  isTransferring: false,
  isInConference: false,
  status: 'none',
};

export const usePhone = (): UsePhoneReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState>(initialCallState);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>(getCallHistory());

  // Conectar el teléfono
  const connectPhone = useCallback((user: User, serverAddress: string) => {
    setupPhone(user, serverAddress);
  }, []);

  // Desconectar el teléfono
  const disconnect = useCallback(async () => {
    await disconnectPhone();
    setIsConnected(false);
    setActiveCall(initialCallState);
  }, []);

  // Marcar un número
  const dialNumber = useCallback((extension: string) => {
    const callId = makeCall(extension);
    if (callId) {
      setActiveCall({
        callId,
        remoteIdentity: extension,
        startTime: new Date(),
        isOnHold: false,
        isMuted: false,
        isTransferring: false,
        isInConference: false,
        status: 'dialing',
      });
    }
  }, []);

  // Responder una llamada
  const answer = useCallback(() => {
    if (answerCall()) {
      setActiveCall(prev => ({
        ...prev,
        status: 'established',
        startTime: new Date(),
      }));
    }
  }, []);

  // Colgar una llamada
  const hangup = useCallback(() => {
    if (hangupCall()) {
      setActiveCall(initialCallState);
    }
  }, []);
  
  // Rechazar una llamada entrante
  const decline = useCallback(() => {
    if (declineCall()) {
      setActiveCall(initialCallState);
    }
  }, []);

  // Activar/desactivar mute
  const mute = useCallback(() => {
    if (toggleMute()) {
      setActiveCall(prev => ({
        ...prev,
        isMuted: !prev.isMuted,
      }));
    }
  }, []);

  // Activar/desactivar hold
  const hold = useCallback(() => {
    if (toggleHold()) {
      setActiveCall(prev => ({
        ...prev,
        isOnHold: !prev.isOnHold,
      }));
    }
  }, []);

  // Transferir llamada
  const transfer = useCallback((extension: string) => {
    if (transferCall(extension)) {
      setActiveCall(prev => ({
        ...prev,
        isTransferring: true,
      }));
    }
  }, []);

  // Configurar conferencia
  const conference = useCallback((extensions: string[]) => {
    if (setupConference(extensions)) {
      setActiveCall(prev => ({
        ...prev,
        isInConference: true,
      }));
    }
  }, []);
  
  // Solicitar permisos para notificaciones
  const requestNotificationPermission = useCallback(async () => {
    return await requestCallNotificationsPermission();
  }, []);

  // Efectos para manejar eventos del teléfono
  useEffect(() => {
    // Registrar eventos
    phoneEvents.on('registered', () => {
      setIsConnected(true);
    });

    phoneEvents.on('unregistered', () => {
      setIsConnected(false);
    });

    phoneEvents.on('registrationFailed', () => {
      setIsConnected(false);
    });

    phoneEvents.on('incomingCall', (data) => {
      setActiveCall({
        callId: data.callId,
        remoteIdentity: data.remoteIdentity,
        remoteName: data.remoteName,
        isOnHold: false,
        isMuted: false,
        isTransferring: false,
        isInConference: false,
        status: 'ringing',
      });
    });

    phoneEvents.on('callAccepted', () => {
      setActiveCall(prev => ({
        ...prev,
        status: 'established',
        startTime: new Date(),
      }));
    });

    phoneEvents.on('callEnded', () => {
      setActiveCall(initialCallState);
      setCallHistory(getCallHistory());
    });

    phoneEvents.on('callFailed', () => {
      setActiveCall(initialCallState);
      setCallHistory(getCallHistory());
    });

    phoneEvents.on('callMuted', () => {
      setActiveCall(prev => ({ ...prev, isMuted: true }));
    });

    phoneEvents.on('callUnmuted', () => {
      setActiveCall(prev => ({ ...prev, isMuted: false }));
    });

    phoneEvents.on('callHold', () => {
      setActiveCall(prev => ({ ...prev, isOnHold: true }));
    });

    phoneEvents.on('callUnhold', () => {
      setActiveCall(prev => ({ ...prev, isOnHold: false }));
    });

    phoneEvents.on('callProgressing', () => {
      setActiveCall(prev => ({ ...prev, status: 'dialing' }));
    });

    // Limpieza de eventos
    return () => {
      phoneEvents.removeAllListeners();
      disconnectPhone();
    };
  }, []);

  return {
    isConnected,
    activeCall,
    callHistory,
    dialNumber,
    answer,
    hangup,
    decline,
    mute,
    hold,
    transfer,
    conference,
    connectPhone,
    disconnectPhone: disconnect,
    requestNotificationPermission,
    isIncomingCall
  };
};

export default usePhone;