// customers.ts — Customers table page (ported from admin-customers.jsx)
import { defineComponent, h, ref } from 'vue';
import { Card, Button, Avatar, TierBadge } from '../ui';
import { TableShell, TR, TD, TableToolbar, Pagination } from '../table';
import { MiniBar } from '../charts';
import Icon from '../Icon';
import { savora } from '../store';

export const Customers = defineComponent({
  name: 'SavCustomers',
  setup() {
    const filter = ref('all');
    const q = ref('');
    const filters = [
      { id: 'all', label: 'All' }, { id: 'VIP', label: 'VIP' },
      { id: 'Regular', label: 'Regular' }, { id: 'New', label: 'New' },
    ];
    const columns = [
      { label: 'Customer' }, { label: 'Location', width: 150 }, { label: 'Tier', width: 100 },
      { label: 'Orders', width: 150 }, { label: 'Lifetime spend', align: 'right', width: 130 }, { label: 'Last order', align: 'right', width: 120 },
    ];
    return () => {
      const { CUSTOMERS, STATS } = savora;
      let rows = CUSTOMERS as any[];
      if (filter.value !== 'all') rows = rows.filter((c) => c.tier === filter.value);
      if (q.value) rows = rows.filter((c) => (c.name + c.email + c.area).toLowerCase().includes(q.value.toLowerCase()));
      const maxOrders = Math.max(...CUSTOMERS.map((c) => c.orders));

      const stats = [
        { label: 'Total customers', value: STATS?.customers_total ?? String(CUSTOMERS.length), tone: 'var(--sav-ink)' },
        { label: 'New today', value: STATS?.new_today ?? '0', tone: 'var(--sav-success)' },
        { label: 'VIP segment', value: STATS?.vip_segment ?? '0', tone: 'var(--sav-primary)' },
        { label: 'Repeat rate', value: STATS?.repeat_rate ?? '0%', tone: 'var(--sav-ink)' },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-stat-strip' }, stats.map((s, i) =>
          h(Card, { key: i, pad: 16, style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, () => [
            h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, s.label),
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '24px', color: s.tone, letterSpacing: '-0.02em' } }, s.value),
          ]))),

        h(TableShell, { columns }, {
          toolbar: () => h(TableToolbar, { label: 'Customers', count: rows.length, filters, activeFilter: filter.value, onFilter: (v: string) => (filter.value = v), search: q.value, onSearch: (v: string) => (q.value = v) }, {
            actions: () => h(Button, { variant: 'secondary', size: 'sm', icon: 'download' }, () => h('span', { class: 'sav-hide-sm' }, 'Export')),
          }),
          footer: () => h(Pagination, { shown: rows.length, total: STATS?.customers_total ?? String(CUSTOMERS.length) }),
          default: () => rows.map((c) =>
            h(TR, { key: c.id, onClick: () => {} }, () => [
              h(TD, {}, () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '11px' } }, [
                h(Avatar, { src: c.avatar, name: c.name, size: 38 }),
                h('div', {}, [
                  h('div', { style: { fontWeight: 600 } }, c.name),
                  h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)' } }, c.email),
                ]),
              ])),
              h(TD, {}, () => h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--sav-ink-2)', fontSize: '13px' } }, [h(Icon, { name: 'pin', size: 13, color: 'var(--sav-ink-4)' }), c.area])),
              h(TD, {}, () => h(TierBadge, { tier: c.tier })),
              h(TD, {}, () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
                h('span', { style: { fontWeight: 700, color: 'var(--sav-ink)', width: '24px' } }, c.orders),
                h('div', { style: { flex: 1, maxWidth: '80px' } }, [h(MiniBar, { value: c.orders, max: maxOrders })]),
              ])),
              h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, c.spend)),
              h(TD, { align: 'right' }, () => h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, c.last)),
            ])),
        }),
      ]);
    };
  },
});
