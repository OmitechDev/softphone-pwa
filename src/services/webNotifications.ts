// webNotifications.ts - Funciones para manejar notificaciones web estilo WhatsApp

// Define NotificationAction locally if not found globally (ensure tsconfig.json includes "dom" lib)
interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

// Interfaz extendida para añadir propiedades personalizadas
interface ExtendedNotificationOptions extends NotificationOptions {
    customOnClick?: () => void;
    vibrate?: number | number[]; // Añadir la propiedad vibrate
    actions?: NotificationAction[]; // Añadir la propiedad actions
  }
  
  /**
   * Solicita permisos para mostrar notificaciones web
   * @returns Promise<boolean> - true si los permisos fueron concedidos
   */
  export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones web');
      return false;
    }
    
    try {
      if (Notification.permission === 'granted') {
        return true;
      }
      
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      
      return false;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  };
  
  // Variable para almacenar la notificación activa
  let activeNotification: Notification | null = null;
  // Variable para almacenar el audio activo
  let activeAudio: HTMLAudioElement | null = null;
  
  /**
   * Mostrar una notificación web estilo WhatsApp con sonido y vibración
   * @param title Título de la notificación
   * @param options Opciones adicionales de la notificación
   * @param soundUrl URL opcional del sonido a reproducir
   */
  export const showNotification = (
    title: string, 
    options: ExtendedNotificationOptions = {},
    soundUrl?: string
  ): void => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones web');
      return;
    }
    
    // Cerrar notificación anterior si existe
    if (activeNotification) {
      activeNotification.close();
      activeNotification = null;
    }
    
    // Detener sonido anterior si existe
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    
    // Verificar permisos
    if (Notification.permission === 'granted') {
      try {
        // Extraer la función customOnClick para usarla después
        const customOnClick = options.customOnClick;
        
        // Eliminar la propiedad personalizada para evitar errores
        delete options.customOnClick;
        
        // Opciones por defecto estilo WhatsApp
        const defaultOptions: NotificationOptions = {
          icon: '/phone-icon.png', // Asegúrate que este archivo exista
          badge: '/phone-badge.png',
          // Patrón de vibración estilo WhatsApp: vibrar - pausa - vibrar
          vibrate: [300, 100, 300],
          // Evitar que la notificación desaparezca automáticamente
          requireInteraction: true,
          // Hacer que la notificación aparezca por encima de otros contenidos
          silent: true, // Silenciar la notificación predeterminada para usar nuestro sonido personalizado
          ...options
        };
        
        // Crear notificación
        activeNotification = new Notification(title, defaultOptions);
        
        // Reproducir sonido personalizado si se proporciona URL
        if (soundUrl) {
          activeAudio = new Audio(soundUrl);
          activeAudio.volume = 1.0;
          activeAudio.loop = true;
          activeAudio.play().catch(err => console.warn('No se pudo reproducir el sonido de notificación:', err));
        } else {
          // Sonido predeterminado usando Web Audio API
          playRingtone();
        }
        
        // Manejar clic en la notificación
        activeNotification.onclick = function() {
          // Enfocar la ventana/pestaña
          window.focus();
          
          // Si hay una función de callback definida, ejecutarla
          if (customOnClick) {
            customOnClick();
          }
          
          // Cerrar la notificación
          this.close();
          activeNotification = null;
          
          // Detener sonido si existe
          if (activeAudio) {
            activeAudio.pause();
            activeAudio.currentTime = 0;
            activeAudio = null;
          }
        };
      } catch (error) {
        console.error('Error al mostrar notificación:', error);
      }
    } else {
      console.warn('Permisos de notificación no concedidos');
    }
  };
  
  /**
   * Cerrar notificación activa
   */
  export const closeNotification = (): void => {
    if (activeNotification) {
      activeNotification.close();
      activeNotification = null;
    }
    
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
  };
  
  /**
   * Reproducir un tono de llamada entrante usando Web Audio API
   */
  const playRingtone = (): void => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar oscilador para un tono agradable
      oscillator.type = 'sine';
      oscillator.frequency.value = 1200; // Frecuencia similar a WhatsApp
      
      // Configurar patrón de volumen
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      
      // Crear patrón de WhatsApp: rápido aumento, mantener, disminuir
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
      
      // Conectar nodos
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Iniciar y detener después de 0.6 segundos
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        // Cerrar contexto de audio para liberar recursos
        setTimeout(() => audioContext.close(), 100);
      }, 600);
    } catch (error) {
      console.error('Error al reproducir tono de notificación:', error);
    }
  };
  
  /**
   * Extrae el número de teléfono de una cadena con formato URI SIP
   * @param caller Cadena que puede contener una URI SIP o un número/nombre directamente
   * @returns El número de teléfono extraído o el valor original si no es una URI SIP
   */
  const extractPhoneNumber = (caller: string): string => {
    // Si es una URI SIP (contiene "sip:" y "@"), extraer solo el número
    if (caller.includes('sip:') && caller.includes('@')) {
      // Extraer la parte entre "sip:" y "@"
      const matches = caller.match(/sip:([^@]+)@/);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    
    // Si el caller es "Llamada entrante", devolver string vacío para evitarlo
    if (caller === 'Llamada entrante') {
      return '';
    }
    
    // Si no es una URI SIP o no se pudo extraer, devolver el valor original
    return caller;
  };
  
  /**
   * Mostrar una notificación de llamada entrante estilo WhatsApp
   * @param caller Nombre o número del llamante
   * @param image URL opcional de la imagen del llamante
   * @param onAnswer Función a ejecutar cuando se responde
   */
  export const showIncomingCallNotification = (
    caller: string,
    image?: string,
    onAnswer?: () => void
  ): void => {
    // Extraer el número de teléfono si es una URI SIP
    const phoneNumber = extractPhoneNumber(caller);
    
    const options: ExtendedNotificationOptions = {
      body: 'Llamada entrante...',
      icon: image || '/caller-default.png',
      requireInteraction: true,
      // Nota: 'actions' no funciona en todos los navegadores
      // Se muestra cuando lo soporta el navegador
      actions: [
        { action: 'answer', title: 'Contestar' },
        { action: 'decline', title: 'Rechazar' }
      ],
      vibrate: [300, 200, 300, 200, 300],
      tag: 'incoming-call',
      // Función personalizada para manejar clics
      customOnClick: onAnswer
    };
    
    // Mostrar notificación con el número extraído
    showNotification(`📞 Llamada ${phoneNumber ? 'de ' + phoneNumber : 'entrante'}`, options, '/sounds/whatsapp-call.mp3');
  };
  
  export default {
    requestNotificationPermission,
    showNotification,
    closeNotification,
    showIncomingCallNotification
  };