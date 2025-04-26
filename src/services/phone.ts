import {
  Invitation,
  Inviter,
  Registerer,
  RegistererOptions,
  RegistererState,
  Session,
  SessionState,
  URI,
  UserAgent,
  UserAgentOptions,
  Web,
  RequestPendingError
} from 'sip.js';
import { EventEmitter } from 'events';
import { User } from '../interfaces/User';
import { CallHistoryItem } from '../interfaces/Call';
import {
  playDTMFTone,
  startRingTone,
  stopRingTone,
  playFeedbackTone,
  playErrorTone,
  playBusyTone,
  cleanupAudio,
  showNotification,
  requestNotificationPermission
} from './audioUtils';

// Crear un event emitter para manejar eventos del teléfono
class PhoneEventEmitter extends EventEmitter {}

export const phoneEvents = new PhoneEventEmitter();

// Estado del teléfono
let userAgent: UserAgent | null = null;
let registerer: Registerer | null = null;
let currentSession: Session | null = null;
let callHistory: CallHistoryItem[] = [];
let serverUrl: string = '';
let isMuted: boolean = false;
let isHeld: boolean = false;
let notificationsPermissionGranted: boolean = false;

// Cargar el historial de llamadas desde localStorage
const loadCallHistory = (): void => {
  const history = localStorage.getItem('callHistory');
  if (history) {
    const parsedHistory = JSON.parse(history);
    // Convertir las fechas almacenadas como strings a objetos Date
    callHistory = parsedHistory.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  }
};

// Guardar el historial de llamadas en localStorage
const saveCallHistory = (): void => {
  localStorage.setItem('callHistory', JSON.stringify(callHistory));
};

// Inicializar el historial al cargar el módulo
loadCallHistory();

// Inicializar permisos de notificación
const initNotifications = async (): Promise<void> => {
  notificationsPermissionGranted = await requestNotificationPermission();
};

// Llamar a init al cargar
initNotifications().catch(console.error);

// Crear identificador único para las llamadas
const generateCallId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Configurar SIP.js
export const setupPhone = (user: User, serverAddress: string): void => {
  // Guardar la dirección del servidor para usarla después
  serverUrl = serverAddress;

  // Asegurarse de que la dirección del servidor esté en el formato correcto
  // El formato debe ser 'example.com' sin protocolo
  const formattedServer = serverAddress.replace(/^(wss?:\/\/|sips?:\/\/)/i, '');
  
  // Crear URI para el usuario
  const uri = UserAgent.makeURI(`sip:${user.extension}@${formattedServer}`);
  if (!uri) {
    console.error('No se pudo crear URI válida');
    return;
  }
  
  // Opciones del UserAgent
  const userAgentOptions: UserAgentOptions = {
    uri,
    authorizationUsername: user.extension,
    authorizationPassword: user.password_exten,
    displayName: user.name,
    transportOptions: {
      wsServers: [`wss://${formattedServer}:8089/ws`]
    },
    sessionDescriptionHandlerFactoryOptions: {
      peerConnectionConfiguration: {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] }
        ]
      }
    }
  };
  console.log('Opciones del UserAgent:', userAgentOptions);
  
  // Crear UserAgent
  userAgent = new UserAgent(userAgentOptions);
  
  // Manejar llamadas entrantes
  userAgent.delegate = {
    onInvite: (invitation: Invitation): void => {
      // Guardar la sesión actual
      currentSession = invitation;
      
      // Reproducir tono de llamada entrante usando osciladores
      startRingTone('incoming');
      
      // Extraer información del remitente
      const remoteIdentity = invitation.remoteIdentity.uri.toString();
      const remoteName = invitation.remoteIdentity.displayName || 'Llamada entrante';
      
      console.log(`Llamada entrante de ${remoteName} (${remoteIdentity})`);
      
      // Mostrar notificación si tenemos permiso
      if (notificationsPermissionGranted) {
        showNotification(
          'Llamada entrante', 
          { 
            body: `De: ${remoteName} (${remoteIdentity})`,
            requireInteraction: true,
            tag: 'incoming-call'
          }
        );
      }
      
      // Emitir evento
      phoneEvents.emit('incomingCall', {
        callId: invitation.id || generateCallId(),
        remoteIdentity,
        remoteName
      });
      
      // Configurar eventos para esta invitación
      setupSessionEvents(invitation);
    }
  };
  
  // Iniciar UserAgent
  userAgent.start()
    .then(() => {
      console.log('UserAgent iniciado');
      
      // Reproducir un tono de feedback para indicar que se ha iniciado
      playFeedbackTone(600, 150);
      
      // Crear registrador
      const registerOptions: RegistererOptions = {
        registrar: UserAgent.makeURI(`sip:${formattedServer}`) || undefined
      };
      
      // Verificar que el UserAgent sigue inicializado antes de crear el registrador
      if (!userAgent || !userAgent.isConnected()) {
        console.error('UserAgent no está conectado al intentar registrar');
        phoneEvents.emit('registrationFailed', new Error('UserAgent no conectado'));
        return Promise.reject(new Error('UserAgent no conectado'));
      }
      
      registerer = new Registerer(userAgent, registerOptions);
      
      // Configurar eventos del registrador
      registerer.stateChange.addListener((state: RegistererState) => {
        console.log(`Estado del registrador: ${state}`);
        
        switch (state) {
          case RegistererState.Registered:
            phoneEvents.emit('registered');
            break;
          case RegistererState.Unregistered:
            phoneEvents.emit('unregistered');
            break;
          case RegistererState.Terminated:
            phoneEvents.emit('unregistered');
            break;
        }
      });
      
      // Registrarse
      return registerer.register();
    })
    .then(() => {
      console.log('Registrado correctamente');
      // Tono de feedback de registro exitoso
      playFeedbackTone(800, 200);
      phoneEvents.emit('registered');
    })
    .catch(error => {
      console.error('Error iniciando o registrando:', error);
      // Tono de error si hubo problemas con el registro
      playErrorTone();
      phoneEvents.emit('registrationFailed', error);
    });
};

