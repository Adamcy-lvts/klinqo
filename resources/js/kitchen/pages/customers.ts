// customers.ts — Screen 6: customers list + detail
import { defineComponent, h, ref  } from 'vue';
import type {PropType} from 'vue';
import { MiniBar } from '@/savora/charts';
import Icon from '@/savora/Icon';
import { TableShell, TR, TD, TableToolbar, Pagination } from '@/savora/table';
import { Card, Button, Avatar, TierBadge } from '@/savora/ui';
import { CUSTOMERS, CUSTOMER_ORDERS, naira } from '../data';
import { Pill, EmptyState, PageBack } from '../ui';

export const Customers = defineComponent({
  name: 'KitchenCustomers',
  props: { empty: Boolean, onOpenCustomer: Function as PropType<(id: string) => void> },
  setup(props) {
    const q = ref('');
    const columns = [
      { label: 'Customer' },
      { label: 'Contact', width: 200 },
      { label: 'Tier', width: 90 },
      { label: 'Orders', width: 160 },
      { label: 'Total spent', align: 'right', width: 130 },
      { label: 'Last order', align: 'right', width: 120 },
    ];

    return () => {
      if (props.empty) {
return h(EmptyState, { icon: 'users', title: 'No customers yet', desc: "Once people start ordering from your kitchen, you'll see them here — with their order count and lifetime spend." });
}

      let rows = CUSTOMERS.slice().sort((a, b) => b.orders - a.orders);

      if (q.value) {
rows = rows.filter((c) => (c.name + c.email + c.phone).toLowerCase().includes(q.value.toLowerCase()));
}

      const maxOrders = Math.max(...CUSTOMERS.map((c) => c.orders));
      const totalSpend = CUSTOMERS.reduce((s, c) => s + c.spendRaw, 0);
      const stats = [
        { label: 'Total customers', value: CUSTOMERS.length, tone: 'var(--sav-ink)' },
        { label: 'Repeat customers', value: CUSTOMERS.filter((c) => c.orders > 3).length, tone: 'var(--sav-primary-dark)' },
        { label: 'VIPs', value: CUSTOMERS.filter((c) => c.tier === 'VIP').length, tone: 'var(--sav-warn)' },
        { label: 'Lifetime revenue', value: naira(totalSpend), tone: 'var(--sav-success)' },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-stat-strip' }, stats.map((s, i) => h(Card, { key: i, pad: 16, style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, () => [
          h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, s.label),
          h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '22px', color: s.tone, letterSpacing: '-0.02em' } }, s.value),
        ]))),

        h(TableShell, { columns }, {
          toolbar: () => h(TableToolbar, { label: 'Customers', count: rows.length, search: q.value, onSearch: (v: string) => (q.value = v) }, {
            actions: () => h(Button, { variant: 'secondary', size: 'sm', icon: 'download' }, () => h('span', { class: 'sav-hide-sm' }, 'Export')),
          }),
          footer: () => h(Pagination, { shown: rows.length, total: CUSTOMERS.length }),
          default: () => rows.map((c) => h(TR, { key: c.id, onClick: () => props.onOpenCustomer?.(c.id) }, () => [
            h(TD, {}, () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '11px' } }, [h(Avatar, { src: c.avatar, name: c.name, size: 38 }), h('span', { style: { fontWeight: 600 } }, c.name)])),
            h(TD, {}, () => [h('div', { style: { fontSize: '13px', color: 'var(--sav-ink-2)' } }, c.phone), h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)' } }, c.email)]),
            h(TD, {}, () => h(TierBadge, { tier: c.tier })),
            h(TD, {}, () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
              h('span', { style: { fontWeight: 700, color: 'var(--sav-ink)', width: '22px' } }, c.orders),
              h('div', { style: { flex: 1, maxWidth: '90px' } }, [h(MiniBar, { value: c.orders, max: maxOrders })]),
            ])),
            h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, naira(c.spendRaw))),
            h(TD, { align: 'right' }, () => h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, c.last)),
          ])),
        }),
      ]);
    };
  },
});

