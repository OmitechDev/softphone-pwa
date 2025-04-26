import React, { useState, useEffect } from 'react';
import { User } from '../interfaces/User';
import { Contact } from '../interfaces/Contact';
import usePhone from '../hooks/usePhone';
import Dialpad from './Dialpad';
import ContactsList from './ContactsList';
import ActiveCall from './ActiveCall';
import CallHistory from './CallHistory';
import TransferPanel from './TransferPanel';
import ConferencePanel from './ConferencePanel';
import AnswerCallScreen from './AnswerCallScreen';
import { getContacts } from '../services/api';
import { showIncomingCallNotification, closeNotification } from '../services/webNotifications';

interface SoftphoneProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'dialpad' | 'contacts' | 'history';
type View = 'main' | 'call' | 'transfer' | 'conference';

const Softphone: React.FC<SoftphoneProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dialpad');
  const [currentView, setCurrentView] = useState<View>('main');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showIncomingCallScreen, setShowIncomingCallScreen] = useState<boolean>(false);
  
  const {
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
    disconnectPhone,
    requestNotificationPermission,
    isIncomingCall
  } = usePhone();

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

  // Cargar contactos
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const data = await getContacts();
        setContacts(data);
      } catch (error) {
        console.error('Error al cargar contactos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadContacts();
  }, []);

  // Conectar el teléfono al cargar el componente
  useEffect(() => {
    // La dirección del servidor debe ser en formato dominio.com sin protocolo
    // Por ejemplo: "sip.example.com" o "sip.example.com:8089"
    const serverAddress = process.env.REACT_APP_ASTERISK || 'pbx.example.com';

    // Para depuración
    console.log(`Intentando conectar al servidor SIP: ${serverAddress}`);
    
    // Iniciar conexión
    connectPhone(user, serverAddress);
    
    // Solicitar permisos de notificación
    requestNotificationPermission().catch(console.error);
    
    return () => {
      disconnectPhone();
      closeNotification(); // Cerrar cualquier notificación pendiente
    };
  }, [user, connectPhone, disconnectPhone, requestNotificationPermission]);

  // Manejar respuesta de llamada
  const handleAnswer = () => {
    answer();
    setShowIncomingCallScreen(false);
    closeNotification(); // Cerrar la notificación web
  };
  
  // Manejar rechazo de llamada
  const handleDecline = () => {
    decline();
    setShowIncomingCallScreen(false);
    closeNotification(); // Cerrar la notificación web
  };

  // Actualizar vista y manejar notificación de llamada entrante
  useEffect(() => {
    // Verificar si hay una llamada entrante
    if (isIncomingCall()) {
      setShowIncomingCallScreen(true);
      
      // Obtener datos del llamante
      const callerName = activeCall.remoteName || 'Llamada entrante';
      const phoneNumber = extractPhoneNumber(activeCall.remoteIdentity);
      
      // Mostrar notificación web para llamada entrante
      showIncomingCallNotification(callerName, undefined, handleAnswer);
    } else {
      setShowIncomingCallScreen(false);
      closeNotification(); // Cerrar notificación si ya no hay llamada entrante
    }
    
    // Si hay una llamada activa, mostrar su vista a menos que se haya solicitado ver el historial
    if (activeCall.status !== 'none') {
      if (window.location.hash === '#history') {
        setCurrentView('main');
        setActiveTab('history');
      } else {
        setCurrentView('call');
      }
    } else {
      setCurrentView('main');
    }

    // Escuchar cambios en el hash
    const handleHashChange = () => {
      if (window.location.hash === '#history') {
        setCurrentView('main');
        setActiveTab('history');
      } else if (activeCall.status !== 'none') {
        setCurrentView('call');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeCall, isIncomingCall]);

  // Efecto para manejar pulsaciones de tecla para contestar/rechazar llamadas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo procesar teclas si hay una llamada entrante
      if (showIncomingCallScreen) {
        // Contestar con la tecla Enter
        if (e.key === 'Enter') {
          handleAnswer();
        }
        // Rechazar con la tecla Escape
        else if (e.key === 'Escape') {
          handleDecline();
        }
      }
    };

    // Añadir listener
    window.addEventListener('keydown', handleKeyDown);

    // Eliminar listener al desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showIncomingCallScreen]);

  // Manejar llamada saliente
  const handleMakeCall = (extension: string) => {
    dialNumber(extension);
  };

  // Manejar acción de transferir
  const handleTransfer = (extension: string) => {
    transfer(extension);
    setCurrentView('call');
  };

  // Manejar acción de conferencia
  const handleConference = (extensions: string[]) => {
    conference(extensions);
    setCurrentView('call');
  };

  // Renderizar el contenido según la tab activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dialpad':
        return <Dialpad onCall={handleMakeCall} />;
      case 'contacts':
        return <ContactsList onSelectContact={handleMakeCall} />;
      case 'history':
        return <CallHistory history={callHistory} onCallBack={handleMakeCall} />;
      default:
        return <Dialpad onCall={handleMakeCall} />;
    }
  };

  // Renderizar la vista principal (tabs)
  const renderMainView = () => (
    <div className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="bg-blue-500 text-white py-3 px-4">
        <h1 className="text-lg font-semibold">Softphone</h1>
        <div className="text-sm text-blue-100">
          {isConnected ? (
            <span className="flex items-center">
              <span className="h-2 w-2 bg-green-400 rounded-full mr-1"></span>
              {user.extension} - {user.name}
            </span>
          ) : (
            <span className="flex items-center">
              <span className="h-2 w-2 bg-red-400 rounded-full mr-1"></span>
              Desconectado
            </span>
          )}
        </div>
      </div>
      
      {/* Contenido de la tab activa */}
      <div className="flex-1 overflow-hidden bg-white">
        {renderTabContent()}
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border-t flex justify-around py-2">
        <button
          onClick={() => setActiveTab('dialpad')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            activeTab === 'dialpad' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs">Teclado</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            activeTab === 'contacts' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs">Contactos</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">Historial</span>
        </button>
      </div>
    </div>
  );

  // Renderizar contenido según la vista actual
  const renderContent = () => {
    switch (currentView) {
      case 'call':
        return (
          <ActiveCall
            call={activeCall}
            onHangup={hangup}
            onMute={mute}
            onHold={hold}
            onTransfer={() => setCurrentView('transfer')}
            onConference={() => setCurrentView('conference')}
          />
        );
      case 'transfer':
        return (
          <TransferPanel
            contacts={contacts}
            onTransfer={handleTransfer}
            onCancel={() => setCurrentView('call')}
          />
        );
      case 'conference':
        return (
          <ConferencePanel
            contacts={contacts}
            onAddToConference={handleConference}
            onCancel={() => setCurrentView('call')}
          />
        );
      default:
        return renderMainView();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Pantalla de llamada entrante */}
      {showIncomingCallScreen && (
        <AnswerCallScreen
          caller={activeCall.remoteName || 'Llamada entrante'}
          phoneNumber={extractPhoneNumber(activeCall.remoteIdentity)}
          onAnswer={handleAnswer}
          onDecline={handleDecline}
        />
      )}
    </div>
  );
};

export default Softphone;