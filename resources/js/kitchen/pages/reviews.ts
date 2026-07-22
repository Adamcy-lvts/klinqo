// reviews.ts — Screen 7: reviews
import { defineComponent, h, ref } from 'vue';
import { MiniBar } from '@/savora/charts';
import Icon from '@/savora/Icon';
import { Card, Button, Avatar, Segmented, SectionTitle } from '@/savora/ui';
import { REVIEWS  } from '../data';
import type {Review} from '../data';
import { Stars, EmptyState } from '../ui';

export const Reviews = defineComponent({
  name: 'KitchenReviews',
  props: { empty: Boolean },
  setup(props) {
    const reviews = ref<Review[]>(props.empty ? [] : REVIEWS.map((r) => ({ ...r })));
    const tab = ref('all');
    const toggleHide = (id: string) => {
 const r = reviews.value.find((x) => x.id === id);

 if (r) {
r.hidden = !r.hidden;
} 
};

    return () => {
      if (props.empty) {
return h(EmptyState, { icon: 'star', title: 'No reviews yet', desc: "After customers receive their orders they can leave a rating and review. They'll show up here for you to read and respond to." });
}

      const visible = reviews.value.filter((r) => !r.hidden);
      const avg = visible.length ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : 0;
      const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: visible.filter((r) => r.rating === star).length }));
      const maxDist = Math.max(1, ...dist.map((d) => d.count));
      const hiddenCount = reviews.value.filter((r) => r.hidden).length;

      let list = reviews.value;

      if (tab.value === 'visible') {
list = reviews.value.filter((r) => !r.hidden);
}

      if (tab.value === 'hidden') {
list = reviews.value.filter((r) => r.hidden);
}

      const summaryRows = [
        { label: 'Total reviews', value: reviews.value.length, icon: 'receipt' },
        { label: 'Hidden from public', value: hiddenCount, icon: 'eye' },
        { label: '5-star share', value: visible.length ? Math.round(visible.filter((r) => r.rating === 5).length / visible.length * 100) + '%' : '—', icon: 'star' },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h('div', { class: 'sav-grid-2-1', style: { alignItems: 'stretch' } }, [
          h(Card, { style: { display: 'flex', flexDirection: 'column', gap: '14px' } }, () => [
            h(SectionTitle, { sub: 'Public rating, hidden reviews excluded' }, { default: () => 'Rating summary' }),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' } }, [
              h('div', { style: { textAlign: 'center' } }, [
                h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '52px', color: 'var(--sav-ink)', lineHeight: 1, letterSpacing: '-0.03em' } }, avg.toFixed(1)),
                h('div', { style: { marginTop: '8px' } }, [h(Stars, { value: avg, size: 17 })]),
                h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '6px' } }, `${visible.length} reviews`),
              ]),
              h('div', { style: { flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '7px' } }, dist.map((d) => h('div', { key: d.star, style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
                h('span', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', width: '10px', fontWeight: 600 } }, d.star),
                h(Icon, { name: 'star', size: 12, color: 'var(--sav-warn)' }),
                h('div', { style: { flex: 1 } }, [h(MiniBar, { value: d.count, max: maxDist, accent: 'var(--sav-warn)' })]),
                h('span', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', width: '18px', textAlign: 'right' } }, d.count),
              ]))),
            ]),
          ]),
          h(Card, { style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' } }, () => summaryRows.map((s, i) => h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--sav-border)' : 'none' } }, [
            h('div', { style: { width: '36px', height: '36px', borderRadius: '10px', background: 'var(--sav-surface-2)', color: 'var(--sav-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [h(Icon, { name: s.icon, size: 17 })]),
            h('span', { style: { flex: 1, fontSize: '13.5px', color: 'var(--sav-ink-2)', fontWeight: 500 } }, s.label),
            h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '19px', color: 'var(--sav-ink)' } }, s.value),
          ]))),
        ]),

        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, [
          h(Segmented, { options: [{ id: 'all', label: `All (${reviews.value.length})` }, { id: 'visible', label: 'Public' }, { id: 'hidden', label: `Hidden (${hiddenCount})` }], value: tab.value, onChange: (v: string) => (tab.value = v) }),
        ]),

        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
          ...list.map((r) => h(Card, { key: r.id, style: { display: 'flex', gap: '14px', opacity: r.hidden ? 0.72 : 1, background: r.hidden ? 'var(--sav-surface-2)' : 'var(--sav-surface)' } }, () => [
            h(Avatar, { name: r.customer, size: 42 }),
            h('div', { style: { flex: 1, minWidth: 0 } }, [
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [
                h('span', { style: { fontSize: '14px', fontWeight: 700, color: 'var(--sav-ink)' } }, r.customer),
                h(Stars, { value: r.rating, size: 13 }),
                h('span', { style: { fontSize: '12px', color: 'var(--sav-ink-4)' } }, `· ${r.date}`),
                r.hidden ? h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: 'var(--sav-ink-3)', background: 'var(--sav-border)', padding: '2px 8px', borderRadius: '999px' } }, [h(Icon, { name: 'eye', size: 11 }), 'Hidden']) : null,
              ]),
              h('div', { style: { fontSize: '13.5px', color: 'var(--sav-ink-2)', marginTop: '7px', lineHeight: 1.5 } }, r.text),
              h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' } }, [h(Icon, { name: 'receipt', size: 13, color: 'var(--sav-ink-4)' }), `Order #${r.order}`]),
            ]),
            h('div', { style: { flexShrink: 0 } }, [h(Button, { variant: r.hidden ? 'soft' : 'secondary', size: 'sm', icon: 'eye', onClick: () => toggleHide(r.id) }, () => (r.hidden ? 'Unhide' : 'Hide'))]),
          ])),
          list.length === 0 ? h(EmptyState, { icon: 'star', title: 'Nothing here', desc: 'No reviews match this filter.' }) : null,
        ]),
      ]);
    };
  },
});
