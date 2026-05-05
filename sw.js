// Service Worker para o Sistema de Mapeamento do Algodão
const CACHE_NAME = 'algodao-mapping-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Arquivos essenciais para cachear
const ESSENTIAL_FILES = [
  '/',
  '/cotton_mapping_system.jsx',
  '/manifest.json',
  '/offline.html',
  // CDN Libraries
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando arquivos essenciais');
        return cache.addAll(ESSENTIAL_FILES.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .catch(err => {
        console.error('Service Worker: Erro no cache:', err);
        // Não falhar a instalação se algumas URLs não estiverem disponíveis
        return Promise.resolve();
      })
  );
  
  // Força a ativação imediata
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    Promise.all([
      // Remove caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Toma controle imediatamente
      self.clients.claim()
    ])
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Se existe no cache, retorna
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Senão, tenta buscar na rede
        return fetch(request)
          .then(response => {
            // Verifica se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta para armazenar no cache
            const responseToCache = response.clone();
            
            // Cachea recursos importantes
            if (shouldCache(request.url)) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(error => {
            console.log('Service Worker: Fetch falhou:', error);
            
            // Se é uma navegação e está offline, mostra página offline
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para outros recursos, retorna erro
            throw error;
          });
      })
  );
});

// Determina se um recurso deve ser cacheado
function shouldCache(url) {
  // Cachea recursos estáticos e bibliotecas CDN
  return url.includes('.js') || 
         url.includes('.css') || 
         url.includes('.json') ||
         url.includes('cdnjs.cloudflare.com') ||
         url.includes('fonts.googleapis.com');
}

// Listener para mensagens do app principal
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync Background para sincronização offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync ativado');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Aqui você pode implementar sincronização de dados quando voltar online
    console.log('Service Worker: Executando sincronização em background');
    
    // Exemplo: sincronizar dados pendentes do localStorage
    const pendingData = await getPendingData();
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
  } catch (error) {
    console.error('Service Worker: Erro na sincronização:', error);
  }
}

async function getPendingData() {
  // Implementar lógica para obter dados pendentes
  return [];
}

async function syncPendingData(data) {
  // Implementar lógica para sincronizar dados
  console.log('Service Worker: Sincronizando dados:', data);
}