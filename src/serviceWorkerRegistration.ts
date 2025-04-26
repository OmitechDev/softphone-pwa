// Este código opcional se utiliza para registrar un service worker.
// register() no se llama de forma predeterminada.

// Esto permite que la aplicación cargue más rápido en visitas posteriores en producción y brinda
// capacidades sin conexión. Sin embargo, también significa que los desarrolladores (y usuarios)
// solo verán actualizaciones implementadas en visitas posteriores a una página, después de que todas las
// pestañas existentes abiertas en la página se hayan cerrado, ya que los recursos previamente
// en caché se actualizan en segundo plano.

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
      // [::1] es la dirección de localhost de IPv6.
      window.location.hostname === '[::1]' ||
      // 127.0.0.0/8 se considera localhost para IPv4.
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
  
  type Config = {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
  };
  
  export function register(config?: Config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      // La URL constructor está disponible en todos los navegadores que admiten SW.
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      if (publicUrl.origin !== window.location.origin) {
        // Nuestro service worker no funcionará si PUBLIC_URL está en un origen diferente
        // del que se sirve nuestra página. Esto podría suceder si se usa un CDN
        // para servir activos; vea https://github.com/facebook/create-react-app/issues/2374
        return;
      }
  
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
        if (isLocalhost) {
          // Esto se está ejecutando en localhost. Verifiquemos si existe un service worker o no.
          checkValidServiceWorker(swUrl, config);
  
          // Agrega algunos registros adicionales a localhost, señalando a los desarrolladores los
          // service worker/PWA documentation.
          navigator.serviceWorker.ready.then(() => {
            console.log(
              'Esta aplicación web está siendo servida en caché por un service worker. Para obtener más información, visite https://cra.link/PWA'
            );
          });
        } else {
          // No es localhost. Solo registra el service worker
          registerValidSW(swUrl, config);
        }
      });
    }
  }
  
  function registerValidSW(swUrl: string, config?: Config) {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // En este punto, el contenido precargado anterior ha sido purgado y
                // el contenido nuevo se ha agregado al caché.
                // Es el momento perfecto para mostrar un mensaje "Nuevo contenido está
                // disponible; por favor actualice." en su aplicación web.
                console.log('Nuevo contenido está disponible y se utilizará cuando todas las pestañas de esta página se cierren.');
  
                // Ejecuta callback
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // En este punto, todo ha sido precargado.
                // Es el momento perfecto para mostrar un mensaje
                // "El contenido está almacenado en caché para uso sin conexión." en su aplicación web.
                console.log('El contenido está almacenado en caché para uso sin conexión.');
  
                // Ejecuta callback
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('Error durante el registro del service worker:', error);
      });
  }
  
  function checkValidServiceWorker(swUrl: string, config?: Config) {
    // Verifica si se puede encontrar el service worker. Si no puede recargar la página.
    fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    })
      .then((response) => {
        // Asegúrese de que exista el service worker y que realmente obtengamos un archivo JS.
        const contentType = response.headers.get('content-type');
        if (
          response.status === 404 ||
          (contentType != null && contentType.indexOf('javascript') === -1)
        ) {
          // No se encontró ningún service worker. Probablemente una aplicación diferente. Recarga la página.
          navigator.serviceWorker.ready.then((registration) => {
            registration.unregister().then(() => {
              window.location.reload();
            });
          });
        } else {
          // Se encontró el service worker. Proceda normalmente.
          registerValidSW(swUrl, config);
        }
      })
      .catch(() => {
        console.log('No se encontró conexión a Internet. La aplicación se ejecuta en modo offline.');
      });
  }
  
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister();
        })
        .catch((error) => {
          console.error('Error al dar de baja el service worker:', error);
        });
    }
  }