// ui.ts — kitchen-specific UI on top of the shared Savora primitives.
// (The full order-lifecycle Pill, toggles, stars, QR, inline edit, etc.)
import { defineComponent, h, ref, watch  } from 'vue';
import type {PropType} from 'vue';
import Icon from '@/savora/Icon';
import { Card, Button } from '@/savora/ui';
import { KITCHEN, PAY_METHOD_LABEL  } from './data';
import type {Order} from './data';

type Style = Record<string, unknown>;

// ── Full order-lifecycle + payment + kitchen status pills ────
const K_STATUS: Record<string, { bg: string; fg: string; dot: string; label: string; pulse?: boolean }> = {
  // order lifecycle
  placed:     { bg: 'var(--sav-surface-2)',    fg: 'var(--sav-ink-2)',        dot: 'var(--sav-ink-3)',   label: 'Placed' },
  confirmed:  { bg: 'rgba(74,99,196,0.13)',    fg: '#3B49B0',                 dot: '#4B59C4',            label: 'Confirmed' },
  preparing:  { bg: 'var(--sav-warn-soft)',    fg: '#9a6f00',                 dot: '#E0A100',            label: 'Preparing' },
  ready:      { bg: 'rgba(138,111,214,0.15)',  fg: '#5E35B1',                 dot: '#8A6FD6',            label: 'Ready' },
  delivering: { bg: 'var(--sav-primary-soft)', fg: 'var(--sav-primary-dark)', dot: 'var(--sav-primary)', label: 'Delivering', pulse: true },
  delivered:  { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)',      dot: '#1F8A5B',            label: 'Delivered' },
  cancelled:  { bg: 'var(--sav-danger-soft)',  fg: 'var(--sav-danger)',       dot: '#D64545',            label: 'Cancelled' },
  // payment
  paid:       { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)',      dot: '#1F8A5B',            label: 'Paid' },
  pending:    { bg: 'var(--sav-warn-soft)',    fg: '#9a6f00',                 dot: '#E0A100',            label: 'Pending' },
  failed:     { bg: 'var(--sav-danger-soft)',  fg: 'var(--sav-danger)',       dot: '#D64545',            label: 'Failed' },
  refunded:   { bg: 'var(--sav-surface-2)',    fg: 'var(--sav-ink-2)',        dot: 'var(--sav-ink-3)',   label: 'Refunded' },
  // kitchen status
  active:     { bg: 'var(--sav-success-soft)', fg: 'var(--sav-success)',      dot: '#1F8A5B',            label: 'Active' },
  suspended:  { bg: 'var(--sav-danger-soft)',  fg: 'var(--sav-danger)',       dot: '#D64545',            label: 'Suspended' },
};

