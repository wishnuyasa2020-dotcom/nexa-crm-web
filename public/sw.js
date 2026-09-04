self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'Pesan Baru';
      const options = {
        body: data.body || 'Anda mendapat pesan baru',
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
          url: '/live-chat'
        }
      };
      
      event.waitUntil(self.registration.showNotification(title, options));
    } catch(err) {
      console.error('Error parsing push data:', err);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  const urlToOpen = new URL(event.notification.data?.url || '/live-chat', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Periksa apakah tab sudah terbuka
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/live-chat') && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
