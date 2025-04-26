import React, { useState } from 'react';
import { Contact } from '../interfaces/Contact';

interface TransferPanelProps {
  contacts: Contact[];
  onTransfer: (extension: string) => void;
  onCancel: () => void;
}

const TransferPanel: React.FC<TransferPanelProps> = ({ contacts, onTransfer, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [manualExtension, setManualExtension] = useState<string>('');

  // Filtrar contactos basados en la búsqueda
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.extension.includes(searchTerm)
  );

  // Manejar la transferencia manual
  const handleManualTransfer = () => {
    if (manualExtension.trim()) {
      onTransfer(manualExtension);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b flex items-center">
        <h2 className="font-semibold text-lg flex-1">Transferir llamada</h2>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Transferencia manual */}
      <div className="p-4 border-b">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Extensión o número
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
            onClick={handleManualTransfer}
            disabled={!manualExtension.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Transferir
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
            {filteredContacts.map((contact) => (
              <div
                key={contact.extension}
                className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => onTransfer(contact.extension)}
              >
                <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-gray-500 text-sm">{contact.extension}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransfer(contact.extension);
                  }}
                  className="p-2 rounded-full hover:bg-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferPanel;