// table.ts — shared table shell + filter toolbar (ported from admin-table.jsx)
import { defineComponent, h, ref, type PropType } from 'vue';
import { Card, Segmented, SearchInput } from './ui';
import Icon from './Icon';

type Style = Record<string, unknown>;
type Column = { label: string; align?: string; width?: number };

export const TableShell = defineComponent({
  name: 'SavTableShell',
  props: { columns: { type: Array as PropType<Column[]>, required: true } },
  setup(props, { slots }) {
    return () => h(Card, { pad: 0, style: { overflow: 'hidden' } }, () => [
      slots.toolbar?.(),
      h('div', { style: { overflowX: 'auto' } }, [
        h('table', { style: { width: '100%', borderCollapse: 'collapse', minWidth: '720px' } }, [
          h('thead', {}, [
            h('tr', { style: { background: 'var(--sav-surface-2)' } },
              props.columns.map((c, i) => h('th', { key: i, style: {
                textAlign: c.align || 'left', padding: '11px 18px', fontSize: '11.5px', fontWeight: 700,
                color: 'var(--sav-ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', borderBottom: '1px solid var(--sav-border)',
                width: c.width ? `${c.width}px` : undefined, position: 'sticky', top: 0,
              } }, c.label))),
          ]),
          h('tbody', {}, slots.default?.()),
        ]),
      ]),
      slots.footer?.(),
    ]);
  },
});

export const TR = defineComponent({
  name: 'SavTR',
  props: { onClick: Function as PropType<(e: MouseEvent) => void> },
  setup(props, { slots }) {
    const hovered = ref(false);
    return () => h('tr', {
      onClick: props.onClick,
      onMouseenter: () => (hovered.value = true), onMouseleave: () => (hovered.value = false),
      style: { background: hovered.value ? 'var(--sav-primary-tint)' : 'transparent', cursor: props.onClick ? 'pointer' : 'default', transition: 'background 100ms ease' },
    }, slots.default?.());
  },
});

export const TD = defineComponent({
  name: 'SavTD',
  props: { align: String, style: Object as PropType<Style> },
  setup(props, { slots }) {
    return () => h('td', { style: Object.assign({ padding: '13px 18px', fontSize: '13.5px', color: 'var(--sav-ink)', textAlign: props.align || 'left', borderBottom: '1px solid var(--sav-border)', verticalAlign: 'middle' }, props.style) }, slots.default?.());
  },
});

export const TableToolbar = defineComponent({
  name: 'SavTableToolbar',
  props: {
    count: [Number, String],
    label: String,
    search: String,
    onSearch: Function as PropType<(v: string) => void>,
    filters: Array as PropType<Array<{ id: string; label: string }>>,
    activeFilter: String,
    onFilter: Function as PropType<(v: string) => void>,
  },
  setup(props, { slots }) {
    return () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap', borderBottom: '1px solid var(--sav-border)' } }, [
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px' } }, [
        h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '15px', color: 'var(--sav-ink)' } }, props.label),
        h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600, background: 'var(--sav-surface-2)', padding: '2px 8px', borderRadius: '999px' } }, props.count),
      ]),
      props.filters ? h('div', { class: 'sav-hide-sm' }, [h(Segmented, { options: props.filters, value: props.activeFilter, onChange: props.onFilter })]) : null,
      h('div', { style: { flex: 1 } }),
      h('div', { class: 'sav-hide-sm' }, [h(SearchInput, { value: props.search, onChange: props.onSearch, width: 220, placeholder: 'Search…' })]),
      slots.actions?.(),
    ]);
  },
});

export const Pagination = defineComponent({
  name: 'SavPagination',
  props: { shown: [Number, String], total: [Number, String] },
  setup(props) {
    return () => h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', flexWrap: 'wrap', gap: '10px' } }, [
      h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)' } }, ['Showing ', h('strong', { style: { color: 'var(--sav-ink-2)' } }, props.shown), ` of ${props.total}`]),
      h('div', { style: { display: 'flex', gap: '6px' } }, [
        h('button', { style: { width: '32px', height: '32px', borderRadius: '9px', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)', color: 'var(--sav-ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [h(Icon, { name: 'chevron', size: 16, style: { transform: 'rotate(180deg)' } })]),
        ...[1, 2, 3].map((n) => h('button', { key: n, style: { minWidth: '32px', height: '32px', padding: '0 6px', borderRadius: '9px', border: '1px solid', borderColor: n === 1 ? 'transparent' : 'var(--sav-border)', background: n === 1 ? 'var(--sav-primary)' : 'var(--sav-surface)', color: n === 1 ? '#fff' : 'var(--sav-ink-2)', fontSize: '13px', fontWeight: 600 } }, n)),
        h('button', { style: { width: '32px', height: '32px', borderRadius: '9px', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)', color: 'var(--sav-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [h(Icon, { name: 'chevron', size: 16 })]),
      ]),
    ]);
  },
});
