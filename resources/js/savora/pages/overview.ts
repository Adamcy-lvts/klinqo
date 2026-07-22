// overview.ts — Savora platform overview dashboard (ported from admin-overview.jsx)
import { defineComponent, h, ref } from 'vue';
import { Card, SectionTitle, Segmented, DeltaChip, KitchenAvatar, StatusPill, Button } from '../ui';
import { Sparkline, AreaChart, DonutChart, BarChart, MiniBar } from '../charts';
import Icon from '../Icon';
import { savora } from '../store';

type Any = Record<string, any>;

const KpiCard = (kpi: Any) => {
  const up = kpi.dir === 'up';
  return h(Card, { pad: 18, hover: true, style: { display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 } }, () => [
    h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' } }, [
      h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600, lineHeight: 1.3 } }, kpi.label),
      h(DeltaChip, { delta: kpi.delta, dir: kpi.dir, suffix: kpi.unit === 'count' ? '' : '%' }),
    ]),
    h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' } }, [
      h('div', {}, [
        h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '30px', letterSpacing: '-0.03em', color: 'var(--sav-ink)', lineHeight: 1 } }, kpi.value),
        h('div', { style: { fontSize: '11.5px', color: 'var(--sav-ink-4)', marginTop: '6px' } }, kpi.hint),
      ]),
      h(Sparkline, { data: kpi.spark, up, width: 92, height: 36 }),
    ]),
  ]);
};

const LiveOrderRow = (o: Any) => {
  const k = savora.KITCHENS.find((x: Any) => x.id === o.code);
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 4px', borderBottom: '1px solid var(--sav-border)' } }, [
    h(KitchenAvatar, { initial: k?.initial || '?', color: k?.color || 'var(--sav-ink-3)', size: 36 }),
    h('div', { style: { flex: 1, minWidth: 0 } }, [
      h('div', { style: { fontSize: '13.5px', fontWeight: 600, color: 'var(--sav-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, [o.customer, ' · ', h('span', { style: { color: 'var(--sav-ink-3)', fontWeight: 500 } }, `#${o.id}`)]),
      h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, `${o.kitchen} · ${o.items} items`),
    ]),
    h('div', { style: { textAlign: 'right', flexShrink: 0 } }, [
      h('div', { style: { fontSize: '13.5px', fontWeight: 700, color: 'var(--sav-ink)', fontFamily: 'var(--sav-display)' } }, o.total),
      h('div', { style: { marginTop: '4px' } }, [h(StatusPill, { status: o.status })]),
    ]),
  ]);
};

const ActivityRow = (a: Any) => {
  const tones: Record<string, Any> = {
    good: { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)' },
    bad: { bg: 'var(--sav-danger-soft)', fg: 'var(--sav-danger)' },
    warn: { bg: 'var(--sav-warn-soft)', fg: '#9a6f00' },
    neutral: { bg: 'var(--sav-surface-2)', fg: 'var(--sav-ink-2)' },
  };
  const t = tones[a.tone] || tones.neutral;
  return h('div', { style: { display: 'flex', gap: '11px', padding: '10px 0' } }, [
    h('div', { style: { width: '32px', height: '32px', borderRadius: '9px', background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, [h(Icon, { name: a.icon, size: 16 })]),
    h('div', { style: { flex: 1, minWidth: 0 } }, [
      h('div', { style: { fontSize: '13px', color: 'var(--sav-ink)', lineHeight: 1.4 } }, a.text),
      h('div', { style: { fontSize: '11.5px', color: 'var(--sav-ink-4)', marginTop: '2px' } }, a.time),
    ]),
  ]);
};

const TopKitchenRow = (k: Any, max: number, rank: number) =>
  h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0' } }, [
    h('span', { style: { fontSize: '12px', fontWeight: 700, color: 'var(--sav-ink-4)', width: '16px', fontFamily: 'var(--sav-display)' } }, rank),
    h(KitchenAvatar, { initial: k.initial, color: k.color, size: 34 }),
    h('div', { style: { flex: 1, minWidth: 0 } }, [
      h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' } }, [
        h('span', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--sav-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, k.name),
        h('span', { style: { fontSize: '13px', fontWeight: 700, color: 'var(--sav-ink)', fontFamily: 'var(--sav-display)', flexShrink: 0 } }, k.gmv),
      ]),
      h(MiniBar, { value: k.gmvRaw, max, accent: k.color }),
    ]),
  ]);