// Configurar eventos de sesión
const setupSessionEvents = (session: Session): void => {
  // Identificar la dirección de la llamada
  const direction: 'inbound' | 'outbound' = 
    session instanceof Invitation ? 'inbound' : 'outbound';
  
  // Guardar el tiempo de inicio
  const startTime = new Date();
  
  // Capturar información remota
  let remoteExtension = '';
  let remoteName = 'Desconocido';
  
  if (session instanceof Invitation) {
    remoteExtension = session.remoteIdentity.uri.user || '';
    remoteName = session.remoteIdentity.displayName || 'Desconocido';
  } else if (session instanceof Inviter) {
    remoteExtension = session.remoteIdentity.uri.user || '';
    remoteName = session.remoteIdentity.displayName || 'Desconocido';
  }
  
  // Configurar listener para cambios de estado
  session.stateChange.addListener((state: SessionState) => {
    console.log(`Estado de sesión: ${state}`);
    
    switch (state) {
      case SessionState.Establishing:
        // Llamada en progreso
        if (direction === 'outbound') {
          // Reproducir tono de llamada saliente usando osciladores
          startRingTone('outgoing');
          phoneEvents.emit('callProgressing', session.id || generateCallId());
        }
        break;
        
      case SessionState.Established:
        // Detener tonos de llamada cuando se establece la conexión
        stopRingTone();
        
        // Reproducir un breve tono para indicar que la llamada se ha establecido
        playFeedbackTone(700, 100);
        
        // Llamada establecida
        phoneEvents.emit('callAccepted', session.id || generateCallId());
        break;
        
      case SessionState.Terminated:
        // Detener tonos de llamada
        stopRingTone();
        
        // Reproducir un tono corto para indicar fin de llamada
        playFeedbackTone(500, 150);
        
        // Llamada terminada
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        // Crear item para el historial
        const historyItem: CallHistoryItem = {
          id: session.id || generateCallId(),
          extension: remoteExtension,
          name: remoteName,
          direction,
          timestamp: startTime,
          duration,
          status: duration > 0 ? 'answered' : direction === 'inbound' ? 'missed' : 'rejected'
        };
        
        // Guardar en historial
        callHistory.unshift(historyItem);
        if (callHistory.length > 50) {
          callHistory = callHistory.slice(0, 50);
        }
        saveCallHistory();
        
        // Emitir evento
        phoneEvents.emit('callEnded', historyItem.id);
        
        // Limpiar sesión actual
        if (currentSession === session) {
          currentSession = null;
        }
        
        // Reiniciar estados
        isMuted = false;
        isHeld = false;
        break;
    }
  });
};

