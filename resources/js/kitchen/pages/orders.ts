// orders.ts — Screen 2 (live orders feed) + Screen 3 (order detail)
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, Fragment  } from 'vue';
import type {PropType} from 'vue';
import Icon from '@/savora/Icon';
import { TableShell, TR, TD, TableToolbar, Pagination } from '@/savora/table';
import { Card, Button, IconButton, Avatar, SectionTitle } from '@/savora/ui';
import { ORDER_FLOW, PAY_METHOD_LABEL, naira  } from '../data';
import type {Order} from '../data';
import { kitchenStore, advanceOrder, addIncoming } from '../store';
import { Pill, PaymentCell, FilterPill, EmptyState, PageBack } from '../ui';

const Toast = defineComponent({
  name: 'KToast',
  props: { order: { type: Object as PropType<Order>, required: true }, onView: Function as PropType<() => void>, onClose: Function as PropType<() => void> },
  setup(props) {
    return () => h('div', {
      style: { position: 'fixed', right: '24px', bottom: '24px', zIndex: 200, width: '320px', maxWidth: 'calc(100vw - 48px)',
        background: 'var(--sav-surface)', border: '1px solid var(--sav-border)', borderRadius: '16px', boxShadow: 'var(--sav-shadow-lg)',
        padding: '16px', display: 'flex', gap: '12px', animation: 'sav-fade-up 280ms cubic-bezier(0.16,1,0.3,1) both' },
    }, [
      h('div', { style: { width: '40px', height: '40px', borderRadius: '11px', background: 'var(--sav-primary-soft)', color: 'var(--sav-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' } }, [
        h('span', { style: { position: 'absolute', inset: 0, borderRadius: '11px', border: '2px solid var(--sav-primary)', animation: 'sav-pulse 1.4s ease-in-out infinite' } }),
        h(Icon, { name: 'receipt', size: 20 }),
      ]),
      h('div', { style: { flex: 1, minWidth: 0 } }, [
        h('div', { style: { fontSize: '13.5px', fontWeight: 700, color: 'var(--sav-ink)' } }, `New order #${props.order.id}`),
        h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '2px' } }, `${props.order.customer} · ${props.order.items.length} items · ${naira(props.order.total)}`),
        h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, [
          h(Button, { size: 'sm', onClick: props.onView }, () => 'View order'),
          h(Button, { variant: 'ghost', size: 'sm', onClick: props.onClose }, () => 'Dismiss'),
        ]),
      ]),
      h('button', { onClick: props.onClose, style: { color: 'var(--sav-ink-4)', alignSelf: 'flex-start' } }, [h(Icon, { name: 'close', size: 16 })]),
    ]);
  },
});

const STATUSES = [
  { id: 'placed',     label: 'Placed',     dot: 'var(--sav-ink-3)' },
  { id: 'confirmed',  label: 'Confirmed',  dot: '#4B59C4' },
  { id: 'preparing',  label: 'Preparing',  dot: '#E0A100' },
  { id: 'ready',      label: 'Ready',      dot: '#8A6FD6' },
  { id: 'delivering', label: 'Delivering', dot: 'var(--sav-primary)' },
  { id: 'delivered',  label: 'Delivered',  dot: '#1F8A5B' },
  { id: 'cancelled',  label: 'Cancelled',  dot: '#D64545' },
];

