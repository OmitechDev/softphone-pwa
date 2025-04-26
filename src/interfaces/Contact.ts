  // src/interfaces/Contact.ts
  export interface Contact {
    name: string;
    extension: string;
  }
  
  export interface ContactsResponse {
    status: string;
    data: Contact[];
  }
  
