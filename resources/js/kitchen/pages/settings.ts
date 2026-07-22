// settings.ts — Screen 9: kitchen profile & settings
import { defineComponent, h, ref  } from 'vue';
import type {PropType} from 'vue';
import Icon from '@/savora/Icon';
import { Card, Button, SectionTitle } from '@/savora/ui';
import { SETTINGS, ALL_CUISINES  } from '../data';
import type {DayHours} from '../data';
import { Toggle, KitchenMark } from '../ui';

const Field = defineComponent({
  name: 'KField',
  props: {
    label: String, value: [String, Number], multiline: Boolean, suffix: String,
    width: Number, onChange: Function as PropType<(v: string) => void>,
  },
  setup(props) {
    return () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', width: props.width ? `${props.width}px` : 'auto', flex: props.width ? 'none' : 1, minWidth: '160px' } }, [
      h('label', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--sav-ink-3)' } }, props.label),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        props.multiline
          ? h('textarea', { value: props.value, onInput: (e: Event) => props.onChange?.((e.target as HTMLTextAreaElement).value), rows: 3, style: { width: '100%', borderRadius: '10px', border: '1px solid var(--sav-border)', padding: '10px 12px', fontSize: '13.5px', background: 'var(--sav-surface)', outline: 'none', resize: 'vertical', color: 'var(--sav-ink)', lineHeight: 1.5, font: 'inherit' } })
          : h('input', { value: props.value, onInput: (e: Event) => props.onChange?.((e.target as HTMLInputElement).value), style: { width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--sav-border)', padding: '0 12px', fontSize: '13.5px', background: 'var(--sav-surface)', outline: 'none', color: 'var(--sav-ink)' } }),
        props.suffix ? h('span', { style: { fontSize: '13px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, props.suffix) : null,
      ]),
    ]);
  },
});

const SettingRow = defineComponent({
  name: 'KSettingRow',
  props: { title: String, desc: String, last: Boolean },
  setup(props, { slots }) {
    return () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', padding: '15px 0', borderBottom: props.last ? 'none' : '1px solid var(--sav-border)' } }, [
      h('div', { style: { flex: 1 } }, [
        h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--sav-ink)' } }, props.title),
        h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '2px', lineHeight: 1.4 } }, props.desc),
      ]),
      slots.default?.(),
    ]);
  },
});

