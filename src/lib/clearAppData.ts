export async function clearAppData() {
  // 1. Unregister all service workers
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
  }

  // 2. Clear all caches (Workbox precache + runtime caches)
  if (typeof caches !== "undefined") {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  // 3. Clear localStorage & sessionStorage
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.sessionStorage.clear();

    // 4. Reload fresh from network
    window.location.reload();
  }
}