export const Orders = defineComponent({
  name: 'KitchenOrders',
  props: { empty: Boolean, onOpenOrder: Function as PropType<(id: string) => void> },
  setup(props) {
    const filter = ref('all');
    const q = ref('');
    const toast = ref<Order | null>(null);
    let arrived: string | null = null;
    let incomingTimer: ReturnType<typeof setTimeout> | undefined;
    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    onMounted(() => {
      if (props.empty) {
return;
}

      // mock websocket: a new order arrives shortly after opening the feed
      incomingTimer = setTimeout(() => addIncoming(), 4200);
    });
    onBeforeUnmount(() => {
 clearTimeout(incomingTimer); clearTimeout(toastTimer); 
});

    // surface a toast when a new order lands
    watch(() => kitchenStore.lastArrived, (id) => {
      if (id && id !== arrived) {
        arrived = id;
        const o = kitchenStore.orders.find((x) => x.id === id);

        if (o) {
 toast.value = o; clearTimeout(toastTimer); toastTimer = setTimeout(() => (toast.value = null), 6000); 
}
      }
    });

    const columns = [
      { label: 'Order', width: 90 },
      { label: 'Customer' },
      { label: 'Type', width: 110 },
      { label: 'Status', width: 130 },
      { label: 'Payment', width: 150 },
      { label: 'Total', align: 'right', width: 110 },
    ];

    return () => {
      if (props.empty) {
        return h(EmptyState, { icon: 'receipt', title: 'No orders yet', desc: "When customers place orders from your storefront they'll appear here in real time — you'll be able to confirm, prepare and track each one." });
      }

      const orders = kitchenStore.orders;
      const countOf = (id: string) => orders.filter((o) => o.status === id).length;
      let rows = filter.value === 'all' ? orders : orders.filter((o) => o.status === filter.value);

      if (q.value) {
rows = rows.filter((o) => (o.customer + o.id + o.area).toLowerCase().includes(q.value.toLowerCase()));
}

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [
          h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 700, color: 'var(--sav-success)', padding: '7px 12px', borderRadius: '999px', background: 'var(--sav-success-soft)' } }, [
            h('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--sav-success)', animation: 'sav-pulse 1.6s ease-in-out infinite' } }), 'Live feed',
          ]),
          h('div', { style: { flex: 1 } }),
          h(Button, { variant: 'secondary', size: 'sm', icon: 'bell', onClick: () => addIncoming() }, () => 'Simulate new order'),
        ]),

        h('div', { style: { display: 'flex', gap: '9px', flexWrap: 'wrap' } }, [
          h(FilterPill, { label: 'All', count: orders.length, active: filter.value === 'all', onClick: () => (filter.value = 'all') }),
          ...STATUSES.map((s) => h(FilterPill, { key: s.id, label: s.label, dotColor: s.dot, count: countOf(s.id), active: filter.value === s.id, onClick: () => (filter.value = s.id) })),
        ]),

        h(TableShell, { columns }, {
          toolbar: () => h(TableToolbar, { label: 'Orders', count: rows.length, search: q.value, onSearch: (v: string) => (q.value = v) }, {
            actions: () => h(Button, { variant: 'secondary', size: 'sm', icon: 'download' }, () => h('span', { class: 'sav-hide-sm' }, 'Export')),
          }),
          footer: () => h(Pagination, { shown: rows.length, total: orders.length }),
          default: () => [
            rows.length === 0 ? h('tr', {}, [h('td', { colspan: columns.length, style: { padding: '40px', textAlign: 'center', color: 'var(--sav-ink-3)', fontSize: '14px' } }, 'No orders in this status.')]) : null,
            ...rows.map((o) => {
              const fresh = o.id === kitchenStore.lastArrived;

              return h(TR, { key: o.id, onClick: () => props.onOpenOrder?.(o.id) }, () => [
                h(TD, { style: fresh ? { position: 'relative' } : undefined }, () => [
                  fresh ? h('span', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--sav-primary)' } }) : null,
                  h('span', { style: { fontWeight: 700, color: 'var(--sav-ink-2)' } }, `#${o.id}`),
                  fresh ? h('span', { style: { display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--sav-primary-dark)', letterSpacing: '0.04em' } }, 'NEW') : null,
                ]),
                h(TD, {}, () => [
                  h('div', { style: { fontWeight: 600 } }, o.customer),
                  h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' } }, [h(Icon, { name: 'pin', size: 12, color: 'var(--sav-ink-4)' }), `${o.area} · ${o.time}`]),
                ]),
                h(TD, {}, () => h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--sav-ink-2)', fontWeight: 600 } }, [
                  h(Icon, { name: o.deliveryType === 'pickup' ? 'store' : 'truck', size: 15, color: 'var(--sav-ink-3)' }), o.deliveryType === 'pickup' ? 'Pickup' : 'Delivery',
                ])),
                h(TD, {}, () => h(Pill, { status: o.status })),
                h(TD, {}, () => h(PaymentCell, { order: o })),
                h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, naira(o.total))),
              ]);
            }),
          ],
        }),

        toast.value ? h(Toast, { order: toast.value, onView: () => {
 props.onOpenOrder?.(toast.value!.id); toast.value = null; 
}, onClose: () => (toast.value = null) }) : null,
      ]);
    };
  },
});