export const Settings = defineComponent({
  name: 'KitchenSettings',
  setup() {
    const profile = ref({ ...SETTINGS.profile });
    const prep = ref({ ...SETTINGS.prep } as { min: number | string; max: number | string });
    const channels = ref({ ...SETTINGS.channels });
    const hours = ref<DayHours[]>(SETTINGS.hours.map((hh) => ({ ...hh })));
    const cuisines = ref<string[]>([...SETTINGS.cuisines]);
    const pf = (k: keyof typeof profile.value, v: string) => (profile.value[k] = v);
    const toggleCuisine = (c: string) => {
 cuisines.value = cuisines.value.includes(c) ? cuisines.value.filter((x) => x !== c) : [...cuisines.value, c]; 
};

    return () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
      h(Card, {}, () => [
        h(SectionTitle, { sub: 'How your kitchen appears to customers' }, { default: () => 'Kitchen profile', right: () => h(Button, { size: 'sm', icon: 'check' }, () => 'Save changes') }),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } }, [
          h('div', { style: { display: 'flex', gap: '14px', flexWrap: 'wrap' } }, [
            h(Field, { label: 'Kitchen name', value: profile.value.name, onChange: (v: string) => pf('name', v) }),
            h(Field, { label: 'Phone', value: profile.value.phone, onChange: (v: string) => pf('phone', v), width: 200 }),
          ]),
          h(Field, { label: 'Tagline', value: profile.value.tagline, onChange: (v: string) => pf('tagline', v) }),
          h(Field, { label: 'Description', value: profile.value.description, onChange: (v: string) => pf('description', v), multiline: true }),
          h('div', { style: { display: 'flex', gap: '14px', flexWrap: 'wrap' } }, [
            h(Field, { label: 'Email', value: profile.value.email, onChange: (v: string) => pf('email', v) }),
            h(Field, { label: 'Delivery area', value: profile.value.areaName, onChange: (v: string) => pf('areaName', v), width: 200 }),
          ]),
          h(Field, { label: 'Address', value: profile.value.address, onChange: (v: string) => pf('address', v) }),
        ]),
      ]),

      h('div', { class: 'sav-grid-2-1', style: { alignItems: 'start' } }, [
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Shown to customers at checkout' }, { default: () => 'Prep time' }),
            h('div', { style: { display: 'flex', gap: '14px', alignItems: 'flex-end' } }, [
              h(Field, { label: 'Minimum', value: prep.value.min, onChange: (v: string) => (prep.value.min = v.replace(/\D/g, '')), suffix: 'min', width: 140 }),
              h('span', { style: { paddingBottom: '10px', color: 'var(--sav-ink-4)' } }, '—'),
              h(Field, { label: 'Maximum', value: prep.value.max, onChange: (v: string) => (prep.value.max = v.replace(/\D/g, '')), suffix: 'min', width: 140 }),
            ]),
          ]),

          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Which payment methods you accept' }, { default: () => 'Order channels' }),
            h(SettingRow, { title: 'Accept online payment', desc: 'Cards & transfers paid upfront on Savora.' }, { default: () => h(Toggle, { on: channels.value.online, onClick: () => (channels.value.online = !channels.value.online) }) }),
            h(SettingRow, { title: 'Accept pay on delivery', desc: 'Customer pays the rider in cash on arrival.' }, { default: () => h(Toggle, { on: channels.value.onDelivery, onClick: () => (channels.value.onDelivery = !channels.value.onDelivery) }) }),
            h(SettingRow, { title: 'Accept pay on pickup', desc: 'Customer pays at your counter when collecting.', last: true }, { default: () => h(Toggle, { on: channels.value.onPickup, onClick: () => (channels.value.onPickup = !channels.value.onPickup) }) }),
          ]),

          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Logo and cover image for your storefront' }, { default: () => 'Branding' }),
            h('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap' } }, [
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
                h('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--sav-ink-3)' } }, 'Logo'),
                h('div', { style: { position: 'relative', width: '88px', height: '88px' } }, [
                  h(KitchenMark, { size: 88, radius: 18 }),
                  h('button', { style: { position: 'absolute', right: '-6px', bottom: '-6px', width: '30px', height: '30px', borderRadius: '50%', background: 'var(--sav-surface)', border: '1px solid var(--sav-border)', boxShadow: 'var(--sav-shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sav-ink-2)' } }, [h(Icon, { name: 'plus', size: 15 })]),
                ]),
              ]),
              h('div', { style: { flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' } }, [
                h('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--sav-ink-3)' } }, 'Cover image'),
                h('button', { style: { width: '100%', height: '88px', borderRadius: '14px', border: '1.5px dashed var(--sav-border-strong)', background: 'repeating-linear-gradient(45deg, var(--sav-surface-2), var(--sav-surface-2) 8px, var(--sav-bg) 8px, var(--sav-bg) 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--sav-ink-3)' } }, [
                  h(Icon, { name: 'plus', size: 18 }), h('span', { style: { fontSize: '11.5px', fontFamily: 'ui-monospace, monospace', fontWeight: 600 } }, 'Drop cover image · 1200×400'),
                ]),
              ]),
            ]),
          ]),
        ]),

        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          h(Card, {}, () => [
            h(SectionTitle, { sub: 'When customers can order' }, { default: () => 'Operating hours' }),
            h('div', { style: { display: 'flex', flexDirection: 'column' } }, hours.value.map((hh, i) => h('div', { key: hh.day, style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: i < hours.value.length - 1 ? '1px solid var(--sav-border)' : 'none' } }, [
              h('span', { style: { width: '92px', fontSize: '13.5px', fontWeight: 600, color: 'var(--sav-ink)' } }, hh.day),
              hh.closed
                ? h('span', { style: { flex: 1, fontSize: '13px', color: 'var(--sav-ink-4)', fontWeight: 600 } }, 'Closed')
                : h('span', { style: { flex: 1, fontSize: '13px', color: 'var(--sav-ink-2)', fontVariantNumeric: 'tabular-nums' } }, [hh.open, h('span', { style: { color: 'var(--sav-ink-4)' } }, ' – '), hh.close]),
              h(Toggle, { on: !hh.closed, onClick: () => (hh.closed = !hh.closed), size: 'sm' }),
            ]))),
          ]),

          h(Card, {}, () => [
            h(SectionTitle, { sub: 'Help customers find you in search' }, { default: () => 'Cuisines' }),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } }, ALL_CUISINES.map((c) => {
              const on = cuisines.value.includes(c);

              return h('button', { key: c, onClick: () => toggleCuisine(c), style: { padding: '7px 13px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, border: '1px solid', borderColor: on ? 'transparent' : 'var(--sav-border)', background: on ? 'var(--sav-primary-soft)' : 'var(--sav-surface)', color: on ? 'var(--sav-primary-dark)' : 'var(--sav-ink-2)', display: 'inline-flex', alignItems: 'center', gap: '6px' } }, [on ? h(Icon, { name: 'check', size: 13, stroke: 2.4 }) : null, c]);
            })),
          ]),
        ]),
      ]),
    ]);
  },
});
