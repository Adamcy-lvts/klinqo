// dashboard.ts — Screen 1: the owner's home (ported from kitchen-dashboard.jsx)
import { defineComponent, h, ref  } from 'vue';
import type {PropType} from 'vue';
import { Sparkline } from '@/savora/charts';
import Icon from '@/savora/Icon';
import { TableShell, TR, TD, TableToolbar } from '@/savora/table';
import { Card, Button, DeltaChip } from '@/savora/ui';
import { KITCHEN, KPIS, naira  } from '../data';
import type {Kpi} from '../data';
import { kitchenStore } from '../store';
import { Pill, PaymentCell, Stars, KitchenMark, QRCode, EmptyState } from '../ui';

const KKpiCard = defineComponent({
  name: 'KKpiCard',
  props: { kpi: { type: Object as PropType<Kpi>, required: true } },
  setup(props) {
    return () => {
      const k = props.kpi;

      return h(Card, { pad: 18, hover: true, style: { display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 } }, () => [
        h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' } }, [
          h('span', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600, lineHeight: 1.3 } }, k.label),
          !k.flat ? h(DeltaChip, { delta: k.delta, dir: k.dir }) : null,
        ]),
        h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' } }, [
          h('div', {}, [
            h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '29px', letterSpacing: '-0.03em', color: 'var(--sav-ink)', lineHeight: 1 } }, k.value),
            h('div', { style: { fontSize: '11.5px', color: 'var(--sav-ink-4)', marginTop: '6px' } }, k.hint),
          ]),
          h(Sparkline, { data: k.spark, up: k.dir === 'up', width: 88, height: 36 }),
        ]),
      ]);
    };
  },
});

const KitchenHeaderCard = defineComponent({
  name: 'KitchenHeaderCard',
  setup() {
    return () => h(Card, { style: { display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' } }, () => [
      h(KitchenMark, { size: 56, radius: 16 }),
      h('div', { style: { flex: 1, minWidth: '220px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [
          h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '24px', lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--sav-ink)', whiteSpace: 'nowrap' } }, KITCHEN.name),
          h(Pill, { status: KITCHEN.status }),
        ]),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', marginTop: '9px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--sav-ink-3)' } }, [
          h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '5px' } }, [h(Icon, { name: 'pin', size: 14, color: 'var(--sav-ink-4)' }), KITCHEN.area]),
          h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '5px' } }, [h(Stars, { value: KITCHEN.rating, size: 13 }), h('strong', { style: { color: 'var(--sav-ink-2)' } }, KITCHEN.rating), ` · ${KITCHEN.reviewCount} reviews`]),
          h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, ['Business code',
            h('code', { style: { fontFamily: 'var(--sav-text)', fontWeight: 700, color: 'var(--sav-ink-2)', background: 'var(--sav-surface-2)', padding: '2px 8px', borderRadius: '7px', letterSpacing: '0.04em' } }, KITCHEN.code),
          ]),
        ]),
      ]),
      h(Button, { variant: 'secondary', size: 'sm', icon: 'gear' }, () => 'Edit profile'),
    ]);
  },
});

const StorefrontCard = defineComponent({
  name: 'StorefrontCard',
  setup() {
    const copied = ref(false);

    return () => h(Card, { style: { display: 'flex', gap: '18px', alignItems: 'center' } }, () => [
      h('div', { style: { padding: '8px', borderRadius: '12px', background: 'var(--sav-surface-2)', border: '1px solid var(--sav-border)', flexShrink: 0 } }, [h(QRCode, { size: 116, seed: KITCHEN.code })]),
      h('div', { style: { flex: 1, minWidth: 0 } }, [
        h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '16px', color: 'var(--sav-ink)' } }, 'Your storefront'),
        h('div', { style: { fontSize: '13px', color: 'var(--sav-ink-3)', marginTop: '4px', lineHeight: 1.45 } }, 'Share this link or print the QR for your counter.'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 12px', borderRadius: '11px', border: '1px solid var(--sav-border)', background: 'var(--sav-surface-2)' } }, [
          h(Icon, { name: 'store', size: 15, color: 'var(--sav-ink-3)' }),
          h('span', { style: { flex: 1, fontSize: '13px', color: 'var(--sav-ink-2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, KITCHEN.storefront),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, [
          h(Button, { size: 'sm', icon: copied.value ? 'check' : 'card', onClick: () => {
 copied.value = true; setTimeout(() => (copied.value = false), 1600); 
} }, () => (copied.value ? 'Copied' : 'Copy link')),
          h(Button, { variant: 'secondary', size: 'sm', icon: 'download' }, () => 'Print QR'),
        ]),
      ]),
    ]);
  },
});

export const Dashboard = defineComponent({
  name: 'KitchenDashboard',
  props: {
    empty: Boolean,
    onOpenOrder: Function as PropType<(id: string) => void>,
    onNavigate: Function as PropType<(p: string) => void>,
  },
  setup(props) {
    const columns = [
      { label: 'Order', width: 90 },
      { label: 'Customer' },
      { label: 'Status', width: 130 },
      { label: 'Payment', width: 150 },
      { label: 'Total', align: 'right', width: 110 },
    ];

    return () => {
      if (props.empty) {
        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          h(EmptyState, { icon: 'store', title: 'Set up your kitchen', desc: 'Add your kitchen details, build your menu and switch on order channels to start taking orders on Savora.' }, {
            action: () => h('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } }, [
              h(Button, { icon: 'plus', onClick: () => props.onNavigate?.('settings') }, () => 'Set up kitchen'),
              h(Button, { variant: 'secondary', onClick: () => props.onNavigate?.('menu') }, () => 'Build menu'),
            ]),
          }),
        ]);
      }

      const recent = kitchenStore.orders.slice(0, 8);

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h(KitchenHeaderCard),
        h('div', { class: 'sav-grid-2-1' }, [
          h('div', { class: 'sav-kpi-grid', style: { gridTemplateColumns: 'repeat(2,1fr)' } }, KPIS.map((k) => h(KKpiCard, { key: k.id, kpi: k }))),
          h(StorefrontCard),
        ]),
        h(TableShell, { columns }, {
          toolbar: () => h(TableToolbar, { label: 'Recent orders', count: recent.length }, {
            actions: () => h(Button, { variant: 'ghost', size: 'sm', iconRight: 'chevron', onClick: () => props.onNavigate?.('orders') }, () => 'All orders'),
          }),
          default: () => recent.map((o) => h(TR, { key: o.id, onClick: () => props.onOpenOrder?.(o.id) }, () => [
            h(TD, {}, () => h('span', { style: { fontWeight: 700, color: 'var(--sav-ink-2)' } }, `#${o.id}`)),
            h(TD, {}, () => [
              h('div', { style: { fontWeight: 600 } }, o.customer),
              h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' } }, [
                h(Icon, { name: o.deliveryType === 'pickup' ? 'store' : 'truck', size: 12, color: 'var(--sav-ink-4)' }),
                o.deliveryType === 'pickup' ? 'Pickup' : o.area,
              ]),
            ]),
            h(TD, {}, () => h(Pill, { status: o.status })),
            h(TD, {}, () => h(PaymentCell, { order: o })),
            h(TD, { align: 'right' }, () => h('span', { style: { fontWeight: 700, fontFamily: 'var(--sav-display)' } }, naira(o.total))),
          ])),
        }),
      ]);
    };
  },
});