export const Overview = defineComponent({
  name: 'SavOverview',
  setup() {
    const range = ref('14d');
    return () => {
      const { KPIS, SECONDARY, REVENUE_SERIES, CATEGORY_MIX, HOURLY, ORDERS, KITCHENS, ACTIVITY } = savora;
      const topKitchens = [...KITCHENS].sort((a: Any, b: Any) => b.gmvRaw - a.gmvRaw).slice(0, 5);
      const maxGmv = topKitchens.length ? topKitchens[0].gmvRaw : 1;
      const liveOrders = ORDERS.slice(0, 6);

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-kpi-grid' }, KPIS.map((k) => h('div', { key: k.id }, [KpiCard(k)]))),

        h('div', { class: 'sav-grid-2-1' }, [
          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Gross merchandise value, last 14 days' }, {
              default: () => 'Revenue trend',
              right: () => h(Segmented, { options: [{ id: '7d', label: '7d' }, { id: '14d', label: '14d' }, { id: '30d', label: '30d' }], value: range.value, onChange: (v: string) => (range.value = v) }),
            }),
            h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' } }, [
              h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.03em', color: 'var(--sav-ink)' } }, '₦62.4M'),
              h(DeltaChip, { delta: 14.2, dir: 'up' }),
              h('span', { style: { fontSize: '13px', color: 'var(--sav-ink-3)' } }, 'vs previous period'),
            ]),
            h(AreaChart, { data: REVENUE_SERIES, valueKey: 'gmv', labelKey: 'day', format: (v: number) => '₦' + v.toFixed(2) + 'M', height: 236 }),
          ]),
          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Share of orders by category' }, { default: () => 'Category mix' }),
            h('div', { style: { paddingTop: '8px' } }, [h(DonutChart, { data: CATEGORY_MIX })]),
          ]),
        ]),

        h('div', { class: 'sav-stat-strip' }, SECONDARY.map((s) =>
          h(Card, { key: s.id, pad: 16, style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, () => [
            h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, s.label),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
              h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '23px', color: 'var(--sav-ink)', letterSpacing: '-0.02em' } }, s.value),
              h(DeltaChip, { delta: s.delta, dir: s.dir, good: (s as Any).good }),
            ]),
          ]))),

        h('div', { class: 'sav-grid-3' }, [
          h(Card, { style: { display: 'flex', flexDirection: 'column' } }, () => [
            h(SectionTitle, { sub: 'Updating in real time' }, {
              default: () => 'Order feed',
              right: () => h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--sav-success)' } }, [
                h('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--sav-success)', animation: 'sav-pulse 1.6s ease-in-out infinite' } }), 'Live',
              ]),
            }),
            h('div', { style: { display: 'flex', flexDirection: 'column' } }, liveOrders.map((o) => h('div', { key: o.id }, [LiveOrderRow(o)]))),
          ]),

          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Orders per hour, today' }, { default: () => 'Volume by hour' }),
            h(BarChart, { data: HOURLY, height: 200 }),
            h('div', { style: { marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'var(--sav-surface-2)', display: 'flex', alignItems: 'center', gap: '10px' } }, [
              h('div', { style: { width: '30px', height: '30px', borderRadius: '8px', background: 'var(--sav-primary-soft)', color: 'var(--sav-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [h(Icon, { name: 'flame', size: 16 })]),
              h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-2)', lineHeight: 1.4 } }, [h('span', {}, 'Peak at '), h('strong', {}, '7 PM'), ' — 96 orders. Dinner rush running hot.']),
            ]),
          ]),

          h(Card, {}, () => [
            h(SectionTitle, {}, { default: () => 'Activity', right: () => h(Button, { variant: 'ghost', size: 'sm', iconRight: 'chevron' }, () => 'All') }),
            h('div', { style: { display: 'flex', flexDirection: 'column' } }, ACTIVITY.map((a) => h('div', { key: a.id }, [ActivityRow(a)]))),
          ]),
        ]),

        h(Card, {}, () => [
          h(SectionTitle, { sub: 'Ranked by gross merchandise value' }, {
            default: () => 'Top performing kitchens',
            right: () => h(Button, { variant: 'secondary', size: 'sm', icon: 'store' }, () => 'Manage kitchens'),
          }),
          h('div', { class: 'sav-top-kitchens' }, topKitchens.map((k, i) => h('div', { key: k.id }, [TopKitchenRow(k, maxGmv, i + 1)]))),
        ]),
      ]);
    };
  },
});