// Desconectar SIP.js
export const disconnectPhone = async (): Promise<void> => {
  try {
    // Detener sonidos
    stopRingTone();
    
    // Terminar sesión actual si existe
    if (currentSession) {
      try {
        if (currentSession instanceof Invitation) {
          if (currentSession.state === SessionState.Established) {
            // Si la llamada está establecida, usar bye()
            await currentSession.bye();
          } else {
            // Si la llamada no está establecida, rechazar
            await currentSession.reject();
          }
        } else if (currentSession instanceof Inviter) {
          // Para llamadas salientes, usar bye()
          await currentSession.bye();
        } else {
          // Fallback para otros tipos de sesión
          console.warn('Tipo de sesión no reconocido, intentando métodos generales.');
          if (typeof (currentSession as any).bye === 'function') {
            await (currentSession as any).bye();
          }
        }
      } catch (error) {
        console.error('Error al terminar sesión:', error);
      }
      currentSession = null;
    }
    
    // Desregistrar si existe registrador
    if (registerer) {
      try {
        if (registerer.state === RegistererState.Registered) {
          await registerer.unregister();
        }
      } catch (error) {
        console.error('Error al desregistrar:', error);
      }
      registerer = null;
    }
    
    // Detener UserAgent si existe y está conectado
    if (userAgent) {
      try {
        // Verificar si el UserAgent está activo antes de intentar detenerlo
        if (userAgent.isConnected()) {
          await userAgent.stop();
          console.log('UserAgent detenido correctamente');
        } else {
          console.log('UserAgent ya está detenido');
        }
      } catch (error) {
        console.error('Error al detener UserAgent:', error);
      }
      userAgent = null;
    }
    
    // Limpiar recursos de audio
    cleanupAudio();
    
    console.log('Teléfono desconectado');
  } catch (error) {
    console.error('Error al desconectar el teléfono:', error);
  }
};

// Hacer una llamada
export const makeCall = (extension: string): string | null => {
  if (!userAgent) {
    console.error('No hay UserAgent configurado');
    playErrorTone();
    return null;
  }

  try {
    // Crear target URI
    const targetURI = UserAgent.makeURI(`sip:${extension}@${serverUrl}`);
    if (!targetURI) {
      console.error(`No se pudo crear URI para ${extension}`);
      playErrorTone();
      return null;
    }
    
    // Generar ID único para esta llamada
    const callId = generateCallId();
    
    // Opciones para la invitación mejoradas
    const inviterOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: { 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: false 
        },
        iceGatheringTimeout: 5000
      }
    };
    
    // Reproducir tono de feedback para indicar inicio de marcado
    playFeedbackTone(600, 200);
    
    // Iniciar el tono de llamada saliente inmediatamente
    startRingTone('outgoing');
    
    // Crear invitador
    const inviter = new Inviter(userAgent, targetURI, inviterOptions);
    
    // Guardar sesión actual
    currentSession = inviter;
    
    // Configurar eventos
    setupSessionEvents(inviter);
    
    // Guardar esta llamada en el historial inmediatamente (se actualizará cuando termine)
    const historyItem: CallHistoryItem = {
      id: callId,
      extension: extension,
      name: extension, // Puedes mejorar esto buscando el nombre en tus contactos
      direction: 'outbound',
      timestamp: new Date(),
      duration: 0,
      status: 'answered' // Se actualizará cuando termine la llamada
    };
    
    callHistory.unshift(historyItem);
    saveCallHistory();
    
    // Iniciar la llamada
    inviter.invite()
      .then(() => {
        console.log(`Llamada iniciada a ${extension}`);
      })
      .catch(error => {
        console.error('Error durante la llamada:', error);
        stopRingTone(); // Detener tono de llamada en caso de error
        playBusyTone(2000); // Reproducir tono de ocupado
        phoneEvents.emit('callFailed', callId);
        currentSession = null;
        
        // Actualizar el historial para mostrar la llamada como fallida
        const index = callHistory.findIndex(item => item.id === callId);
        if (index !== -1) {
          callHistory[index].status = 'rejected';
          saveCallHistory();
        }
      });
    
    return callId;
  } catch (error) {
    console.error('Error al hacer llamada:', error);
    stopRingTone(); // Detener tono de llamada en caso de error
    playErrorTone();
    return null;
  }
};

