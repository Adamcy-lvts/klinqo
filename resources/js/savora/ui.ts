// ui.ts — Savora admin UI primitives (ported from admin-ui.jsx)
import { defineComponent, h, ref, type PropType } from 'vue';
import Icon from './Icon';

type Style = Record<string, unknown>;
const S = (...parts: (Style | undefined)[]): Style => Object.assign({}, ...parts);

// ── Button ───────────────────────────────────────────────────
export const Button = defineComponent({
  name: 'SavButton',
  props: {
    variant: { type: String, default: 'primary' },
    size: { type: String, default: 'md' },
    icon: String,
    iconRight: String,
    style: Object as PropType<Style>,
    onClick: Function as PropType<(e: MouseEvent) => void>,
  },
  setup(props, { slots }) {
    const variants: Record<string, Style> = {
      primary:   { background: 'var(--sav-primary)', color: '#fff', border: '1px solid transparent', boxShadow: '0 4px 12px rgba(255,107,53,0.28)' },
      secondary: { background: 'var(--sav-surface)', color: 'var(--sav-ink)', border: '1px solid var(--sav-border-strong)', boxShadow: 'var(--sav-shadow-sm)' },
      ghost:     { background: 'transparent', color: 'var(--sav-ink-2)', border: '1px solid transparent' },
      soft:      { background: 'var(--sav-primary-soft)', color: 'var(--sav-primary-dark)', border: '1px solid transparent' },
    };
    return () => {
      const pad = props.size === 'sm' ? '7px 12px' : props.size === 'lg' ? '12px 22px' : '9px 16px';
      const fs = props.size === 'sm' ? 13 : 14;
      const isz = props.size === 'sm' ? 15 : 17;
      return h('button', {
        onClick: props.onClick,
        style: S({
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          padding: pad, borderRadius: '12px', fontWeight: 600, fontSize: `${fs}px`, lineHeight: 1.2,
          fontFamily: 'var(--sav-text)', letterSpacing: '-0.01em',
          transition: 'transform 120ms ease, filter 120ms ease', whiteSpace: 'nowrap',
        }, variants[props.variant], props.style),
        onMousedown: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'),
        onMouseup: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)'),
        onMouseleave: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)'),
      }, [
        props.icon ? h(Icon, { name: props.icon, size: isz }) : null,
        slots.default?.(),
        props.iconRight ? h(Icon, { name: props.iconRight, size: isz }) : null,
      ]);
    };
  },
});

export const IconButton = defineComponent({
  name: 'SavIconButton',
  props: {
    name: { type: String, required: true },
    active: Boolean,
    badge: Number,
    size: { type: Number, default: 38 },
    style: Object as PropType<Style>,
    onClick: Function as PropType<(e: MouseEvent) => void>,
  },
  setup(props) {
    return () => h('button', {
      onClick: props.onClick,
      style: S({
        position: 'relative', width: `${props.size}px`, height: `${props.size}px`, borderRadius: '11px',
        background: props.active ? 'var(--sav-primary-soft)' : 'var(--sav-surface)',
        border: '1px solid var(--sav-border)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: props.active ? 'var(--sav-primary-dark)' : 'var(--sav-ink-2)',
        boxShadow: 'var(--sav-shadow-sm)', flexShrink: 0,
      }, props.style),
    }, [
      h(Icon, { name: props.name, size: 19 }),
      props.badge && props.badge > 0 ? h('span', {
        style: { position: 'absolute', top: '-4px', right: '-4px', minWidth: '17px', height: '17px', padding: '0 4px',
          borderRadius: '9px', background: 'var(--sav-primary)', color: '#fff', fontSize: '10px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--sav-surface)' },
      }, props.badge) : null,
    ]);
  },
});

// ── Card ─────────────────────────────────────────────────────
export const Card = defineComponent({
  name: 'SavCard',
  props: {
    pad: { type: Number, default: 20 },
    hover: Boolean,
    style: Object as PropType<Style>,
    onClick: Function as PropType<(e: MouseEvent) => void>,
  },
  setup(props, { slots }) {
    const hovered = ref(false);
    return () => h('div', {
      onClick: props.onClick,
      onMouseenter: () => { if (props.hover) hovered.value = true; },
      onMouseleave: () => { if (props.hover) hovered.value = false; },
      style: S({
        background: 'var(--sav-surface)', border: '1px solid var(--sav-border)',
        borderRadius: 'var(--sav-radius)', padding: `${props.pad}px`,
        boxShadow: hovered.value ? 'var(--sav-shadow)' : 'var(--sav-shadow-sm)',
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        transform: hovered.value ? 'translateY(-2px)' : 'none',
        cursor: props.onClick ? 'pointer' : 'default',
      }, props.style),
    }, slots.default?.());
  },
});

