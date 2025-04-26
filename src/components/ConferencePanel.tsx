import React, { useState } from 'react';
import { Contact } from '../interfaces/Contact';

interface ConferencePanelProps {
  contacts: Contact[];
  onAddToConference: (extensions: string[]) => void;
  onCancel: () => void;
}

const ConferencePanel: React.FC<ConferencePanelProps> = ({ contacts, onAddToConference, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [manualExtension, setManualExtension] = useState<string>('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Filtrar contactos basados en la búsqueda
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.extension.includes(searchTerm)
  );

  // Manejar la selección de contactos
  const toggleContactSelection = (extension: string) => {
    if (selectedContacts.includes(extension)) {
      setSelectedContacts(selectedContacts.filter((ext) => ext !== extension));
    } else {
      setSelectedContacts([...selectedContacts, extension]);
    }
  };

  // Agregar extensión manual
  const addManualExtension = () => {
    if (manualExtension.trim() && !selectedContacts.includes(manualExtension)) {
      setSelectedContacts([...selectedContacts, manualExtension]);
      setManualExtension('');
    }
  };

  // Iniciar conferencia
  const startConference = () => {
    if (selectedContacts.length > 0) {
      onAddToConference(selectedContacts);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b flex items-center">
        <h2 className="font-semibold text-lg flex-1">Conferencia</h2>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Participantes seleccionados */}
      <div className="p-4 border-b">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Participantes ({selectedContacts.length})
        </label>
        {selectedContacts.length === 0 ? (
          <div className="text-gray-500 text-sm">No hay participantes seleccionados</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedContacts.map((extension) => (
              <div 
                key={extension} 
                className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                <span>{extension}</span>
                <button 
                  onClick={() => toggleContactSelection(extension)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agregar extensión manual */}
      <div className="p-4 border-b">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Agregar extensión
        </label>
        <div className="flex">
          <input
            type="text"
            value={manualExtension}
            onChange={(e) => setManualExtension(e.target.value)}
            placeholder="Ingrese extensión"
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addManualExtension}
            disabled={!manualExtension.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Buscar contactos */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Buscar contacto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista de contactos */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No se encontraron contactos
          </div>
        ) : (
          <div className="divide-y">
            {filteredContacts.map((contact) => {
              const isSelected = selectedContacts.includes(contact.extension);
              return (
                <div
                  key={contact.extension}
                  className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleContactSelection(contact.extension)}
                >
                  <div
                    className={`rounded-full w-10 h-10 flex items-center justify-center mr-3 ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-gray-500 text-sm">{contact.extension}</div>
                  </div>
                  <div className="p-2">
                    {isSelected ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón para iniciar conferencia */}
      <div className="p-4 border-t">
        <button
          onClick={startConference}
          disabled={selectedContacts.length === 0}
          className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Iniciar conferencia ({selectedContacts.length})
        </button>
      </div>
    </div>
  );
};

export default ConferencePanel;