export const CustomerDetail = defineComponent({
  name: 'KitchenCustomerDetail',
  props: { customerId: { type: String, required: true }, onBack: Function as PropType<() => void>, onOpenOrder: Function as PropType<(id: string) => void> },
  setup(props) {
    return () => {
      const c = CUSTOMERS.find((x) => x.id === props.customerId);

      if (!c) {
return h(EmptyState, { icon: 'users', title: 'Customer not found', desc: '' }, { action: () => h(Button, { variant: 'secondary', onClick: props.onBack }, () => 'Back') });
}

      const history = CUSTOMER_ORDERS[c.id] || [
        { id: '1019', status: 'delivered', payStatus: 'paid', totalRaw: Math.round(c.spendRaw / Math.max(1, c.orders)), date: 'Jun 12' },
        { id: '0994', status: 'delivered', payStatus: 'paid', totalRaw: 6400, date: 'Jun 05' },
      ];
      const contact = [{ icon: 'card', label: c.phone, sub: 'Phone' }, { icon: 'help', label: c.email, sub: 'Email' }];
      const summary: [string, string | number][] = [['Orders', c.orders], ['Lifetime spend', naira(c.spendRaw)]];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' } }, [
          h(PageBack, { onClick: props.onBack }, () => 'Customers'),
          h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '24px', lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--sav-ink)', whiteSpace: 'nowrap' } }, c.name),
        ]),

        h('div', { class: 'sav-grid-2-1', style: { alignItems: 'start' } }, [
          h(Card, { style: { display: 'flex', flexDirection: 'column', gap: '18px' } }, () => [
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } }, [
              h(Avatar, { src: c.avatar, name: c.name, size: 56 }),
              h('div', {}, [
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                  h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '19px', color: 'var(--sav-ink)' } }, c.name),
                  h(TierBadge, { tier: c.tier }),
                ]),
                h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '3px' } }, `Last ordered ${c.last}`),
              ]),
            ]),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, contact.map((r, i) => h('div', { key: i, style: { display: 'flex', gap: '11px', alignItems: 'center' } }, [
              h('div', { style: { width: '34px', height: '34px', borderRadius: '9px', background: 'var(--sav-surface-2)', color: 'var(--sav-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, [h(Icon, { name: r.icon, size: 16 })]),
              h('div', {}, [h('div', { style: { fontSize: '13.5px', fontWeight: 600, color: 'var(--sav-ink)' } }, r.label), h('div', { style: { fontSize: '11.5px', color: 'var(--sav-ink-3)' } }, r.sub)]),
            ]))),
            h('div', { style: { display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--sav-border)' } }, summary.map(([l, v]) => h('div', { key: l, style: { flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--sav-surface-2)' } }, [
              h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, l),
              h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '20px', color: 'var(--sav-ink)', marginTop: '4px' } }, v),
            ]))),
          ]),

          h(Card, { pad: 0, style: { overflow: 'hidden' } }, () => [
            h('div', { style: { padding: '16px 20px', borderBottom: '1px solid var(--sav-border)' } }, [h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '15px', color: 'var(--sav-ink)' } }, 'Order history')]),
            h('table', { style: { width: '100%', borderCollapse: 'collapse' } }, [h('tbody', {}, history.map((hh) => h(TR, { key: hh.id, onClick: () => props.onOpenOrder?.(hh.id) }, () => [
              h(TD, {}, () => h('span', { style: { fontWeight: 700, color: 'var(--sav-ink-2)' } }, `#${hh.id}`)),
              h(TD, {}, () => h(Pill, { status: hh.status })),
              h(TD, {}, () => h(Pill, { status: hh.payStatus, size: 'sm' })),
              h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, naira(hh.totalRaw))),
              h(TD, { align: 'right' }, () => h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, hh.date)),
            ])))]),
          ]),
        ]),
      ]);
    };
  },
});
