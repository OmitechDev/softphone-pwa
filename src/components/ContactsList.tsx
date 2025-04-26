import React, { useState, useEffect } from 'react';
import { Contact as ContactType } from '../interfaces/Contact';
import Contact from './Contact';
import { getContacts } from '../services/api';

interface ContactsListProps {
  onSelectContact: (extension: string) => void;
}

const ContactsList: React.FC<ContactsListProps> = ({ onSelectContact }) => {
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Cargar los contactos
    const loadContacts = async () => {
      try {
        setLoading(true);
        const data = await getContacts();
        setContacts(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los contactos. Por favor, inténtelo de nuevo.');
        console.error('Error loading contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  // Filtrar contactos basados en la búsqueda
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.extension.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Buscador */}
      <div className="p-3 border-b">
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
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            {searchTerm ? 'No se encontraron contactos' : 'No hay contactos disponibles'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredContacts.map((contact) => (
              <Contact
                key={contact.extension}
                contact={contact}
                onSelect={onSelectContact}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsList;