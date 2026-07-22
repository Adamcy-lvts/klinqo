// charts.ts — hand-drawn SVG charts (ported from admin-charts.jsx)
import { defineComponent, h, ref, type PropType } from 'vue';

let uid = 0;
const nextId = () => `sav${(uid++).toString(36)}`;

type Style = Record<string, unknown>;

// ── Area + line chart (GMV) ──────────────────────────────────
export const AreaChart = defineComponent({
  name: 'SavAreaChart',
  props: {
    data: { type: Array as PropType<Array<Record<string, number | string>>>, required: true },
    height: { type: Number, default: 240 },
    valueKey: { type: String, default: 'gmv' },
    labelKey: { type: String, default: 'day' },
    format: { type: Function as PropType<(v: number) => string>, default: (v: number) => String(v) },
    accent: { type: String, default: 'var(--sav-primary)' },
  },
  setup(props) {
    const hover = ref<number | null>(null);
    const gid = nextId();
    return () => {
      const data = props.data;
      const w = 760, hgt = props.height, padX = 8, padTop = 18, padBot = 28;
      const vals = data.map((d) => Number(d[props.valueKey]));
      const max = Math.max(...vals) * 1.12, min = Math.min(...vals) * 0.82;
      const span = (max - min) || 1;
      const x = (i: number) => padX + (i * (w - padX * 2)) / Math.max(1, data.length - 1);
      const y = (v: number) => padTop + (1 - (v - min) / span) * (hgt - padTop - padBot);
      const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(Number(d[props.valueKey])).toFixed(1)}`).join(' ');
      const area = `${line} L ${x(data.length - 1).toFixed(1)} ${hgt - padBot} L ${x(0).toFixed(1)} ${hgt - padBot} Z`;

      return h('div', { style: { position: 'relative', width: '100%' } }, [
        h('svg', { viewBox: `0 0 ${w} ${hgt}`, width: '100%', height: hgt, preserveAspectRatio: 'none',
          onMouseleave: () => (hover.value = null), style: { display: 'block', overflow: 'visible' } }, [
          h('defs', {}, [
            h('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' }, [
              h('stop', { offset: '0%', 'stop-color': props.accent, 'stop-opacity': '0.22' }),
              h('stop', { offset: '100%', 'stop-color': props.accent, 'stop-opacity': '0' }),
            ]),
          ]),
          ...[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const gy = padTop + t * (hgt - padTop - padBot);
            return h('line', { key: i, x1: padX, y1: gy, x2: w - padX, y2: gy, stroke: 'var(--sav-border)', 'stroke-width': '1', 'stroke-dasharray': '2 5' });
          }),
          h('path', { d: area, fill: `url(#${gid})` }),
          h('path', { d: line, fill: 'none', stroke: props.accent, 'stroke-width': '2.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
          ...data.map((d, i) => h('g', { key: i }, [
            h('rect', { x: x(i) - (w / data.length) / 2, y: '0', width: w / data.length, height: hgt, fill: 'transparent',
              onMouseenter: () => (hover.value = i), style: { cursor: 'pointer' } }),
            h('circle', { cx: x(i), cy: y(Number(d[props.valueKey])), r: hover.value === i ? 5 : 0, fill: 'var(--sav-surface)', stroke: props.accent, 'stroke-width': '2.5' }),
          ])),
          hover.value != null ? h('line', { x1: x(hover.value), y1: padTop, x2: x(hover.value), y2: hgt - padBot, stroke: props.accent, 'stroke-width': '1', 'stroke-dasharray': '3 3', opacity: '0.5' }) : null,
        ]),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '4px', padding: '0 2px' } },
          data.map((d, i) => h('span', { key: i, style: { fontSize: '10.5px', color: 'var(--sav-ink-3)', fontWeight: 500, opacity: i % 2 === 0 ? 1 : 0.45 } }, String(d[props.labelKey]).replace('Jun ', '')))),
        hover.value != null ? h('div', {
          style: { position: 'absolute', top: '4px', left: `${(hover.value / (data.length - 1)) * 100}%`,
            transform: `translateX(${hover.value < data.length / 2 ? '8px' : 'calc(-100% - 8px)'})`,
            background: 'var(--sav-ink)', color: '#fff', padding: '8px 12px', borderRadius: '10px',
            fontSize: '12px', pointerEvents: 'none', boxShadow: 'var(--sav-shadow)', whiteSpace: 'nowrap', zIndex: 3 },
        }, [
          h('div', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, props.format(Number(data[hover.value][props.valueKey]))),
          h('div', { style: { opacity: 0.7, marginTop: '1px' } }, `${data[hover.value][props.labelKey]} · ${data[hover.value].orders} orders`),
        ]) : null,
      ]);
    };
  },
});

// ── Bar chart (hourly) ───────────────────────────────────────
export const BarChart = defineComponent({
  name: 'SavBarChart',
  props: {
    data: { type: Array as PropType<Array<{ h: string; v: number }>>, required: true },
    height: { type: Number, default: 150 },
    accent: { type: String, default: 'var(--sav-primary)' },
  },
  setup(props) {
    const hover = ref<number | null>(null);
    return () => {
      const max = Math.max(...props.data.map((d) => d.v));
      return h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${props.height}px`, paddingTop: '8px' } },
        props.data.map((d, i) => {
          const hot = d.v >= max * 0.8;
          return h('div', {
            key: i, onMouseenter: () => (hover.value = i), onMouseleave: () => (hover.value = null),
            style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', position: 'relative' },
          }, [
            hover.value === i ? h('div', { style: { position: 'absolute', bottom: '100%', marginBottom: '4px', background: 'var(--sav-ink)', color: '#fff', padding: '3px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', zIndex: 2 } }, `${d.v} orders`) : null,
            h('div', { style: { width: '100%', height: `${(d.v / max) * (props.height - 26)}px`, minHeight: '4px',
              borderRadius: '6px', transition: 'opacity 120ms ease, transform 120ms ease',
              background: hot ? props.accent : 'var(--sav-primary-soft)',
              opacity: hover.value == null || hover.value === i ? 1 : 0.5,
              transform: hover.value === i ? 'scaleY(1.03)' : 'none', transformOrigin: 'bottom' } }),
            h('span', { style: { fontSize: '10px', color: 'var(--sav-ink-3)', fontWeight: 500 } }, d.h),
          ]);
        }));
    };
  },
});

// ── Donut chart (category mix) ───────────────────────────────
export const DonutChart = defineComponent({
  name: 'SavDonutChart',
  props: {
    data: { type: Array as PropType<Array<{ label: string; value: number; color: string }>>, required: true },
    size: { type: Number, default: 168 },
    thickness: { type: Number, default: 22 },
  },
  setup(props) {
    const hover = ref<number | null>(null);
    return () => {
      const data = props.data;
      const total = data.reduce((s, d) => s + d.value, 0) || 1;
      const r = (props.size - props.thickness) / 2, c = props.size / 2, circ = 2 * Math.PI * r;
      let offset = 0;
      const segs = data.map((d) => { const len = (d.value / total) * circ; const seg = { ...d, dash: len, gap: circ - len, off: offset }; offset -= len; return seg; });
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' } }, [
        h('div', { style: { position: 'relative', width: `${props.size}px`, height: `${props.size}px`, flexShrink: 0 } }, [
          h('svg', { width: props.size, height: props.size, style: { transform: 'rotate(-90deg)' } }, [
            h('circle', { cx: c, cy: c, r, fill: 'none', stroke: 'var(--sav-surface-2)', 'stroke-width': props.thickness }),
            ...segs.map((s, i) => h('circle', { key: i, cx: c, cy: c, r, fill: 'none', stroke: s.color,
              'stroke-width': hover.value === i ? props.thickness + 4 : props.thickness,
              'stroke-dasharray': `${s.dash} ${s.gap}`, 'stroke-dashoffset': s.off, 'stroke-linecap': 'butt',
              onMouseenter: () => (hover.value = i), onMouseleave: () => (hover.value = null),
              style: { transition: 'stroke-width 120ms ease', cursor: 'pointer', opacity: hover.value == null || hover.value === i ? 1 : 0.55 } })),
          ]),
          h('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }, [
            h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '26px', color: 'var(--sav-ink)', lineHeight: 1 } }, hover.value != null ? `${data[hover.value].value}%` : '1,284'),
            h('div', { style: { fontSize: '11px', color: 'var(--sav-ink-3)', marginTop: '3px', fontWeight: 500 } }, hover.value != null ? data[hover.value].label.split(' ')[0] : 'orders'),
          ]),
        ]),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, minWidth: '130px' } },
          data.map((d, i) => h('div', {
            key: i, onMouseenter: () => (hover.value = i), onMouseleave: () => (hover.value = null),
            style: { display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', opacity: hover.value == null || hover.value === i ? 1 : 0.5, transition: 'opacity 120ms ease' },
          }, [
            h('span', { style: { width: '9px', height: '9px', borderRadius: '3px', background: d.color, flexShrink: 0 } }),
            h('span', { style: { fontSize: '13px', color: 'var(--sav-ink-2)', flex: 1, fontWeight: 500 } }, d.label),
            h('span', { style: { fontSize: '13px', color: 'var(--sav-ink)', fontWeight: 700 } }, `${d.value}%`),
          ]))),
      ]);
    };
  },
});

// ── Sparkline (KPI cards) ────────────────────────────────────
export const Sparkline = defineComponent({
  name: 'SavSparkline',
  props: {
    data: { type: Array as PropType<number[]>, required: true },
    width: { type: Number, default: 96 },
    height: { type: Number, default: 34 },
    accent: { type: String, default: 'var(--sav-primary)' },
    up: { type: Boolean, default: true },
  },
  setup(props) {
    const gid = nextId();
    return () => {
      const data = props.data;
      const max = Math.max(...data), min = Math.min(...data);
      const x = (i: number) => (i * props.width) / (data.length - 1);
      const y = (v: number) => props.height - ((v - min) / (max - min || 1)) * (props.height - 4) - 2;
      const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
      const area = `${line} L ${props.width} ${props.height} L 0 ${props.height} Z`;
      const col = props.up ? props.accent : 'var(--sav-danger)';
      return h('svg', { width: props.width, height: props.height, style: { display: 'block', overflow: 'visible' } }, [
        h('defs', {}, [
          h('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' }, [
            h('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': '0.2' }),
            h('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': '0' }),
          ]),
        ]),
        h('path', { d: area, fill: `url(#${gid})` }),
        h('path', { d: line, fill: 'none', stroke: col, 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      ]);
    };
  },
});

// ── Horizontal progress / mini bar ───────────────────────────
export const MiniBar = defineComponent({
  name: 'SavMiniBar',
  props: {
    value: { type: Number, required: true },
    max: { type: Number, required: true },
    accent: { type: String, default: 'var(--sav-primary)' },
    height: { type: Number, default: 7 },
  },
  setup(props) {
    return () => h('div', { style: { width: '100%', height: `${props.height}px`, borderRadius: '999px', background: 'var(--sav-surface-2)', overflow: 'hidden' } as Style },
      h('div', { style: { width: `${Math.min(100, (props.value / props.max) * 100)}%`, height: '100%', borderRadius: '999px', background: props.accent } }));
  },
});
