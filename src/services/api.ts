import axios from "axios";
import { AuthResponse, User } from "../interfaces/User";
import { ContactsResponse, Contact } from "../interfaces/Contact";

// Obtener URL de la API desde variables de entorno o usar valor por defecto
const API_URL = process.env.REACT_APP_API_URL;

// Mostrar advertencia si no está definido en lugar de lanzar error
if (!process.env.REACT_APP_API_URL) {
  console.warn(
    "⚠️ REACT_APP_API_URL no está definido en el archivo .env. Usando URL por defecto:",
    API_URL
  );
  console.warn(
    "Para configurar, cree un archivo .env en la raíz del proyecto con REACT_APP_API_URL=su_url_api"
  );
}

// Crear instancia de axios con la base URL
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/api/login", {
      username,
      password,
      device_name: "web",
    });
    return response.data;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await api.get<ContactsResponse>("/api/contacts");
    return response.data.data;
  } catch (error) {
    console.error("Error al obtener contactos:", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("/api/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error en logout:", error);
    throw error;
  }
};

export const saveCurrentUser = (user: User, token: string): void => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

export default api;
