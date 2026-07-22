// kitchens.ts — Kitchens (vendors) page, grid of cards (ported from admin-kitchens.jsx)
import { defineComponent, h, ref } from 'vue';
import { Card, Button, StatusPill, Segmented, SearchInput } from '../ui';
import Icon from '../Icon';
import { savora } from '../store';

type Any = Record<string, any>;

const KitchenCard = (k: Any) =>
  h(Card, { pad: 0, hover: true, style: { overflow: 'hidden', display: 'flex', flexDirection: 'column' } }, () => [
    h('div', { style: { height: '64px', background: k.color, position: 'relative' } }, [
      h('div', { style: { position: 'absolute', top: '12px', right: '12px' } }, [h(StatusPill, { status: k.status })]),
    ]),
    h('div', { style: { padding: '0 18px 18px', marginTop: '-22px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 } }, [
      h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' } }, [
        h('div', { style: { width: '52px', height: '52px', borderRadius: '14px', background: k.color, border: '3px solid var(--sav-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '22px', fontFamily: 'var(--sav-display)', boxShadow: 'var(--sav-shadow-sm)' } }, k.initial),
        h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 700, color: 'var(--sav-ink)' } }, [h(Icon, { name: 'star', size: 14, color: 'var(--sav-warn)' }), k.rating]),
      ]),
      h('div', {}, [
        h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '16px', color: 'var(--sav-ink)', letterSpacing: '-0.01em' } }, k.name),
        h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' } }, [h(Icon, { name: 'pin', size: 12, color: 'var(--sav-ink-4)' }), `${k.area} · ${k.code}`]),
      ]),
      h('div', { style: { display: 'flex', gap: '8px', marginTop: 'auto' } }, [
        h('div', { style: { flex: 1, padding: '10px 12px', borderRadius: '12px', background: 'var(--sav-surface-2)' } }, [
          h('div', { style: { fontSize: '11px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, 'GMV'),
          h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '16px', color: 'var(--sav-ink)', marginTop: '2px' } }, k.gmv),
        ]),
        h('div', { style: { flex: 1, padding: '10px 12px', borderRadius: '12px', background: 'var(--sav-surface-2)' } }, [
          h('div', { style: { fontSize: '11px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, 'Orders'),
          h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '16px', color: 'var(--sav-ink)', marginTop: '2px' } }, k.orders.toLocaleString()),
        ]),
      ]),
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--sav-border)' } }, [
        h('span', { style: { fontSize: '12px', color: 'var(--sav-ink-3)' } }, ['Commission ', h('strong', { style: { color: 'var(--sav-ink-2)' } }, `${k.commission}%`)]),
        h(Button, { variant: 'ghost', size: 'sm', iconRight: 'arrow-ur' }, () => 'Manage'),
      ]),
    ]),
  ]);

export const Kitchens = defineComponent({
  name: 'SavKitchens',
  setup() {
    const filter = ref('all');
    const q = ref('');
    const filters = [
      { id: 'all', label: 'All' }, { id: 'active', label: 'Active' },
      { id: 'paused', label: 'Paused' }, { id: 'pending', label: 'Pending' },
    ];
    return () => {
      const { KITCHENS } = savora;
      let rows = KITCHENS as any[];
      if (filter.value !== 'all') rows = rows.filter((k) => k.status === filter.value);
      if (q.value) rows = rows.filter((k) => (k.name + k.area + k.code).toLowerCase().includes(q.value.toLowerCase()));

      const counts = {
        active: KITCHENS.filter((k) => k.status === 'active').length,
        paused: KITCHENS.filter((k) => k.status === 'paused').length,
        pending: KITCHENS.filter((k) => k.status === 'pending').length,
      };
      const stats = [
        { label: 'Total kitchens', value: KITCHENS.length, tone: 'var(--sav-ink)' },
        { label: 'Active', value: counts.active, tone: 'var(--sav-success)' },
        { label: 'Paused', value: counts.paused, tone: 'var(--sav-warn)' },
        { label: 'Pending review', value: counts.pending, tone: '#8A6FD6' },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-stat-strip' }, stats.map((s, i) =>
          h(Card, { key: i, pad: 16, style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, () => [
            h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, s.label),
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '24px', color: s.tone, letterSpacing: '-0.02em' } }, s.value),
          ]))),

        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, [
          h('div', { class: 'sav-hide-sm' }, [h(Segmented, { options: filters, value: filter.value, onChange: (v: string) => (filter.value = v) })]),
          h('div', { style: { flex: 1 } }),
          h(SearchInput, { value: q.value, onChange: (v: string) => (q.value = v), width: 240, placeholder: 'Search kitchens…' }),
          h(Button, { variant: 'primary', size: 'md', icon: 'plus' }, () => 'Add kitchen'),
        ]),

        h('div', { class: 'sav-kitchen-grid' }, rows.map((k) => h('div', { key: k.id }, [KitchenCard(k)]))),
      ]);
    };
  },
});
