// service-worker.js básico para validar PWA
self.addEventListener("install", event => {
  console.log("Service Worker instalado.");
});

self.addEventListener("activate", event => {
  console.log("Service Worker ativado.");
});

self.addEventListener("fetch", event => {
  // Não altera nada, apenas permite o PWA funcionar
});