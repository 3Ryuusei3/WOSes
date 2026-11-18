import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
    // Heartbeat más frecuente: detecta antes conexiones muertas (móvil/wifi)
    heartbeatIntervalMs: 15000,
    // Heartbeat desde un Web Worker (script inline): los navegadores no lo
    // congelan cuando la pestaña pasa a segundo plano.
    worker: true,
    // Reintentos rápidos al principio, luego más espaciados
    reconnectAfterMs: (tries: number) =>
      [500, 1000, 2000, 3000, 5000][tries - 1] ?? 8000,
  },
});
