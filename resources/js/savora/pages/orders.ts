// orders.ts — Orders table page (ported from admin-orders.jsx)
import { defineComponent, h, ref } from 'vue';
import { Card, Button, KitchenAvatar, StatusPill } from '../ui';
import { TableShell, TR, TD, TableToolbar, Pagination } from '../table';
import Icon from '../Icon';
import { savora } from '../store';

export const Orders = defineComponent({
  name: 'SavOrders',
  setup() {
    const filter = ref('all');
    const q = ref('');
    const filters = [
      { id: 'all', label: 'All' }, { id: 'preparing', label: 'Preparing' },
      { id: 'enroute', label: 'En route' }, { id: 'delivered', label: 'Delivered' }, { id: 'cancelled', label: 'Cancelled' },
    ];
    const columns = [
      { label: 'Order', width: 90 }, { label: 'Kitchen' }, { label: 'Customer' },
      { label: 'Items', align: 'center', width: 70 }, { label: 'Total', align: 'right', width: 100 },
      { label: 'Payment', width: 110 }, { label: 'Status', width: 130 }, { label: 'Time', align: 'right', width: 110 },
    ];
    return () => {
      const { ORDERS, KITCHENS, STATS } = savora;
      let rows = ORDERS as any[];
      if (filter.value !== 'all') rows = rows.filter((o) => o.status === filter.value || (filter.value === 'preparing' && o.status === 'ready'));
      if (q.value) rows = rows.filter((o) => (o.customer + o.kitchen + o.id + o.area).toLowerCase().includes(q.value.toLowerCase()));

      const active = ORDERS.filter((o) => ['preparing', 'ready', 'enroute'].includes(o.status)).length;
      const delivered = ORDERS.filter((o) => o.status === 'delivered').length;
      const cancelled = ORDERS.filter((o) => o.status === 'cancelled').length;

      const stats = [
        { label: 'Orders today', value: STATS?.orders_today ?? String(ORDERS.length), tone: 'var(--sav-ink)' },
        { label: 'In progress', value: active, tone: 'var(--sav-primary)' },
        { label: 'Delivered', value: delivered + ' shown', tone: 'var(--sav-success)' },
        { label: 'Cancelled', value: cancelled + ' shown', tone: 'var(--sav-danger)' },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-stat-strip' }, stats.map((s, i) =>
          h(Card, { key: i, pad: 16, style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, () => [
            h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, s.label),
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '24px', color: s.tone, letterSpacing: '-0.02em' } }, s.value),
          ]))),

        h(TableShell, { columns }, {
          toolbar: () => h(TableToolbar, { label: 'Orders', count: rows.length, filters, activeFilter: filter.value, onFilter: (v: string) => (filter.value = v), search: q.value, onSearch: (v: string) => (q.value = v) }, {
            actions: () => [
              h(Button, { variant: 'secondary', size: 'sm', icon: 'filter' }, () => h('span', { class: 'sav-hide-sm' }, 'Filter')),
              h(Button, { variant: 'secondary', size: 'sm', icon: 'download' }, () => h('span', { class: 'sav-hide-sm' }, 'Export')),
            ],
          }),
          footer: () => h(Pagination, { shown: rows.length, total: STATS?.orders_today ?? String(ORDERS.length) }),
          default: () => rows.map((o) => {
            const k = KITCHENS.find((x) => x.id === o.code);
            return h(TR, { key: o.id, onClick: () => {} }, () => [
              h(TD, {}, () => h('span', { style: { fontWeight: 700, color: 'var(--sav-ink-2)' } }, `#${o.id}`)),
              h(TD, {}, () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
                h(KitchenAvatar, { initial: k?.initial || '?', color: k?.color || 'var(--sav-ink-3)', size: 30 }),
                h('span', { style: { fontWeight: 600, whiteSpace: 'nowrap' } }, o.kitchen),
              ])),
              h(TD, {}, () => [
                h('div', { style: { fontWeight: 600 } }, o.customer),
                h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' } }, [h(Icon, { name: 'pin', size: 12, color: 'var(--sav-ink-4)' }), o.area]),
              ]),
              h(TD, { align: 'center' }, () => h('span', { style: { color: 'var(--sav-ink-2)', fontWeight: 600 } }, o.items)),
              h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, o.total)),
              h(TD, {}, () => h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--sav-ink-2)', fontWeight: 500 } }, [h(Icon, { name: o.pay === 'Cash' ? 'wallet' : 'card', size: 15, color: 'var(--sav-ink-3)' }), o.pay])),
              h(TD, {}, () => h(StatusPill, { status: o.status })),
              h(TD, { align: 'right' }, () => h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, o.time)),
            ]);
          }),
        }),
      ]);
    };
  },
});