// ── Status pill ──────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  active:     { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)', dot: '#1F8A5B', label: 'Active' },
  paused:     { bg: 'var(--sav-warn-soft)',    fg: '#9a6f00',            dot: '#E0A100', label: 'Paused' },
  pending:    { bg: 'rgba(138,111,214,0.14)',  fg: '#5E35B1',            dot: '#8A6FD6', label: 'Pending' },
  preparing:  { bg: 'var(--sav-warn-soft)',    fg: '#9a6f00',            dot: '#E0A100', label: 'Preparing' },
  ready:      { bg: 'rgba(138,111,214,0.14)',  fg: '#5E35B1',            dot: '#8A6FD6', label: 'Ready' },
  enroute:    { bg: 'var(--sav-primary-soft)', fg: 'var(--sav-primary-dark)', dot: '#FF6B35', label: 'En route' },
  delivered:  { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)', dot: '#1F8A5B', label: 'Delivered' },
  cancelled:  { bg: 'var(--sav-danger-soft)',  fg: 'var(--sav-danger)',  dot: '#D64545', label: 'Cancelled' },
  paid:       { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)', dot: '#1F8A5B', label: 'Paid' },
  processing: { bg: 'var(--sav-primary-soft)', fg: 'var(--sav-primary-dark)', dot: '#FF6B35', label: 'Processing' },
  'on hold':  { bg: 'var(--sav-danger-soft)',  fg: 'var(--sav-danger)',  dot: '#D64545', label: 'On hold' },
};

