import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        // Loosely typed to stay compatible across laravel-echo versions.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Echo: any;
        Pusher: typeof Pusher;
    }
}

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
