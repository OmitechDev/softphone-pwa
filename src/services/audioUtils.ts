// audioUtils.ts - Utilidades para generar sonidos mediante Web Audio API

// Estructura de audio global para reutilizar el contexto
let audioContext: AudioContext | null = null;

// Osciladores y nodos de ganancia activos
const activeOscillators: { [key: string]: OscillatorNode } = {};
const activeGains: { [key: string]: GainNode } = {};

// Estado de los osciladores (para saber si se han iniciado)
const oscillatorStarted: { [key: string]: boolean } = {};

// Frecuencias DTMF estándar (filas x columnas)
const DTMF_FREQUENCIES: { [key: string]: [number, number] } = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
  'A': [697, 1633], // Extensiones DTMF, poco usadas
  'B': [770, 1633],
  'C': [852, 1633],
  'D': [941, 1633]
};

/**
 * Inicializar el contexto de audio
 */
const initAudioContext = (): AudioContext => {
  if (!audioContext) {
    try {
      // Crear nuevo contexto de audio con soporte para navegadores antiguos
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Contexto de audio inicializado');
    } catch (error) {
      console.error('Error al inicializar contexto de audio:', error);
      // Fallback a un contexto vacío (para no romper el flujo)
      audioContext = {} as AudioContext;
    }
  }
  return audioContext;
};

/**
 * Verificar si el navegador soporta Web Audio API
 */
const isAudioSupported = (): boolean => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

/**
 * Solicitar permisos de notificación
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

/**
 * Mostrar una notificación web
 * @param title Título de la notificación
 * @param options Opciones de la notificación
 */
export const showNotification = (title: string, options: NotificationOptions = {}): void => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones web');
    return;
  }
  
  try {
    if (Notification.permission === 'granted') {
      // Establecer opciones por defecto
      const defaultOptions: NotificationOptions = {
        icon: '/phone-icon.png', // Asegúrate que este archivo exista
        badge: '/phone-badge.png',
        // vibrate: [200, 100, 200], // 'vibrate' is not a standard property in NotificationOptions type
        ...options
      };
      
      // Crear notificación
      const notification = new Notification(title, defaultOptions);
      
      // Auto-cerrar después de 10 segundos
      setTimeout(() => notification.close(), 10000);
      
      // Manejar clic en la notificación
      notification.onclick = function() {
        window.focus();
        notification.close();
      };
    }
  } catch (error) {
    console.error('Error al mostrar notificación:', error);
  }
};

/**
 * Reproducir un tono DTMF basado en una tecla
 * @param key La tecla DTMF (0-9, *, #, A-D)
 * @param duration Duración en milisegundos
 */
export const playDTMFTone = (key: string, duration: number = 150): void => {
  if (!isAudioSupported()) {
    console.warn('Web Audio API no soportada en este navegador');
    return;
  }

  try {
    const ctx = initAudioContext();
    if (!ctx.createOscillator) {
      console.warn('Contexto de audio no inicializado correctamente');
      return;
    }
    
    // Verificar que la tecla es válida
    if (!DTMF_FREQUENCIES[key]) {
      console.warn(`Tecla DTMF no válida: ${key}`);
      return;
    }

    // Obtener las frecuencias para esta tecla
    const [freqLow, freqHigh] = DTMF_FREQUENCIES[key];
    
    // Crear dos osciladores para las dos frecuencias DTMF
    const oscLow = ctx.createOscillator();
    const oscHigh = ctx.createOscillator();
    
    // Crear nodos de ganancia para controlar volumen
    const gainLow = ctx.createGain();
    const gainHigh = ctx.createGain();
    
    // Configurar osciladores
    oscLow.type = 'sine';
    oscHigh.type = 'sine';
    oscLow.frequency.value = freqLow;
    oscHigh.frequency.value = freqHigh;
    
    // Ajustar volumen (DTMF debe ser a volumen bajo)
    gainLow.gain.value = 0.1;
    gainHigh.gain.value = 0.1;
    
    // Conectar nodos
    oscLow.connect(gainLow);
    oscHigh.connect(gainHigh);
    gainLow.connect(ctx.destination);
    gainHigh.connect(ctx.destination);
    
    // Iniciar osciladores
    oscLow.start();
    oscHigh.start();
    
    // Detener después de la duración especificada
    setTimeout(() => {
      try {
        oscLow.stop();
        oscHigh.stop();
        
        // Desconectar para liberar recursos
        oscLow.disconnect();
        oscHigh.disconnect();
        gainLow.disconnect();
        gainHigh.disconnect();
      } catch (error) {
        console.error('Error al detener tono DTMF:', error);
      }
    }, duration);
    
  } catch (error) {
    console.error('Error al reproducir tono DTMF:', error);
  }
};

