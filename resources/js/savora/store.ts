// store.ts — single reactive source the Savora console reads from.
// Defaults to the design's bundled mock data; the Inertia page overrides it
// with real platform data via setSavora() before first render.
import { reactive } from 'vue';
import * as mock from './data';

export const savora = reactive<Record<string, any>>({
  ADMIN_USER: mock.ADMIN_USER,
  LOGO_MARK: mock.LOGO_MARK,
  KPIS: mock.KPIS,
  SECONDARY: mock.SECONDARY,
  REVENUE_SERIES: mock.REVENUE_SERIES,
  CATEGORY_MIX: mock.CATEGORY_MIX,
  HOURLY: mock.HOURLY,
  KITCHENS: mock.KITCHENS,
  ORDERS: mock.ORDERS,
  CUSTOMERS: mock.CUSTOMERS,
  PAYOUTS: mock.PAYOUTS,
  ACTIVITY: mock.ACTIVITY,
  TEAM: mock.TEAM,
  FEES: mock.FEES,
});

export function setSavora(data: Record<string, any> | null | undefined): void {
  if (!data) return;
  // Only override keys the server actually sent, keeping mock fallbacks otherwise.
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) savora[k] = v;
  }
}