// ── Order detail (Screen 3) ──────────────────────────────────
const StepFlow = defineComponent({
  name: 'KStepFlow',
  props: { status: { type: String, required: true } },
  setup(props) {
    const steps = ['placed', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

    return () => {
      if (props.status === 'cancelled') {
return null;
}

      const idx = steps.indexOf(props.status);

      return h('div', { style: { display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: '10px' } },
        steps.map((s, i) => {
          const done = i < idx, current = i === idx;

          return h(Fragment, { key: s }, [
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, [
              h('span', { style: { width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--sav-primary)' : current ? 'var(--sav-primary-soft)' : 'var(--sav-surface-2)',
                color: done ? '#fff' : current ? 'var(--sav-primary-dark)' : 'var(--sav-ink-4)',
                border: current ? '2px solid var(--sav-primary)' : 'none' } },
                [done ? h(Icon, { name: 'check', size: 13, stroke: 2.6 }) : h('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' } })]),
              h('span', { style: { fontSize: '12px', fontWeight: current ? 700 : 600, color: done || current ? 'var(--sav-ink-2)' : 'var(--sav-ink-4)', textTransform: 'capitalize' } }, s),
            ]),
            i < steps.length - 1 ? h('span', { style: { width: '26px', height: '2px', background: done ? 'var(--sav-primary)' : 'var(--sav-border)', margin: '0 8px' } }) : null,
          ]);
        }));
    };
  },
});

