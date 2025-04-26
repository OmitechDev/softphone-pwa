// src/interfaces/User.ts
export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    extension: string;
    password_exten: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }
  