export const Pill = defineComponent({
  name: 'KPill',
  props: { status: { type: String, required: true }, dot: { type: Boolean, default: true }, size: { type: String, default: 'md' } },
  setup(props) {
    return () => {
      const s = K_STATUS[props.status] || { bg: 'var(--sav-surface-2)', fg: 'var(--sav-ink-2)', dot: 'var(--sav-ink-3)', label: props.status };
      const sm = props.size === 'sm';

      return h('span', {
        style: {
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: sm ? '3px 9px 3px 7px' : '4px 10px 4px 8px', borderRadius: '999px',
          background: s.bg, color: s.fg, fontSize: sm ? '11.5px' : '12px', fontWeight: 600, whiteSpace: 'nowrap',
        },
      }, [
        props.dot ? h('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: s.dot, animation: s.pulse ? 'sav-pulse 1.4s ease-in-out infinite' : 'none' } }) : null,
        s.label,
      ]);
    };
  },
});

export const PaymentCell = defineComponent({
  name: 'KPaymentCell',
  props: { order: { type: Object as PropType<Order>, required: true } },
  setup(props) {
    return () => h('div', { style: { display: 'inline-flex', flexDirection: 'column', gap: '3px' } }, [
      h(Pill, { status: props.order.payStatus, size: 'sm' }),
      h('span', { style: { fontSize: '11px', color: 'var(--sav-ink-3)', whiteSpace: 'nowrap', paddingLeft: '2px' } }, PAY_METHOD_LABEL[props.order.payMethod] || props.order.payMethod),
    ]);
  },
});

// ── Rating stars ─────────────────────────────────────────────
export const Stars = defineComponent({
  name: 'KStars',
  props: { value: { type: Number, required: true }, size: { type: Number, default: 15 }, gap: { type: Number, default: 2 } },
  setup(props) {
    return () => h('span', { style: { display: 'inline-flex', gap: `${props.gap}px` } },
      [1, 2, 3, 4, 5].map((i) => {
        const fill = props.value >= i - 0.5 ? 'var(--sav-warn)' : 'var(--sav-border-strong)';
        const faded = props.value < i - 0.5;

        return h(Icon, { key: i, name: 'star', size: props.size, color: fill, style: { opacity: faded ? 0.5 : 1 } });
      }));
  },
});

// ── Toggle switch ────────────────────────────────────────────
export const Toggle = defineComponent({
  name: 'KToggle',
  props: { on: Boolean, size: { type: String, default: 'md' }, onClick: Function as PropType<(e: MouseEvent) => void> },
  setup(props) {
    return () => {
      const w = props.size === 'sm' ? 38 : 44, hgt = props.size === 'sm' ? 22 : 26, k = hgt - 6;

      return h('button', {
        onClick: props.onClick,
        style: { width: `${w}px`, height: `${hgt}px`, borderRadius: '999px', flexShrink: 0,
          background: props.on ? 'var(--sav-primary)' : 'var(--sav-border-strong)', position: 'relative', transition: 'background 160ms ease' },
      }, [
        h('span', { style: { position: 'absolute', top: '3px', left: props.on ? `${w - k - 3}px` : '3px', width: `${k}px`, height: `${k}px`, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 160ms ease' } }),
      ]);
    };
  },
});

// ── Brand mark for the kitchen (square logo tile) ────────────
export const KitchenMark = defineComponent({
  name: 'KKitchenMark',
  props: { size: { type: Number, default: 36 }, radius: { type: Number, default: 11 } },
  setup(props) {
    return () => h('div', {
      style: { width: `${props.size}px`, height: `${props.size}px`, borderRadius: `${props.radius}px`, background: KITCHEN.brandColor, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800,
        fontSize: `${props.size * 0.46}px`, fontFamily: 'var(--sav-display)', boxShadow: 'var(--sav-shadow-sm)', position: 'relative', overflow: 'hidden' },
    }, [
      h('span', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.25), transparent 60%)' } }),
      h('span', { style: { position: 'relative' } }, KITCHEN.initial),
    ]);
  },
});

// ── Faux QR code (deterministic module grid — squares only) ──
export const QRCode = defineComponent({
  name: 'KQRCode',
  props: { size: { type: Number, default: 132 }, seed: { type: String, default: 'miras-delight' } },
  setup(props) {
    return () => {
      const size = props.size, n = 25, quiet = 1, cells = n + quiet * 2;
      const cell = size / cells;
      let hh = 0;

 for (let i = 0; i < props.seed.length; i++) {
hh = (hh * 31 + props.seed.charCodeAt(i)) & 0xffffffff;
}

      const rnd = () => {
 hh = (hh * 1103515245 + 12345) & 0x7fffffff;

 return hh / 0x7fffffff; 
};
      const finder = (gx: number, gy: number) => {
        const r: [number, number][] = [];

        for (let y = 0; y < 7; y++) {
for (let x = 0; x < 7; x++) {
          const edge = x === 0 || y === 0 || x === 6 || y === 6;
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;

          if (edge || core) {
r.push([gx + x, gy + y]);
}
        }
}

        return r;
      };
      const isFinderZone = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
      const dark = new Set<string>();
      finder(0, 0).concat(finder(n - 7, 0), finder(0, n - 7)).forEach(([x, y]) => dark.add(x + ',' + y));

      for (let y = 0; y < n; y++) {
for (let x = 0; x < n; x++) {
        if (isFinderZone(x, y)) {
continue;
}

        if (rnd() > 0.55) {
dark.add(x + ',' + y);
}
      }
}

      const rects: unknown[] = [];
      dark.forEach((key) => {
        const [x, y] = key.split(',').map(Number);
        rects.push(h('rect', { key, x: (x + quiet) * cell, y: (y + quiet) * cell, width: cell + 0.4, height: cell + 0.4, rx: cell * 0.18, fill: 'var(--sav-ink)' }));
      });

      return h('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { display: 'block', borderRadius: '8px', background: '#fff' } }, rects);
    };
  },
});

// ── Inline-editable text (click to edit) ─────────────────────
export const InlineEdit = defineComponent({
  name: 'KInlineEdit',
  props: {
    value: { type: [String, Number], default: '' },
    placeholder: String,
    multiline: Boolean,
    style: Object as PropType<Style>,
    onChange: Function as PropType<(v: string) => void>,
  },
  setup(props) {
    const editing = ref(false);
    const v = ref(String(props.value));
    watch(() => props.value, (nv) => {
 v.value = String(nv); 
});
    const commit = () => {
 editing.value = false; props.onChange?.(v.value); 
};

    return () => {
      if (editing.value) {
        const tag = props.multiline ? 'textarea' : 'input';

        return h(tag, {
          value: v.value, placeholder: props.placeholder,
          ...(props.multiline ? { rows: 2 } : {}),
          onVnodeMounted: (vn: { el: HTMLElement | null }) => (vn.el as HTMLInputElement | null)?.focus(),
          onInput: (e: Event) => (v.value = (e.target as HTMLInputElement).value),
          onBlur: commit,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !props.multiline) {
commit();
}

            if (e.key === 'Escape') {
 v.value = String(props.value); editing.value = false; 
}
          },
          style: Object.assign({ border: '1.5px solid var(--sav-primary)', borderRadius: '8px', padding: '4px 8px', outline: 'none', background: 'var(--sav-surface)', width: '100%', resize: 'vertical', boxShadow: '0 0 0 3px var(--sav-primary-soft)', font: 'inherit', color: 'var(--sav-ink)' }, props.style),
        });
      }

      return h('span', {
        title: 'Click to edit',
        onClick: () => (editing.value = true),
        style: Object.assign({ cursor: 'text', borderRadius: '6px', padding: '1px 3px', margin: '0 -3px', transition: 'background 120ms ease' }, props.style),
        onMouseenter: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'var(--sav-primary-tint)'),
        onMouseleave: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'transparent'),
      }, props.value !== '' && props.value != null ? String(props.value) : h('span', { style: { color: 'var(--sav-ink-4)' } }, props.placeholder));
    };
  },
});

