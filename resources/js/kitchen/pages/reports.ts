// reports.ts — Screen 8: reports
import { defineComponent, h } from 'vue';
import { AreaChart, MiniBar } from '@/savora/charts';
import Icon from '@/savora/Icon';
import { TR, TD } from '@/savora/table';
import { Card, Button, Segmented, SectionTitle, DeltaChip } from '@/savora/ui';
import { REVENUE_SERIES, TOP_ITEMS, naira } from '../data';
import { EmptyState } from '../ui';

export const Reports = defineComponent({
  name: 'KitchenReports',
  props: { empty: Boolean },
  setup(props) {
    const range = { from: 'Jun 03', to: 'Jun 16' };

    return () => {
      if (props.empty) {
return h(EmptyState, { icon: 'chart', title: 'No data yet', desc: 'Once you start taking orders, your revenue trends, best-selling items and order stats will appear here.' });
}

      const totalOrders = REVENUE_SERIES.reduce((s, d) => s + d.orders, 0);
      const totalRevenue = REVENUE_SERIES.reduce((s, d) => s + d.revenue, 0) * 1000;
      const aov = Math.round(totalRevenue / totalOrders);
      const maxRev = Math.max(...TOP_ITEMS.map((t) => t.revRaw));
      const summary = [
        { label: 'Orders', value: totalOrders.toLocaleString(), delta: 11, dir: 'up' as const, hint: 'last 14 days' },
        { label: 'Revenue', value: naira(totalRevenue), delta: 8, dir: 'up' as const, hint: 'paid orders only' },
        { label: 'Average order value', value: naira(aov), delta: 2, dir: 'down' as const, hint: 'per order' },
      ];
      const topCols = [{ l: '#', w: 50 }, { l: 'Item' }, { l: 'Qty sold', a: 'right', w: 110 }, { l: 'Share', w: 160 }, { l: 'Revenue', a: 'right', w: 130 }];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, [
          h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 0, background: 'var(--sav-surface)', border: '1px solid var(--sav-border)', borderRadius: '12px', boxShadow: 'var(--sav-shadow-sm)', overflow: 'hidden' } }, [
            h('span', { style: { padding: '9px 12px', fontSize: '12px', color: 'var(--sav-ink-3)', fontWeight: 600, borderRight: '1px solid var(--sav-border)' } }, [h(Icon, { name: 'calendar', size: 14, style: { verticalAlign: '-2px', marginRight: '6px' }, color: 'var(--sav-ink-3)' }), 'From']),
            h('span', { style: { padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--sav-ink)' } }, range.from),
            h('span', { style: { padding: '9px 6px', color: 'var(--sav-ink-4)' } }, [h(Icon, { name: 'chevron', size: 14 })]),
            h('span', { style: { padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--sav-ink)', borderLeft: '1px solid var(--sav-border)' } }, range.to),
          ]),
          h('div', { class: 'sav-hide-sm' }, [h(Segmented, { options: [{ id: 'l7', label: 'Last 7 days' }, { id: 'l14', label: 'Last 14 days' }, { id: 'l30', label: 'Last 30 days' }], value: 'l14', onChange: () => {} })]),
          h('div', { style: { flex: 1 } }),
          h(Button, { icon: 'download' }, () => 'Export CSV'),
        ]),

        h('div', { class: 'sav-stat-strip', style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, summary.map((s, i) => h(Card, { key: i, pad: 18, style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, () => [
          h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, s.label),
          h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '10px' } }, [
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '28px', color: 'var(--sav-ink)', letterSpacing: '-0.03em', lineHeight: 1 } }, s.value),
            h(DeltaChip, { delta: s.delta, dir: s.dir }),
          ]),
          h('span', { style: { fontSize: '11.5px', color: 'var(--sav-ink-4)' } }, s.hint),
        ]))),

        h(Card, {}, () => [
          h(SectionTitle, { sub: 'Revenue (₦, paid) and order count per day' }, { default: () => 'Revenue by day' }),
          h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' } }, [
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '30px', letterSpacing: '-0.03em', color: 'var(--sav-ink)' } }, naira(totalRevenue)),
            h(DeltaChip, { delta: 8.4, dir: 'up' }),
            h('span', { style: { fontSize: '13px', color: 'var(--sav-ink-3)' } }, 'vs previous 14 days'),
          ]),
          h(AreaChart, { data: REVENUE_SERIES, valueKey: 'revenue', labelKey: 'day', format: (v: number) => naira(v * 1000), height: 250 }),
        ]),

        h(Card, { pad: 0, style: { overflow: 'hidden' } }, () => [
          h('div', { style: { padding: '16px 20px', borderBottom: '1px solid var(--sav-border)', display: 'flex', alignItems: 'baseline', gap: '8px' } }, [
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '15px', color: 'var(--sav-ink)' } }, 'Top items'),
            h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, 'best sellers this period'),
          ]),
          h('table', { style: { width: '100%', borderCollapse: 'collapse', minWidth: '560px' } }, [
            h('thead', {}, [h('tr', { style: { background: 'var(--sav-surface-2)' } }, topCols.map((c, i) => h('th', { key: i, style: { textAlign: c.a || 'left', padding: '10px 18px', fontSize: '11.5px', fontWeight: 700, color: 'var(--sav-ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase', width: c.w ? `${c.w}px` : undefined, borderBottom: '1px solid var(--sav-border)' } }, c.l)))]),
            h('tbody', {}, TOP_ITEMS.map((t, i) => h(TR, { key: t.name }, () => [
              h(TD, {}, () => h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, color: i < 3 ? 'var(--sav-primary-dark)' : 'var(--sav-ink-4)' } }, i + 1)),
              h(TD, {}, () => h('span', { style: { fontWeight: 600 } }, t.name)),
              h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 600, color: 'var(--sav-ink-2)' } }, t.qty)),
              h(TD, {}, () => h('div', { style: { maxWidth: '130px' } }, [h(MiniBar, { value: t.revRaw, max: maxRev })])),
              h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, naira(t.revRaw))),
            ]))),
          ]),
        ]),
      ]);
    };
  },
});
