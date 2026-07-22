// Icon.ts — Savora admin icon set (ported from admin-ui.jsx AdminIcon)
import { defineComponent, h, type PropType } from 'vue';

export default defineComponent({
  name: 'SavoraIcon',
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 20 },
    stroke: { type: Number, default: 1.7 },
    color: { type: String, default: 'currentColor' },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  setup(props) {
    return () => {
      const c = props.color;
      const p: Record<string, unknown> = {
        width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'none',
        stroke: c, 'stroke-width': props.stroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        style: props.style,
      };
      const e = (tag: string, attrs: Record<string, unknown>) => h(tag, attrs);
      let children: unknown[];
      let extra: Record<string, unknown> = {};
      switch (props.name) {
        case 'grid': children = [e('rect',{x:3,y:3,width:7,height:7,rx:1.5}),e('rect',{x:14,y:3,width:7,height:7,rx:1.5}),e('rect',{x:3,y:14,width:7,height:7,rx:1.5}),e('rect',{x:14,y:14,width:7,height:7,rx:1.5})]; break;
        case 'receipt': children = [e('path',{d:'M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3z'}),e('path',{d:'M8 8h8M8 12h8M8 16h5'})]; break;
        case 'store': children = [e('path',{d:'M3 9l1-5h16l1 5M5 9v11h14V9M9 13h6'})]; break;
        case 'users': children = [e('circle',{cx:9,cy:8,r:3.4}),e('path',{d:'M3 20a6 6 0 0 1 12 0'}),e('path',{d:'M16 5.2a3.4 3.4 0 0 1 0 6.6M21 20a6 6 0 0 0-5-5.9'})]; break;
        case 'user': children = [e('circle',{cx:12,cy:8,r:4}),e('path',{d:'M4 21a8 8 0 0 1 16 0'})]; break;
        case 'wallet': children = [e('path',{d:'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H3z'}),e('rect',{x:3,y:7,width:18,height:13,rx:2}),e('circle',{cx:16.5,cy:13.5,r:1.4,fill:c,stroke:'none'})]; break;
        case 'chart': children = [e('path',{d:'M4 19V5M4 19h16'}),e('path',{d:'M8 16l3-4 3 2 4-6'})]; break;
        case 'gear': children = [e('circle',{cx:12,cy:12,r:3.2}),e('path',{d:'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1'})]; break;
        case 'search': children = [e('circle',{cx:11,cy:11,r:7}),e('path',{d:'M21 21l-4.3-4.3'})]; break;
        case 'bell': children = [e('path',{d:'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z'}),e('path',{d:'M10 20a2 2 0 0 0 4 0'})]; break;
        case 'calendar': children = [e('rect',{x:3,y:5,width:18,height:16,rx:2}),e('path',{d:'M3 9h18M8 3v4M16 3v4'})]; break;
        case 'up': children = [e('path',{d:'M6 14l6-6 6 6'})]; break;
        case 'down': children = [e('path',{d:'M6 10l6 6 6-6'})]; break;
        case 'arrow-ur': children = [e('path',{d:'M7 17L17 7M9 7h8v8'})]; break;
        case 'trend-up': children = [e('path',{d:'M3 17l6-6 4 4 8-8'}),e('path',{d:'M15 7h6v6'})]; break;
        case 'trend-dn': children = [e('path',{d:'M3 7l6 6 4-4 8 8'}),e('path',{d:'M15 17h6v-6'})]; break;
        case 'chevron': children = [e('path',{d:'M9 6l6 6-6 6'})]; break;
        case 'caret': children = [e('path',{d:'M6 9l6 6 6-6'})]; break;
        case 'filter': children = [e('path',{d:'M3 5h18M6 12h12M10 19h4'})]; break;
        case 'download': children = [e('path',{d:'M12 3v12M7 11l5 4 5-4M5 21h14'})]; break;
        case 'plus': children = [e('path',{d:'M12 5v14M5 12h14'})]; break;
        case 'check': children = [e('path',{d:'M5 13l4 4L19 7'})]; break;
        case 'check-circle': children = [e('circle',{cx:12,cy:12,r:9}),e('path',{d:'M8 12l3 3 5-5'})]; break;
        case 'clock': children = [e('circle',{cx:12,cy:12,r:9}),e('path',{d:'M12 7v5l3 2'})]; break;
        case 'pin': children = [e('path',{d:'M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z'}),e('circle',{cx:12,cy:9,r:2.5})]; break;
        case 'star': extra = { fill: c, stroke: 'none' }; children = [e('path',{d:'M12 2.5l2.9 6 6.6 1-4.8 4.6 1.2 6.5L12 17.6 6 20.6l1.2-6.5L2.5 9.5l6.6-1z'})]; break;
        case 'truck': children = [e('path',{d:'M2 7h11v9H2zM13 10h5l3 3v3h-8M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'})]; break;
        case 'flame': children = [e('path',{d:'M12 2s5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 2 3 4 3 4z'})]; break;
        case 'alert': children = [e('path',{d:'M12 9v4M12 17h0'}),e('path',{d:'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'})]; break;
        case 'more': children = [e('circle',{cx:6,cy:12,r:1.3,fill:c,stroke:'none'}),e('circle',{cx:12,cy:12,r:1.3,fill:c,stroke:'none'}),e('circle',{cx:18,cy:12,r:1.3,fill:c,stroke:'none'})]; break;
        case 'logout': children = [e('path',{d:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'})]; break;
        case 'help': children = [e('circle',{cx:12,cy:12,r:9}),e('path',{d:'M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17h0'})]; break;
        case 'close': children = [e('path',{d:'M6 6l12 12M18 6L6 18'})]; break;
        case 'card': children = [e('rect',{x:3,y:6,width:18,height:13,rx:2}),e('path',{d:'M3 10h18M7 15h3'})]; break;
        case 'menu': children = [e('path',{d:'M4 7h16M4 12h16M4 17h16'})]; break;
        case 'eye': children = [e('path',{d:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'}),e('circle',{cx:12,cy:12,r:3})]; break;
        case 'dot': children = [e('circle',{cx:12,cy:12,r:4,fill:c,stroke:'none'})]; break;
        default: children = [e('circle',{cx:12,cy:12,r:9})];
      }
      return h('svg', { ...p, ...extra }, children);
    };
  },
});