// ── Empty state ──────────────────────────────────────────────
export const EmptyState = defineComponent({
  name: 'KEmptyState',
  props: { icon: { type: String, default: 'receipt' }, title: String, desc: String },
  setup(props, { slots }) {
    return () => h(Card, { pad: 0, style: { padding: '56px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' } }, () => [
      h('div', { style: { width: '64px', height: '64px', borderRadius: '18px', background: 'var(--sav-primary-soft)', color: 'var(--sav-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' } }, [h(Icon, { name: props.icon, size: 30 })]),
      h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '19px', color: 'var(--sav-ink)' } }, props.title),
      props.desc ? h('div', { style: { fontSize: '14px', color: 'var(--sav-ink-3)', maxWidth: '380px', lineHeight: 1.5 } }, props.desc) : null,
      slots.action ? h('div', { style: { marginTop: '10px' } }, slots.action()) : null,
    ]);
  },
});

// ── Small back button ────────────────────────────────────────
export const PageBack = defineComponent({
  name: 'KPageBack',
  props: { onClick: Function as PropType<(e: MouseEvent) => void> },
  setup(props, { slots }) {
    return () => h('button', {
      onClick: props.onClick,
      style: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 600, color: 'var(--sav-ink-2)', padding: '6px 12px 6px 8px', borderRadius: '10px', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)', boxShadow: 'var(--sav-shadow-sm)' },
    }, [h(Icon, { name: 'chevron', size: 16, style: { transform: 'rotate(180deg)' } }), slots.default?.()]);
  },
});

// ── Status filter pill (orders feed) ─────────────────────────
export const FilterPill = defineComponent({
  name: 'KFilterPill',
  props: { label: String, count: Number, active: Boolean, dotColor: String, onClick: Function as PropType<(e: MouseEvent) => void> },
  setup(props) {
    return () => h('button', {
      onClick: props.onClick,
      style: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 13px', borderRadius: '999px',
        border: '1px solid', borderColor: props.active ? 'transparent' : 'var(--sav-border)',
        background: props.active ? 'var(--sav-ink)' : 'var(--sav-surface)',
        color: props.active ? '#fff' : 'var(--sav-ink-2)', fontSize: '13px', fontWeight: 600,
        boxShadow: props.active ? 'none' : 'var(--sav-shadow-sm)', transition: 'all 120ms ease', whiteSpace: 'nowrap' },
    }, [
      props.dotColor ? h('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: props.dotColor } }) : null,
      props.label,
      h('span', { style: { fontSize: '11.5px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', background: props.active ? 'rgba(255,255,255,0.18)' : 'var(--sav-surface-2)', color: props.active ? '#fff' : 'var(--sav-ink-3)' } }, props.count),
    ]);
  },
});

// ── Confirm dialog (destructive) ─────────────────────────────
export const Confirm = defineComponent({
  name: 'KConfirm',
  props: { title: String, desc: String, onConfirm: Function as PropType<() => void>, onCancel: Function as PropType<() => void> },
  setup(props) {
    return () => h('div', {
      onClick: props.onCancel,
      style: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(31,20,16,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'sav-fade-up 160ms ease both' },
    }, [
      h('div', { onClick: (e: MouseEvent) => e.stopPropagation(), style: { width: '380px', maxWidth: '100%', background: 'var(--sav-surface)', borderRadius: 'var(--sav-radius-lg)', boxShadow: 'var(--sav-shadow-lg)', padding: '22px' } }, [
        h('div', { style: { width: '44px', height: '44px', borderRadius: '12px', background: 'var(--sav-danger-soft)', color: 'var(--sav-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' } }, [h(Icon, { name: 'alert', size: 22 })]),
        h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '18px', color: 'var(--sav-ink)' } }, props.title),
        h('div', { style: { fontSize: '13.5px', color: 'var(--sav-ink-3)', marginTop: '6px', lineHeight: 1.5 } }, props.desc),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' } }, [
          h(Button, { variant: 'secondary', onClick: props.onCancel }, () => 'Cancel'),
          h(Button, { style: { background: 'var(--sav-danger)', boxShadow: 'none' }, onClick: props.onConfirm }, () => 'Delete'),
        ]),
      ]),
    ]);
  },
});

export { Icon };
