// payouts.ts — Payouts / finance page (ported from admin-payouts.jsx)
import { defineComponent, h, ref } from 'vue';
import { Card, Button, KitchenAvatar, StatusPill } from '../ui';
import { TableShell, TR, TD, TableToolbar, Pagination } from '../table';
import Icon from '../Icon';
import { savora } from '../store';

export const Payouts = defineComponent({
  name: 'SavPayouts',
  setup() {
    const filter = ref('all');
    const q = ref('');
    const filters = [
      { id: 'all', label: 'All' }, { id: 'paid', label: 'Paid' },
      { id: 'processing', label: 'Processing' }, { id: 'pending', label: 'Pending' },
    ];
    const columns = [
      { label: 'Payout ID', width: 110 }, { label: 'Kitchen' }, { label: 'Period', width: 160 },
      { label: 'Gross', align: 'right', width: 110 }, { label: 'Commission', align: 'right', width: 120 },
      { label: 'Net payout', align: 'right', width: 120 }, { label: 'Status', width: 130 }, { label: 'Sent', align: 'right', width: 90 },
    ];
    return () => {
      const { PAYOUTS, KITCHENS } = savora;
      let rows = PAYOUTS as any[];
      if (filter.value !== 'all') rows = rows.filter((p) => p.status === filter.value);
      if (q.value) rows = rows.filter((p) => (p.kitchen + p.id).toLowerCase().includes(q.value.toLowerCase()));

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-grid-2-1' }, [
          h(Card, { style: { background: 'linear-gradient(135deg, #2A1B12 0%, #4a2c18 100%)', border: 'none', color: '#fff', position: 'relative', overflow: 'hidden' } }, () => [
            h('div', { style: { position: 'absolute', right: '-20px', top: '-20px', fontSize: '130px', opacity: 0.08 } }, '₦'),
            h('div', { style: { fontSize: '13px', opacity: 0.8, fontWeight: 600 } }, "This week's payout volume"),
            h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' } }, [
              h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '38px', letterSpacing: '-0.03em' } }, '₦3.40M'),
              h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', fontSize: '12.5px', fontWeight: 700 } }, [h(Icon, { name: 'trend-up', size: 13 }), '9.1%']),
            ]),
            h('div', { style: { display: 'flex', gap: '28px', marginTop: '22px' } }, [
              h('div', {}, [h('div', { style: { fontSize: '11.5px', opacity: 0.7 } }, 'Commission earned'), h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '20px', marginTop: '3px' } }, '₦609K')]),
              h('div', {}, [h('div', { style: { fontSize: '11.5px', opacity: 0.7 } }, 'Avg. take rate'), h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '20px', marginTop: '3px' } }, '17.2%')]),
              h('div', {}, [h('div', { style: { fontSize: '11.5px', opacity: 0.7 } }, 'Pending'), h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '20px', marginTop: '3px' } }, '2')]),
            ]),
          ]),
          h(Card, { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, () => [
            h('div', {}, [
              h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '15px', color: 'var(--sav-ink)' } }, 'Next settlement'),
              h('div', { style: { fontSize: '13px', color: 'var(--sav-ink-3)', marginTop: '4px' } }, 'Auto-runs every Monday 09:00'),
            ]),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' } }, [
              h('div', { style: { width: '46px', height: '46px', borderRadius: '13px', background: 'var(--sav-primary-soft)', color: 'var(--sav-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [h(Icon, { name: 'clock', size: 22 })]),
              h('div', {}, [
                h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '22px', color: 'var(--sav-ink)' } }, '2d 14h'),
                h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)' } }, 'Jun 22 · 6 kitchens queued'),
              ]),
            ]),
            h(Button, { variant: 'primary', icon: 'wallet', style: { width: '100%' } }, () => 'Run payout now'),
          ]),
        ]),

        h(TableShell, { columns }, {
          toolbar: () => h(TableToolbar, { label: 'Payout history', count: rows.length, filters, activeFilter: filter.value, onFilter: (v: string) => (filter.value = v), search: q.value, onSearch: (v: string) => (q.value = v) }, {
            actions: () => h(Button, { variant: 'secondary', size: 'sm', icon: 'download' }, () => h('span', { class: 'sav-hide-sm' }, 'Statement')),
          }),
          footer: () => h(Pagination, { shown: rows.length, total: PAYOUTS.length }),
          default: () => rows.map((p) => {
            const k = KITCHENS.find((x) => x.id === p.code);
            return h(TR, { key: p.id, onClick: () => {} }, () => [
              h(TD, {}, () => h('span', { style: { fontWeight: 700, color: 'var(--sav-ink-2)', fontSize: '13px' } }, p.id)),
              h(TD, {}, () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
                h(KitchenAvatar, { initial: k?.initial || '?', color: k?.color || 'var(--sav-ink-3)', size: 30 }),
                h('span', { style: { fontWeight: 600, whiteSpace: 'nowrap' } }, p.kitchen),
              ])),
              h(TD, {}, () => h('span', { style: { fontSize: '13px', color: 'var(--sav-ink-2)' } }, p.period)),
              h(TD, { align: 'right' }, () => h('span', { style: { color: 'var(--sav-ink-2)' } }, p.gross)),
              h(TD, { align: 'right' }, () => h('span', { style: { color: 'var(--sav-danger)', fontWeight: 600 } }, `−${p.commission}`)),
              h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, p.net)),
              h(TD, {}, () => h(StatusPill, { status: p.status })),
              h(TD, { align: 'right' }, () => h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, p.date)),
            ]);
          }),
        }),
      ]);
    };
  },
});
