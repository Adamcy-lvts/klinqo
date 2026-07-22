// delivery.ts — Screen 5: delivery methods
import { defineComponent, h, ref } from 'vue';
import Icon from '@/savora/Icon';
import { Card, Button } from '@/savora/ui';
import { DELIVERY_METHODS, naira  } from '../data';
import type {DeliveryMethod} from '../data';
import { Toggle, InlineEdit, EmptyState, Confirm } from '../ui';

export const DeliveryMethods = defineComponent({
  name: 'KitchenDeliveryMethods',
  props: { empty: Boolean },
  setup(props) {
    const methods = ref<DeliveryMethod[]>(props.empty ? [] : DELIVERY_METHODS.map((m) => ({ ...m })));
    const confirm = ref<{ title: string; desc: string; onConfirm: () => void } | null>(null);
    const adding = ref(false);
    const draft = ref({ name: '', desc: '', fee: '' });
    const field = { height: '38px', borderRadius: '10px', border: '1px solid var(--sav-border)', padding: '0 12px', fontSize: '13.5px', background: 'var(--sav-surface)', outline: 'none', color: 'var(--sav-ink)' };

    const upd = (id: string, k: keyof DeliveryMethod, v: unknown) => {
 const m = methods.value.find((x) => x.id === id);

 if (m) {
(m as Record<string, unknown>)[k as string] = v;
} 
};
    const addMethod = () => {
 if (!draft.value.name.trim()) {
return;
}

 methods.value.push({ id: 'd' + Date.now(), name: draft.value.name.trim(), desc: draft.value.desc.trim(), fee: parseInt(draft.value.fee.replace(/\D/g, '')) || 0, active: true }); draft.value = { name: '', desc: '', fee: '' }; adding.value = false; 
};

    return () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } }, [
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
        h('div', { style: { fontSize: '13.5px', color: 'var(--sav-ink-3)', lineHeight: 1.5, flex: 1 } }, 'How customers receive their orders. Active methods appear at checkout on your storefront.'),
        h(Button, { icon: 'plus', onClick: () => (adding.value = !adding.value) }, () => 'Add method'),
      ]),

      adding.value ? h(Card, { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' } }, () => [
        h('div', { style: { width: '40px', height: '40px', borderRadius: '10px', background: 'var(--sav-primary-soft)', color: 'var(--sav-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, [h(Icon, { name: 'truck', size: 19 })]),
        h('input', { value: draft.value.name, placeholder: 'Method name', onInput: (e: Event) => (draft.value.name = (e.target as HTMLInputElement).value), onVnodeMounted: (vn: { el: HTMLElement | null }) => (vn.el as HTMLInputElement | null)?.focus(), style: { ...field, flex: 1, minWidth: '140px' } }),
        h('input', { value: draft.value.desc, placeholder: 'Description', onInput: (e: Event) => (draft.value.desc = (e.target as HTMLInputElement).value), style: { ...field, flex: 2, minWidth: '180px' } }),
        h('input', { value: draft.value.fee, placeholder: 'Fee ₦', onInput: (e: Event) => (draft.value.fee = (e.target as HTMLInputElement).value), style: { ...field, width: '100px' } }),
        h(Button, { size: 'sm', icon: 'check', onClick: addMethod }, () => 'Add'),
        h(Button, { variant: 'ghost', size: 'sm', onClick: () => (adding.value = false) }, () => 'Cancel'),
      ]) : null,

      methods.value.length === 0 && !adding.value ? h(EmptyState, { icon: 'truck', title: 'No delivery methods', desc: 'Add at least one way for customers to get their food — pickup, standard delivery, or your own custom option.' }, {
        action: () => h(Button, { icon: 'plus', onClick: () => (adding.value = true) }, () => 'Add method'),
      }) : null,

      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, methods.value.map((m) => h(Card, { key: m.id, style: { display: 'flex', alignItems: 'center', gap: '14px', opacity: m.active ? 1 : 0.6 } }, () => [
        h('span', { style: { cursor: 'grab', color: 'var(--sav-ink-4)', display: 'flex' } }, [h(Icon, { name: 'more', size: 18 })]),
        h('div', { style: { width: '44px', height: '44px', borderRadius: '11px', background: m.fee === 0 ? 'var(--sav-success-soft)' : 'var(--sav-primary-soft)', color: m.fee === 0 ? 'var(--sav-success)' : 'var(--sav-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, [h(Icon, { name: m.fee === 0 ? 'store' : 'truck', size: 20 })]),
        h('div', { style: { flex: 1, minWidth: 0 } }, [
          h('div', { style: { fontSize: '14.5px', fontWeight: 700, color: 'var(--sav-ink)' } }, [h(InlineEdit, { value: m.name, onChange: (v: string) => upd(m.id, 'name', v) })]),
          h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '2px' } }, [h(InlineEdit, { value: m.desc, onChange: (v: string) => upd(m.id, 'desc', v) })]),
        ]),
        h('div', { style: { textAlign: 'right', flexShrink: 0 } }, [
          h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '17px', color: m.fee === 0 ? 'var(--sav-success)' : 'var(--sav-ink)' } }, m.fee === 0 ? 'Free' : naira(m.fee)),
          h('div', { style: { fontSize: '11px', color: 'var(--sav-ink-4)' } }, 'per order'),
        ]),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingLeft: '6px', borderLeft: '1px solid var(--sav-border)' } }, [
          h(Toggle, { on: m.active, onClick: () => upd(m.id, 'active', !m.active) }),
          h('button', { onClick: () => {
 confirm.value = { title: `Delete "${m.name}"?`, desc: 'Customers will no longer be able to choose this method.', onConfirm: () => {
 methods.value = methods.value.filter((x) => x.id !== m.id); confirm.value = null; 
} }; 
}, style: { width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sav-ink-4)' },
            onMouseenter: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.color = 'var(--sav-danger)'), onMouseleave: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.color = 'var(--sav-ink-4)') }, [h(Icon, { name: 'close', size: 16 })]),
        ]),
      ]))),

      confirm.value ? h(Confirm, { title: confirm.value.title, desc: confirm.value.desc, onConfirm: confirm.value.onConfirm, onCancel: () => (confirm.value = null) }) : null,
    ]);
  },
});
