import React from 'react';
import { Contact as ContactType } from '../interfaces/Contact';

interface ContactProps {
  contact: ContactType;
  onSelect: (extension: string) => void;
}

const Contact: React.FC<ContactProps> = ({ contact, onSelect }) => {
  return (
    <div 
      className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
      onClick={() => onSelect(contact.extension)}
    >
      <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3">
        {contact.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="font-medium">{contact.name}</div>
        <div className="text-gray-500 text-sm">{contact.extension}</div>
      </div>
      <button 
        className="p-2 rounded-full hover:bg-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(contact.extension);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      </button>
    </div>
  );
};

export default Contact;