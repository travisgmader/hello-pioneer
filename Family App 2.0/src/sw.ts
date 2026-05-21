/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Phase 6 will add: self.addEventListener('push', ...) and self.addEventListener('notificationclick', ...).
// Phase 1 deliberately ships precache-only to avoid SW bugs blocking the first deploy (Pitfall 4) and
// to avoid runtime caching of Supabase responses creating stale-auth states (Pitfall 10).