export const StatusPill = defineComponent({
  name: 'SavStatusPill',
  props: { status: { type: String, required: true }, dot: { type: Boolean, default: true } },
  setup(props) {
    return () => {
      const s = STATUS_STYLES[props.status] || { bg: 'var(--sav-surface-2)', fg: 'var(--sav-ink-2)', dot: 'var(--sav-ink-3)', label: props.status };
      return h('span', {
        style: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px 4px 8px', borderRadius: '999px',
          background: s.bg, color: s.fg, fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' },
      }, [
        props.dot ? h('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: s.dot } }) : null,
        s.label,
      ]);
    };
  },
});

export const TierBadge = defineComponent({
  name: 'SavTierBadge',
  props: { tier: { type: String, required: true } },
  setup(props) {
    const map: Record<string, Style> = {
      VIP:     { bg: 'var(--sav-primary-soft)', fg: 'var(--sav-primary-dark)' },
      Regular: { bg: 'var(--sav-surface-2)',    fg: 'var(--sav-ink-2)' },
      New:     { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)' },
    };
    return () => {
      const s = (map[props.tier] || map.Regular) as { bg: string; fg: string };
      return h('span', { style: { padding: '3px 9px', borderRadius: '999px', background: s.bg, color: s.fg, fontSize: '11.5px', fontWeight: 700 } }, props.tier);
    };
  },
});

// ── Delta chip ───────────────────────────────────────────────
export const DeltaChip = defineComponent({
  name: 'SavDeltaChip',
  props: { delta: [Number, String], dir: String, good: String, suffix: { type: String, default: '%' } },
  setup(props) {
    return () => {
      const positive = props.good ? props.dir === props.good : props.dir === 'up';
      const fg = positive ? 'var(--sav-success)' : 'var(--sav-danger)';
      const bg = positive ? 'var(--sav-success-soft)' : 'var(--sav-danger-soft)';
      return h('span', {
        style: { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px 3px 6px', borderRadius: '999px', background: bg, color: fg, fontSize: '12px', fontWeight: 700 },
      }, [
        h(Icon, { name: props.dir === 'up' ? 'trend-up' : 'trend-dn', size: 13, stroke: 2.2 }),
        `${props.delta}${props.suffix}`,
      ]);
    };
  },
});

// ── Avatar ───────────────────────────────────────────────────
export const Avatar = defineComponent({
  name: 'SavAvatar',
  props: { src: String, name: String, size: { type: Number, default: 36 }, ring: Boolean },
  setup(props) {
    return () => h('div', {
      style: { width: `${props.size}px`, height: `${props.size}px`, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        background: 'var(--sav-surface-2)', boxShadow: props.ring ? '0 0 0 2px var(--sav-surface), 0 0 0 3.5px var(--sav-primary)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center' },
    }, props.src
      ? h('img', { src: props.src, alt: props.name, width: props.size, height: props.size, style: { objectFit: 'cover', width: '100%', height: '100%' } })
      : h('span', { style: { fontWeight: 700, fontSize: `${props.size * 0.4}px`, color: 'var(--sav-ink-2)' } }, (props.name || '?')[0]));
  },
});

export const KitchenAvatar = defineComponent({
  name: 'SavKitchenAvatar',
  props: { initial: String, color: String, size: { type: Number, default: 36 } },
  setup(props) {
    return () => h('div', {
      style: { width: `${props.size}px`, height: `${props.size}px`, borderRadius: '11px', background: props.color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800,
        fontSize: `${props.size * 0.42}px`, fontFamily: 'var(--sav-display)', boxShadow: 'var(--sav-shadow-sm)' },
    }, props.initial);
  },
});

// ── Search input ─────────────────────────────────────────────
export const SearchInput = defineComponent({
  name: 'SavSearchInput',
  props: {
    value: String,
    placeholder: { type: String, default: 'Search…' },
    width: { type: [Number, String], default: 280 },
    onChange: Function as PropType<(v: string) => void>,
  },
  setup(props) {
    const focused = ref(false);
    return () => h('div', {
      style: { display: 'flex', alignItems: 'center', gap: '9px', width: typeof props.width === 'number' ? `${props.width}px` : props.width, maxWidth: '100%',
        background: 'var(--sav-surface)', border: `1.5px solid ${focused.value ? 'var(--sav-primary)' : 'var(--sav-border)'}`,
        borderRadius: '12px', padding: '0 12px', height: '40px',
        boxShadow: focused.value ? '0 0 0 4px var(--sav-primary-soft)' : 'var(--sav-shadow-sm)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease' },
    }, [
      h(Icon, { name: 'search', size: 17, color: 'var(--sav-ink-3)' }),
      h('input', {
        value: props.value, placeholder: props.placeholder,
        onInput: (e: Event) => props.onChange?.((e.target as HTMLInputElement).value),
        onFocus: () => (focused.value = true), onBlur: () => (focused.value = false),
        style: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--sav-ink)', minWidth: 0 },
      }),
    ]);
  },
});

// ── Segmented control / tabs ─────────────────────────────────
export const Segmented = defineComponent({
  name: 'SavSegmented',
  props: {
    options: { type: Array as PropType<Array<{ id?: string; label?: string } | string>>, required: true },
    value: String,
    onChange: Function as PropType<(v: string) => void>,
  },
  setup(props) {
    return () => h('div', { style: { display: 'inline-flex', background: 'var(--sav-surface-2)', borderRadius: '11px', padding: '3px', gap: '2px' } },
      props.options.map((o) => {
        const id = (typeof o === 'object' ? o.id : o) as string;
        const label = (typeof o === 'object' ? o.label : o) as string;
        const active = id === props.value;
        return h('button', {
          key: id, onClick: () => props.onChange?.(id),
          style: { padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            color: active ? 'var(--sav-ink)' : 'var(--sav-ink-3)',
            background: active ? 'var(--sav-surface)' : 'transparent',
            boxShadow: active ? 'var(--sav-shadow-sm)' : 'none',
            transition: 'all 120ms ease', whiteSpace: 'nowrap' },
        }, label);
      }));
  },
});

// ── Section heading ──────────────────────────────────────────
export const SectionTitle = defineComponent({
  name: 'SavSectionTitle',
  props: { sub: String },
  setup(props, { slots }) {
    return () => h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' } }, [
      h('div', {}, [
        h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em', color: 'var(--sav-ink)' } }, slots.default?.()),
        props.sub ? h('div', { style: { fontSize: '13px', color: 'var(--sav-ink-3)', marginTop: '2px' } }, props.sub) : null,
      ]),
      slots.right?.(),
    ]);
  },
});