export const OrderDetail = defineComponent({
  name: 'KitchenOrderDetail',
  props: { orderId: { type: String, required: true }, onBack: Function as PropType<() => void> },
  setup(props) {
    return () => {
      const o = kitchenStore.orders.find((x) => x.id === props.orderId);

      if (!o) {
        return h(EmptyState, { icon: 'receipt', title: 'Order not found', desc: 'This order is no longer available.' }, {
          action: () => h(Button, { variant: 'secondary', onClick: props.onBack }, () => 'Back to orders'),
        });
      }

      const flow = ORDER_FLOW[o.status] || { next: [], cancellable: false };
      const nextSteps = flow.next.filter((n) => !(n.deliveryOnly && o.deliveryType !== 'delivery') && !(n.pickupOnly && o.deliveryType !== 'pickup'));
      const terminal = o.status === 'delivered' || o.status === 'cancelled';

      const fulfilRows = [
        { icon: o.deliveryType === 'pickup' ? 'store' : 'truck', label: o.deliveryType === 'pickup' ? 'Pickup' : 'Standard delivery', sub: o.deliveryType === 'pickup' ? 'Customer collects at counter' : o.address },
        { icon: 'pin', label: 'Delivery area', sub: o.area },
        { icon: 'card', label: PAY_METHOD_LABEL[o.payMethod] || o.payMethod, sub: 'Payment ' + o.payStatus },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' } }, [
          h(PageBack, { onClick: props.onBack }, () => 'Orders'),
          h('div', { style: { flex: 1, minWidth: 0 } }, [
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [
              h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '24px', lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--sav-ink)', whiteSpace: 'nowrap' } }, `Order #${o.id}`),
              h(Pill, { status: o.status }),
            ]),
            h('div', { style: { fontSize: '13px', color: 'var(--sav-ink-3)', marginTop: '6px', textTransform: 'capitalize' } }, `${o.status} · ${o.payStatus} · ${o.deliveryType} · ${o.time}`),
          ]),
        ]),

        h(Card, {}, () => [
          h(SectionTitle, { sub: terminal ? 'This order is complete.' : 'Move the order to its next stage' }, { default: () => 'Fulfilment' }),
          h(StepFlow, { status: o.status }),
          !terminal ? h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--sav-border)' } }, [
            ...nextSteps.map((n) => h(Button, { key: n.to, icon: n.icon, onClick: () => advanceOrder(o.id, n.to) }, () => n.label)),
            flow.cancellable ? h(Button, { variant: 'secondary', icon: 'close', style: { color: 'var(--sav-danger)', borderColor: 'var(--sav-danger-soft)' }, onClick: () => advanceOrder(o.id, 'cancelled') }, () => 'Cancel order') : null,
          ]) : null,
          o.status === 'cancelled' ? h('div', { style: { marginTop: '16px', padding: '12px 14px', borderRadius: '12px', background: 'var(--sav-danger-soft)', color: 'var(--sav-danger)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' } }, [
            h(Icon, { name: 'alert', size: 16 }), `This order was cancelled${o.payStatus === 'refunded' ? ' and refunded.' : '.'}`,
          ]) : null,
        ]),

        h('div', { class: 'sav-grid-2-1', style: { alignItems: 'start' } }, [
          h(Card, { pad: 0, style: { overflow: 'hidden' } }, () => [
            h('div', { style: { padding: '16px 20px', borderBottom: '1px solid var(--sav-border)' } }, [h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '15px', color: 'var(--sav-ink)' } }, 'Items')]),
            h('div', { style: { padding: '6px 20px' } }, o.items.map((it, i) => h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--sav-border)' } }, [
              h('span', { style: { minWidth: '30px', height: '30px', borderRadius: '8px', background: 'var(--sav-surface-2)', color: 'var(--sav-ink-2)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, `${it.qty}×`),
              h('span', { style: { flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--sav-ink)' } }, it.name),
              h('span', { style: { fontSize: '13px', color: 'var(--sav-ink-3)' } }, naira(it.price)),
              h('span', { style: { fontSize: '14px', fontWeight: 700, fontFamily: 'var(--sav-display)', color: 'var(--sav-ink)', minWidth: '72px', textAlign: 'right' } }, naira(it.qty * it.price)),
            ]))),
            h('div', { style: { padding: '14px 20px', background: 'var(--sav-surface-2)' } }, [
              ...[['Subtotal', o.subtotal], ['Delivery', o.deliveryFee ?? 0]].map(([k, v]) => h('div', { key: k as string, style: { display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: 'var(--sav-ink-2)', padding: '3px 0' } }, [
                h('span', {}, k as string),
                h('span', { style: { fontWeight: 600 } }, (v === 0 && k === 'Delivery') ? 'Free' : naira(v as number)),
              ])),
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--sav-border)' } }, [
                h('span', { style: { fontSize: '14px', fontWeight: 700, color: 'var(--sav-ink)' } }, 'Total'),
                h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '22px', color: 'var(--sav-ink)', letterSpacing: '-0.02em' } }, naira(o.total)),
              ]),
            ]),
          ]),

          h(Card, { style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, () => [
            h(SectionTitle, { sub: 'Customer & delivery' }, { default: () => 'Fulfilment' }),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '11px' } }, [
              h(Avatar, { name: o.customer, size: 42 }),
              h('div', { style: { flex: 1, minWidth: 0 } }, [
                h('div', { style: { fontSize: '14px', fontWeight: 700, color: 'var(--sav-ink)' } }, o.customer),
                h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, o.phone),
              ]),
              h(IconButton, { name: 'bell', size: 36 }),
            ]),
            ...fulfilRows.map((r, i) => h('div', { key: i, style: { display: 'flex', gap: '11px', alignItems: 'flex-start' } }, [
              h('div', { style: { width: '34px', height: '34px', borderRadius: '9px', background: 'var(--sav-surface-2)', color: 'var(--sav-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, [h(Icon, { name: r.icon, size: 16 })]),
              h('div', { style: { minWidth: 0 } }, [
                h('div', { style: { fontSize: '13.5px', fontWeight: 600, color: 'var(--sav-ink)' } }, r.label),
                h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', lineHeight: 1.4 } }, r.sub),
              ]),
            ])),
            o.note ? h('div', { style: { padding: '12px 14px', borderRadius: '12px', background: 'var(--sav-warn-soft)', display: 'flex', gap: '9px' } }, [
              h(Icon, { name: 'alert', size: 16, color: '#9a6f00', style: { flexShrink: 0, marginTop: '1px' } }),
              h('div', {}, [
                h('div', { style: { fontSize: '12px', fontWeight: 700, color: '#9a6f00' } }, 'Order note'),
                h('div', { style: { fontSize: '13px', color: 'var(--sav-ink-2)', marginTop: '2px', lineHeight: 1.4 } }, o.note),
              ]),
            ]) : null,
          ]),
        ]),
      ]);
    };
  },
});