// Responder una llamada
export const answerCall = (): boolean => {
  if (!currentSession || !(currentSession instanceof Invitation)) {
    console.error('No hay una invitación para responder');
    playErrorTone();
    return false;
  }

  try {
    // Detener tono de llamada entrante
    stopRingTone();
    
    // Reproducir tono de feedback
    playFeedbackTone(700, 200);
    
    // Opciones para responder mejoradas
    const options = {
      sessionDescriptionHandlerOptions: {
        constraints: { 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: false 
        },
        iceGatheringTimeout: 5000
      }
    };
    
    // Responder la invitación
    (currentSession as Invitation).accept(options)
      .then(() => {
        console.log('Llamada respondida');
      })
      .catch(error => {
        console.error('Error al responder llamada:', error);
        playErrorTone();
      });
    
    return true;
  } catch (error) {
    console.error('Error al responder llamada:', error);
    playErrorTone();
    return false;
  }
};

// Colgar una llamada
export const hangupCall = (): boolean => {
  if (!currentSession) {
    console.error('No hay sesión activa para colgar');
    playErrorTone();
    return false;
  }

  try {
    // Detener tonos de llamada
    stopRingTone();
    
    // Finalizar la sesión según su tipo
    if (currentSession instanceof Invitation) {
      if (currentSession.state === SessionState.Established) {
        // Si la llamada está establecida, usar bye()
        currentSession.bye()
          .then(() => {
            console.log('Llamada finalizada');
          })
          .catch(error => {
            console.error('Error al finalizar llamada:', error);
            playErrorTone();
          });
      } else {
        // Si la llamada no está establecida, rechazar
        currentSession.reject()
          .then(() => {
            console.log('Llamada rechazada');
          })
          .catch(error => {
            console.error('Error al rechazar llamada:', error);
            playErrorTone();
          });
      }
    } else if (currentSession instanceof Inviter) {
      // Para llamadas salientes, usar bye()
      currentSession.bye()
        .then(() => {
          console.log('Llamada finalizada');
        })
        .catch(error => {
          console.error('Error al finalizar llamada:', error);
          playErrorTone();
        });
    }
    
    return true;
  } catch (error) {
    console.error('Error al colgar llamada:', error);
    playErrorTone();
    return false;
  }
};

// Rechazar una llamada entrante
export const declineCall = (): boolean => {
  if (!currentSession || !(currentSession instanceof Invitation)) {
    console.error('No hay una invitación para rechazar');
    playErrorTone();
    return false;
  }

  try {
    // Detener tono de llamada entrante
    stopRingTone();
    
    // Reproducir tono de feedback
    playFeedbackTone(500, 150);
    
    // Rechazar la invitación
    (currentSession as Invitation).reject()
      .then(() => {
        console.log('Llamada rechazada');
      })
      .catch(error => {
        console.error('Error al rechazar llamada:', error);
        playErrorTone();
      });
    
    return true;
  } catch (error) {
    console.error('Error al rechazar llamada:', error);
    playErrorTone();
    return false;
  }
};