/**
 * Iniciar un tono de llamada continuo (ring)
 * @param type Tipo de tono: 'incoming' o 'outgoing'
 */
export const startRingTone = (type: 'incoming' | 'outgoing'): void => {
  if (!isAudioSupported()) {
    console.warn('Web Audio API no soportada en este navegador');
    return;
  }

  try {
    console.log(`Iniciando tono de llamada ${type}`);
    
    // Detener cualquier tono de llamada activo primero
    stopRingTone();
    
    const ctx = initAudioContext();
    if (!ctx.createOscillator) {
      console.warn('Contexto de audio no inicializado correctamente');
      return;
    }
    
    // Crear oscilador y ganancia
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Configurar según el tipo de tono
    if (type === 'incoming') {
      // Tono de llamada entrante - dos frecuencias con modulación de amplitud
      osc1.type = 'sine';
      osc1.frequency.value = 480; // Frecuencia estándar de timbre
      
      osc2.type = 'sine';
      osc2.frequency.value = 440; // Frecuencia secundaria
      
      // Configurar patrones de llamada entrante (ring ring - pausa - ring ring)
      gain.gain.value = 0.2;
      
      // Modulación de amplitud para crear el patrón de ring
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      
      // Patrón de llamada entrante estándar (2 segundos on, 4 segundos off)
      let time = now;
      for (let i = 0; i < 10; i++) { // Programar 10 ciclos de ring
        // Subir volumen
        gain.gain.linearRampToValueAtTime(0.2, time + 0.1);
        // Mantener volumen por 2 segundos
        time += 2;
        // Bajar volumen
        gain.gain.linearRampToValueAtTime(0, time + 0.1);
        // Silencio por 4 segundos
        time += 4;
      }
      
    } else {
      // Tono de llamada saliente - una frecuencia con modulación de amplitud
      osc1.type = 'sine';
      osc1.frequency.value = 440; // Tono estándar de llamada saliente
      
      // No usamos el segundo oscilador
      osc2.frequency.value = 0;
      
      // Configurar patrón de llamada saliente (beep - pausa - beep)
      const now = ctx.currentTime;
      gain.gain.value = 0.0;
      
      // Patrón de tono de salida estándar (1 segundo on, 3 segundos off)
      let time = now;
      for (let i = 0; i < 20; i++) { // Programar 20 ciclos de ring
        // Subir volumen
        gain.gain.linearRampToValueAtTime(0.15, time + 0.1);
        // Mantener volumen por 1 segundo
        time += 1;
        // Bajar volumen
        gain.gain.linearRampToValueAtTime(0, time + 0.1);
        // Silencio por 3 segundos
        time += 3;
      }
    }
    
    // Conectar nodos
    osc1.connect(gain);
    if (type === 'incoming') {
      osc2.connect(gain);
    }
    gain.connect(ctx.destination);
    
    // Guardar referencias para poder detenerlas después
    activeOscillators['ring1'] = osc1;
    activeOscillators['ring2'] = osc2;
    activeGains['ring'] = gain;
    
    // Iniciar osciladores y marcarlos como iniciados
    osc1.start();
    oscillatorStarted['ring1'] = true;
    
    if (type === 'incoming') {
      osc2.start();
      oscillatorStarted['ring2'] = true;
    }
    
    console.log('Tono de llamada iniciado correctamente');
    
  } catch (error) {
    console.error('Error al iniciar tono de llamada:', error);
  }
};

/**
 * Detener todos los tonos de llamada
 */
export const stopRingTone = (): void => {
  try {
    console.log('Intentando detener tonos de llamada');
    
    // Verificar y detener el primer oscilador
    if (activeOscillators['ring1'] && oscillatorStarted['ring1']) {
      try {
        activeOscillators['ring1'].stop();
        activeOscillators['ring1'].disconnect();
      } catch (error) {
        console.warn('Error al detener oscilador ring1:', error);
      }
    }
    
    // Verificar y detener el segundo oscilador
    if (activeOscillators['ring2'] && oscillatorStarted['ring2']) {
      try {
        activeOscillators['ring2'].stop();
        activeOscillators['ring2'].disconnect();
      } catch (error) {
        console.warn('Error al detener oscilador ring2:', error);
      }
    }
    
    // Desconectar el nodo de ganancia
    if (activeGains['ring']) {
      try {
        activeGains['ring'].disconnect();
      } catch (error) {
        console.warn('Error al desconectar nodo de ganancia:', error);
      }
    }
    
    // Limpiar las referencias
    delete activeOscillators['ring1'];
    delete activeOscillators['ring2'];
    delete activeGains['ring'];
    delete oscillatorStarted['ring1'];
    delete oscillatorStarted['ring2'];
    
    console.log('Tonos de llamada detenidos correctamente');
  } catch (error) {
    console.error('Error al detener tono de llamada:', error);
  }
};

