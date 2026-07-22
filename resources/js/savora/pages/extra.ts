// extra.ts — Settings + Analytics pages (ported from admin-extra.jsx)
import { defineComponent, h, ref, type PropType } from 'vue';
import { Card, SectionTitle, Button, Avatar } from '../ui';
import { AreaChart, DonutChart, BarChart, MiniBar } from '../charts';
import Icon from '../Icon';
import { savora } from '../store';

// ── Analytics ────────────────────────────────────────────────
export const Analytics = defineComponent({
  name: 'SavAnalytics',
  setup() {
    const areas = [
      { name: 'Ikoyi', v: 4.8, pct: 100 }, { name: 'Lekki Phase 1', v: 3.6, pct: 75 },
      { name: 'Victoria Island', v: 3.1, pct: 65 }, { name: 'Ikeja', v: 2.8, pct: 58 },
      { name: 'Yaba', v: 2.1, pct: 44 }, { name: 'Surulere', v: 1.4, pct: 29 },
    ];
    return () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
      h('div', { class: 'sav-grid-2-1' }, [
        h(Card, {}, () => [
          h(SectionTitle, { sub: 'Gross merchandise value, last 14 days' }, { default: () => 'Revenue performance' }),
          h(AreaChart, { data: savora.REVENUE_SERIES, valueKey: 'gmv', labelKey: 'day', format: (v: number) => '₦' + v.toFixed(2) + 'M', height: 260 }),
        ]),
        h(Card, {}, () => [
          h(SectionTitle, { sub: 'By food category' }, { default: () => 'Category mix' }),
          h('div', { style: { paddingTop: '8px' } }, [h(DonutChart, { data: savora.CATEGORY_MIX })]),
        ]),
      ]),
      h('div', { class: 'sav-grid-2-1' }, [
        h(Card, {}, () => [
          h(SectionTitle, { sub: 'GMV by delivery area' }, { default: () => 'Top areas' }),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' } }, areas.map((a, i) =>
            h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
              h('span', { style: { width: '110px', fontSize: '13px', color: 'var(--sav-ink-2)', fontWeight: 600 } }, a.name),
              h('div', { style: { flex: 1 } }, [h(MiniBar, { value: a.pct, max: 100, height: 9 })]),
              h('span', { style: { width: '56px', textAlign: 'right', fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '14px', color: 'var(--sav-ink)' } }, `₦${a.v}M`),
            ]))),
        ]),
        h(Card, {}, () => [
          h(SectionTitle, { sub: 'Orders per hour, today' }, { default: () => 'Demand by hour' }),
          h(BarChart, { data: savora.HOURLY, height: 220 }),
        ]),
      ]),
    ]);
  },
});

// ── Settings ─────────────────────────────────────────────────
const Toggle = defineComponent({
  name: 'SavToggle',
  props: { on: Boolean, onClick: Function as PropType<() => void> },
  setup(props) {
    return () => h('button', {
      onClick: props.onClick,
      style: { width: '44px', height: '26px', borderRadius: '999px', background: props.on ? 'var(--sav-primary)' : 'var(--sav-border-strong)', position: 'relative', transition: 'background 160ms ease', flexShrink: 0 },
    }, [h('span', { style: { position: 'absolute', top: '3px', left: props.on ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 160ms ease' } })]);
  },
});

const SettingRow = (title: string, desc: string, control: any, last = false) =>
  h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: last ? 'none' : '1px solid var(--sav-border)' } }, [
    h('div', { style: { flex: 1 } }, [
      h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--sav-ink)' } }, title),
      h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '2px', lineHeight: 1.4 } }, desc),
    ]),
    control,
  ]);

export const Settings = defineComponent({
  name: 'SavSettings',
  setup() {
    const toggles = ref<Record<string, boolean>>({ payouts: true, alerts: true, newKitchen: false, fraud: true });
    const t = (k: string) => (toggles.value = { ...toggles.value, [k]: !toggles.value[k] });
    return () => {
      const fees = savora.FEES;
      const team = savora.TEAM;
      return h('div', { class: 'sav-grid-2-1', style: { alignItems: 'start' } }, [
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        h(Card, {}, () => [
          h(SectionTitle, { sub: 'Control automated platform behaviour' }, { default: () => 'Automation' }),
          SettingRow('Automatic weekly payouts', 'Settle partner kitchens every Monday at 09:00.', h(Toggle, { on: toggles.value.payouts, onClick: () => t('payouts') })),
          SettingRow('Operational alerts', 'Notify ops when a kitchen pauses or cancellations spike.', h(Toggle, { on: toggles.value.alerts, onClick: () => t('alerts') })),
          SettingRow('Auto-approve new kitchens', 'Skip manual review for verified business accounts.', h(Toggle, { on: toggles.value.newKitchen, onClick: () => t('newKitchen') })),
          SettingRow('Fraud screening', 'Flag suspicious orders before they reach kitchens.', h(Toggle, { on: toggles.value.fraud, onClick: () => t('fraud') }), true),
        ]),
        h(Card, {}, () => [
          h(SectionTitle, { sub: 'Default rates applied to new partners' }, { default: () => 'Commission & fees' }),
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px' } }, fees.map((f, i) =>
            h('div', { key: i, style: { padding: '14px', borderRadius: '12px', background: 'var(--sav-surface-2)' } }, [
              h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, f.label),
              h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' } }, [
                h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '20px', color: 'var(--sav-ink)' } }, f.value),
                h(Icon, { name: 'gear', size: 15, color: 'var(--sav-ink-4)' }),
              ]),
            ]))),
        ]),
      ]),

      h(Card, {}, () => [
        h(SectionTitle, { sub: 'People with console access' }, {
          default: () => 'Team',
          right: () => h(Button, { variant: 'soft', size: 'sm', icon: 'plus' }, () => 'Invite'),
        }),
        h('div', { style: { display: 'flex', flexDirection: 'column' } }, team.map((m: Record<string, any>, i: number) =>
          h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 0', borderBottom: i < team.length - 1 ? '1px solid var(--sav-border)' : 'none' } }, [
            h(Avatar, { src: m.avatar, name: m.name, size: 38 }),
            h('div', { style: { flex: 1, minWidth: 0 } }, [
              h('div', { style: { fontSize: '13.5px', fontWeight: 600, color: 'var(--sav-ink)' } }, m.name),
              h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)' } }, m.email),
            ]),
            h('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--sav-ink-2)', padding: '4px 10px', borderRadius: '999px', background: 'var(--sav-surface-2)' } }, m.role),
          ]))),
      ]),
      ]);
    };
  },
});