// Activar/desactivar mute
export const toggleMute = (): boolean => {
  if (!currentSession) {
    console.error('No hay sesión activa para silenciar');
    playErrorTone();
    return false;
  }

  try {
    // Obtener el session description handler
    const sessionDescriptionHandler = currentSession.sessionDescriptionHandler;
    if (!sessionDescriptionHandler) {
      console.error('No hay session description handler');
      playErrorTone();
      return false;
    }
    
    // Acceder a la conexión peer
    const peerConnection = (sessionDescriptionHandler as any).peerConnection;
    if (!peerConnection) {
      console.error('No hay peer connection');
      playErrorTone();
      return false;
    }
    
    // Obtener los senders de audio
    const audioSenders = peerConnection.getSenders()
      .filter((sender: RTCRtpSender) => sender.track && sender.track.kind === 'audio');
    
    if (audioSenders.length === 0) {
      console.error('No hay audio senders');
      playErrorTone();
      return false;
    }
    
    // Cambiar estado
    isMuted = !isMuted;
    
    // Aplicar mute a todas las pistas
    audioSenders.forEach((sender: RTCRtpSender) => {
      if (sender.track) {
        sender.track.enabled = !isMuted;
      }
    });
    
    // Reproducir tono de feedback
    if (isMuted) {
      playFeedbackTone(400, 100);
      phoneEvents.emit('callMuted', currentSession.id || generateCallId());
    } else {
      playFeedbackTone(600, 100);
      phoneEvents.emit('callUnmuted', currentSession.id || generateCallId());
    }
    
    console.log(`Micrófono ${isMuted ? 'desactivado' : 'activado'}`);
    return true;
  } catch (error) {
    console.error('Error al cambiar mute:', error);
    playErrorTone();
    return false;
  }
};

// Modificar SDP para hold/unhold
const modifySdpForHold = (sdp: string): string => {
  return sdp.replace(/a=sendrecv/g, 'a=sendonly');
};

const modifySdpForUnhold = (sdp: string): string => {
  return sdp.replace(/a=sendonly/g, 'a=sendrecv').replace(/a=inactive/g, 'a=sendrecv');
};

// Activar/desactivar hold
export const toggleHold = (): boolean => {
  if (!currentSession) {
    console.error('No hay sesión activa para poner en espera');
    playErrorTone();
    return false;
  }

  try {
    // Cambiar estado
    isHeld = !isHeld;
    
    // Obtener el session description handler
    const sessionDescriptionHandler = currentSession.sessionDescriptionHandler;
    if (!sessionDescriptionHandler) {
      console.error('No hay session description handler');
      playErrorTone();
      return false;
    }
    
    // Preparar re-invite
    const options = {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
        hold: isHeld
      }
    };
    
    // Reproducir tono de feedback
    playFeedbackTone(isHeld ? 350 : 650, 150);
    
    // Enviar re-invite
    currentSession.invite(options)
      .then(() => {
        console.log(`Llamada ${isHeld ? 'en espera' : 'reanudada'}`);
        
        // Emitir evento
        if (isHeld) {
          phoneEvents.emit('callHold', currentSession?.id || generateCallId());
        } else {
          phoneEvents.emit('callUnhold', currentSession?.id || generateCallId());
        }
      })
      .catch(error => {
        if (error instanceof RequestPendingError) {
          console.error('Ya hay una solicitud de hold pendiente');
        } else {
          console.error('Error al cambiar estado de hold:', error);
        }
        
        // Reproducir tono de error
        playErrorTone();
        
        // Revertir estado en caso de error
        isHeld = !isHeld;
      });
    
    return true;
  } catch (error) {
    console.error('Error al cambiar estado de hold:', error);
    playErrorTone();
    return false;
  }
};