/**
 * Reproducir un tono de feedback (beep)
 * @param frequency Frecuencia del tono en Hz
 * @param duration Duración en milisegundos
 */
export const playFeedbackTone = (frequency: number = 800, duration: number = 100): void => {
  if (!isAudioSupported()) {
    return;
  }

  try {
    const ctx = initAudioContext();
    if (!ctx.createOscillator) return;
    
    // Crear oscilador y ganancia
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Configurar oscilador
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    // Configurar ganancia
    gain.gain.value = 0.1;
    
    // Conectar nodos
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Iniciar oscilador
    osc.start();
    
    // Detener después de la duración especificada
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (error) {
        console.warn('Error al detener tono de feedback:', error);
      }
    }, duration);
    
  } catch (error) {
    console.error('Error al reproducir tono de feedback:', error);
  }
};

/**
 * Reproducir un tono de error
 */
export const playErrorTone = (): void => {
  if (!isAudioSupported()) {
    return;
  }

  try {
    // Reproducir dos tonos descendentes
    const ctx = initAudioContext();
    if (!ctx.createOscillator) return;
    
    // Crear oscilador y ganancia
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Configurar oscilador
    osc.type = 'sine';
    
    // Configurar ganancia
    gain.gain.value = 0.15;
    
    // Conectar nodos
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Iniciar con frecuencia alta y descender
    const startTime = ctx.currentTime;
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.linearRampToValueAtTime(200, startTime + 0.2);
    
    // Iniciar oscilador
    osc.start();
    
    // Detener después de la duración
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (error) {
        console.warn('Error al detener tono de error:', error);
      }
    }, 300);
    
  } catch (error) {
    console.error('Error al reproducir tono de error:', error);
  }
};

/**
 * Reproducir un tono de llamada ocupada (busy tone)
 */
export const playBusyTone = (duration: number = 3000): void => {
  if (!isAudioSupported()) {
    return;
  }

  try {
    const ctx = initAudioContext();
    if (!ctx.createOscillator) return;
    
    // Crear oscilador y ganancia
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Configurar oscilador
    osc.type = 'sine';
    osc.frequency.value = 480; // Frecuencia estándar para tono ocupado
    
    // Configurar patrón de ganancia (on-off-on-off...)
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    
    // Patrón de tono ocupado: 0.5s encendido, 0.5s apagado
    for (let i = 0; i < duration / 1000 * 2; i++) {
      const timeOffset = i * 0.5;
      if (i % 2 === 0) {
        // Encender
        gain.gain.linearRampToValueAtTime(0.15, now + timeOffset + 0.05);
      } else {
        // Apagar
        gain.gain.linearRampToValueAtTime(0, now + timeOffset + 0.05);
      }
    }
    
    // Conectar nodos
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Iniciar oscilador
    osc.start();
    
    // Detener después de la duración
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (error) {
        console.warn('Error al detener tono de ocupado:', error);
      }
    }, duration);
    
  } catch (error) {
    console.error('Error al reproducir tono de ocupado:', error);
  }
};

/**
 * Limpiar todos los recursos de audio
 */
export const cleanupAudio = (): void => {
  // Detener todos los tonos
  stopRingTone();
  
  // Cerrar el contexto de audio si existe
  if (audioContext && audioContext.close) {
    try {
      audioContext.close().catch(error => {
        console.error('Error al cerrar contexto de audio:', error);
      });
      audioContext = null;
      
      // Limpiar todas las referencias
      Object.keys(activeOscillators).forEach(key => {
        delete activeOscillators[key];
        delete oscillatorStarted[key];
      });
      
      Object.keys(activeGains).forEach(key => {
        delete activeGains[key];
      });
      
    } catch (error) {
      console.error('Error al limpiar recursos de audio:', error);
    }
  }
};

export default {
  playDTMFTone,
  startRingTone,
  stopRingTone,
  playFeedbackTone,
  playErrorTone,
  playBusyTone,
  cleanupAudio,
  isAudioSupported,
  requestNotificationPermission,
  showNotification
};