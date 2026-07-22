// store.ts — single reactive source the kitchen console reads from.
// Models the design's mock "live order store": orders advance through the
// fulfilment flow in place, and a new order can "arrive" on the feed.
import { reactive } from 'vue';
import { ORDERS, INCOMING_ORDER  } from './data';
import type {Order} from './data';

const clone = (list: Order[]): Order[] => list.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }));

export const kitchenStore = reactive<{ orders: Order[]; lastArrived: string | null }>({
  orders: clone(ORDERS),
  lastArrived: null,
});

export function advanceOrder(id: string, to: string): void {
  const o = kitchenStore.orders.find((x) => x.id === id);

  if (o) {
 o.status = to; o.time = 'just now'; 
}
}

export function addIncoming(): void {
  if (kitchenStore.orders.some((o) => o.id === INCOMING_ORDER.id)) {
return;
}

  kitchenStore.orders.unshift({ ...INCOMING_ORDER, items: INCOMING_ORDER.items.map((i) => ({ ...i })) });
  kitchenStore.lastArrived = INCOMING_ORDER.id;
}

export function resetOrders(): void {
  kitchenStore.orders = clone(ORDERS);
  kitchenStore.lastArrived = null;
}