// Enviar DTMF (usando generación de tonos por frecuencia)
export const sendDTMF = (tone: string): boolean => {
  if (!currentSession) {
    console.error('No hay sesión activa para enviar DTMF');
    playErrorTone();
    return false;
  }

  try {
    // Validar tono (corregido para usar .test() en lugar de .exec())
    if (!/^[0-9A-D#*,]$/.test(tone)) {
      console.error('Tono DTMF inválido:', tone);
      playErrorTone();
      return false;
    }
    
    // Reproducir el tono DTMF localmente usando osciladores
    playDTMFTone(tone, 200);
    
    // Preparar body para INFO
    const dtmfBody = {
      contentDisposition: "render",
      contentType: "application/dtmf-relay",
      content: "Signal=" + tone + "\r\nDuration=200"
    };
    
    // Enviar INFO
    currentSession.info({ requestOptions: { body: dtmfBody } })
      .then(() => {
        console.log(`Tono DTMF ${tone} enviado`);
      })
      .catch(error => {
        console.error(`Error al enviar tono DTMF ${tone}:`, error);
        playErrorTone();
      });
    
    return true;
  } catch (error) {
    console.error('Error al enviar DTMF:', error);
    playErrorTone();
    return false;
  }
};

// Transferir llamada mediante DTMF
export const transferCall = (extension: string): boolean => {
  if (!currentSession) {
    console.error('No hay sesión activa para transferir');
    playErrorTone();
    return false;
  }

  try {
    console.log(`Iniciando transferencia a ${extension}`);
    
    // Reproducir tono de feedback para indicar inicio de transferencia
    playFeedbackTone(600, 300);
    
    // Secuencia DTMF para transferencia (personalizar según servidor)
    const dtmfSequence = `#90${extension}`;
    
    // Enviar secuencia de DTMF
    let i = 0;
    const sendNextDigit = () => {
      if (i < dtmfSequence.length) {
        const digit = dtmfSequence[i++];
        sendDTMF(digit);
        setTimeout(sendNextDigit, 300);
      } else {
        // Secuencia completa
        console.log('Secuencia de transferencia completada');
        phoneEvents.emit('callTransferred', currentSession?.id || generateCallId());
      }
    };
    
    // Iniciar envío de secuencia
    sendNextDigit();
    
    return true;
  } catch (error) {
    console.error('Error al transferir llamada:', error);
    playErrorTone();
    return false;
  }
};

// Iniciar conferencia mediante DTMF
export const setupConference = (extensions: string[]): boolean => {
  if (!currentSession || extensions.length === 0) {
    console.error('No hay sesión activa o no se proporcionaron extensiones');
    playErrorTone();
    return false;
  }

  try {
    const extension = extensions[0]; // Usar solo la primera extensión
    console.log(`Iniciando conferencia con ${extension}`);
    
    // Reproducir tono de feedback para indicar inicio de conferencia
    playFeedbackTone(700, 300);
    
    // Secuencia DTMF para conferencia (personalizar según servidor)
    const dtmfSequence = `#70${extension}`;
    
    // Enviar secuencia de DTMF
    let i = 0;
    const sendNextDigit = () => {
      if (i < dtmfSequence.length) {
        const digit = dtmfSequence[i++];
        sendDTMF(digit);
        setTimeout(sendNextDigit, 300);
      } else {
        // Secuencia completa
        console.log('Secuencia de conferencia completada');
        phoneEvents.emit('conferenceStarted', currentSession?.id || generateCallId());
      }
    };
    
    // Iniciar envío de secuencia
    sendNextDigit();
    
    return true;
  } catch (error) {
    console.error('Error al configurar conferencia:', error);
    playErrorTone();
    return false;
  }
};

// Obtener historial de llamadas
export const getCallHistory = (): CallHistoryItem[] => {
  return [...callHistory];
};

// Limpiar historial de llamadas
export const clearCallHistory = (): void => {
  callHistory = [];
  saveCallHistory();
};

// Comprobar si hay una llamada activa
export const isCallActive = (): boolean => {
  return currentSession !== null && 
         (currentSession.state === SessionState.Established || 
          currentSession.state === SessionState.Establishing);
};

// Comprobar si es una llamada entrante actualmente sonando
export const isIncomingCall = (): boolean => {
  return currentSession !== null && 
         currentSession instanceof Invitation &&
         currentSession.state === SessionState.Establishing;
};

// Comprobar si el micrófono está silenciado
export const isMicrophoneMuted = (): boolean => {
  return isMuted;
};

// Comprobar si la llamada está en espera
export const isCallOnHold = (): boolean => {
  return isHeld;
};

// Comprobar estado de registro
export const isRegistered = (): boolean => {
  return registerer !== null && registerer.state === RegistererState.Registered;
};

// Comprobar si está conectado al servidor
export const isConnected = (): boolean => {
  return userAgent !== null && userAgent.isConnected();
};

// Solicitar permisos de notificación para llamadas entrantes
export const requestCallNotificationsPermission = async (): Promise<boolean> => {
  notificationsPermissionGranted = await requestNotificationPermission();
  return notificationsPermissionGranted;
};

export default {
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
  sendDTMF,
  isCallActive,
  isIncomingCall,
  isMicrophoneMuted,
  isCallOnHold,
  isRegistered,
  isConnected,
  getCallHistory,
  clearCallHistory,
  requestCallNotificationsPermission
};