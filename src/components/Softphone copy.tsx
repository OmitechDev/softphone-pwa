import React, { useState, useEffect } from 'react';
import { User } from '../interfaces/User';
import { Contact } from '../interfaces/Contact';
import usePhone from '../hooks/usePhone';
import Dialpad from './Dialpad';
import CallButton from './CallButton';
import ContactsList from './ContactsList';
import ActiveCall from './ActiveCall';
import CallHistory from './CallHistory';
import TransferPanel from './TransferPanel';
import ConferencePanel from './ConferencePanel';
import { getContacts } from '../services/api';

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
  
  const {
    isConnected,
    activeCall,
    callHistory,
    dialNumber,
    answer,
    hangup,
    mute,
    hold,
    transfer,
    conference,
    connectPhone,
    disconnectPhone,
  } = usePhone();

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
    // Aquí deberías poner la dirección real de tu servidor SIP
    const serverAddress = 'pbx.lambicall.com';
    connectPhone(user, serverAddress);
    
    return () => {
      disconnectPhone();
    };
  }, [user, connectPhone, disconnectPhone]);

  // Cambiar a vista de llamada cuando hay una llamada activa y manejar eventos de hash
  useEffect(() => {
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
  }, [activeCall.status]);

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
      {/* Contenido de la tab activa */}
      <div className="flex-1 overflow-hidden">
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
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 flex items-center">
        <div className="flex-1">
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
        <button
          onClick={onLogout}
          className="p-2 rounded-full hover:bg-blue-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm1 2v10h10V5H4zm7 4a1 1 0 01-1 1H6a1 1 0 110-2h4a1 1 0 011 1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Footer con botón de llamada, solo visible en la vista principal */}
      {(currentView === 'main' && activeCall.status === 'ringing') && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-center">
          <div className="flex items-center bg-blue-50 p-3 rounded-lg w-full">
            <div className="flex-1">
              <div className="font-medium">Llamada entrante</div>
              <div className="text-gray-500 text-sm">
                {activeCall.remoteName || activeCall.remoteIdentity || 'Desconocido'}
              </div>
            </div>
            <div className="flex">
              <button
                onClick={hangup}
                className="bg-red-500 text-white p-2 rounded-full mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L20 6.161V5a2 2 0 00-2-2H4z" />
                  <path d="M18 8.368l-8.441 4.22a1.25 1.25 0 01-1.118 0L0 8.368V14a2 2 0 002 2h16a2 2 0 002-2V8.368z" />
                </svg>
              </button>
              <button
                onClick={answer}
                className="bg-green-500 text-white p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Softphone;