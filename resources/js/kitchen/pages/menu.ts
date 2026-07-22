// menu.ts — Screen 4: menu management (categories × items)
import { defineComponent, h, ref } from 'vue';
import type { PropType } from 'vue';
import Icon from '@/savora/Icon';
import { Card, Button } from '@/savora/ui';
import { MENU, EMOJIS   } from '../data';
import type {Category, MenuItem} from '../data';
import { Toggle, InlineEdit, EmptyState, Confirm } from '../ui';

let idSeq = 100;

const ItemThumb = () => h('div', {
  style: { width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--sav-border)',
    background: 'repeating-linear-gradient(45deg, var(--sav-surface-2), var(--sav-surface-2) 6px, var(--sav-bg) 6px, var(--sav-bg) 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}, [h('span', { style: { fontSize: '8px', fontFamily: 'ui-monospace, monospace', color: 'var(--sav-ink-4)', fontWeight: 600 } }, 'IMG')]);

const AddItemForm = defineComponent({
  name: 'KAddItemForm',
  props: { onAdd: Function as PropType<(it: Omit<MenuItem, 'id'>) => void>, onCancel: Function as PropType<() => void> },
  setup(props) {
    const name = ref('');
    const price = ref('');
    const desc = ref('');
    const field = { height: '38px', borderRadius: '10px', border: '1px solid var(--sav-border)', padding: '0 12px', fontSize: '13.5px', background: 'var(--sav-surface)', outline: 'none', color: 'var(--sav-ink)' };
    const submit = () => {
      if (!name.value.trim()) {
return;
}

      props.onAdd?.({ name: name.value.trim(), price: parseInt(price.value.replace(/\D/g, '')) || 0, desc: desc.value.trim(), available: true, popular: false });
    };

    return () => h('div', { style: { padding: '14px', borderRadius: '12px', background: 'var(--sav-surface-2)', border: '1px solid var(--sav-border)', marginTop: '8px' } }, [
      h('div', { style: { display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' } }, [
        h('button', { style: { width: '56px', height: '56px', borderRadius: '10px', border: '1.5px dashed var(--sav-border-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: 'var(--sav-ink-3)', background: 'var(--sav-surface)', flexShrink: 0 } }, [h(Icon, { name: 'plus', size: 16 }), h('span', { style: { fontSize: '8.5px', fontWeight: 600 } }, 'Image')]),
        h('div', { style: { flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' } }, [
          h('div', { style: { display: 'flex', gap: '8px' } }, [
            h('input', { value: name.value, placeholder: 'Item name', onInput: (e: Event) => (name.value = (e.target as HTMLInputElement).value), onVnodeMounted: (vn: { el: HTMLElement | null }) => (vn.el as HTMLInputElement | null)?.focus(), style: { ...field, flex: 1 } }),
            h('input', { value: price.value, placeholder: 'Price ₦', onInput: (e: Event) => (price.value = (e.target as HTMLInputElement).value), style: { ...field, width: '110px' } }),
          ]),
          h('input', { value: desc.value, placeholder: 'Short description', onInput: (e: Event) => (desc.value = (e.target as HTMLInputElement).value), style: field }),
        ]),
      ]),
      h('div', { style: { display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' } }, [
        h(Button, { variant: 'ghost', size: 'sm', onClick: props.onCancel }, () => 'Cancel'),
        h(Button, { size: 'sm', icon: 'check', onClick: submit }, () => 'Add item'),
      ]),
    ]);
  },
});

type ItemActions = {
  editItem: (id: string, k: keyof MenuItem, v: unknown) => void;
  delItem: (id: string) => void;
};
// drag controllers expose only function calls, so children never mutate props
type RowDrag = { start: (i: number) => void; drop: (i: number) => void; end: () => void };
type CatDrag = { start: (i: number) => void; over: (i: number) => void; drop: (i: number) => void; end: () => void };

const ItemRow = defineComponent({
  name: 'KItemRow',
  props: {
    item: { type: Object as PropType<MenuItem>, required: true },
    index: { type: Number, required: true },
    dragging: Boolean,
    actions: { type: Object as PropType<ItemActions>, required: true },
    drag: { type: Object as PropType<RowDrag>, required: true },
  },
  setup(props) {
    return () => {
      const it = props.item;
      const iconBtn = (name: string, onClick: () => void, title: string, active = false, activeColor = 'var(--sav-warn)') => h('button', {
        onClick, title, style: { width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? activeColor : 'var(--sav-ink-4)', background: active ? 'var(--sav-warn-soft)' : 'transparent' },
        onMouseenter: (e: MouseEvent) => {
 if (!active) {
(e.currentTarget as HTMLElement).style.color = 'var(--sav-danger)';
} 
},
        onMouseleave: (e: MouseEvent) => {
 if (!active) {
(e.currentTarget as HTMLElement).style.color = 'var(--sav-ink-4)';
} 
},
      }, [h(Icon, { name, size: 16, color: active ? activeColor : 'var(--sav-ink-4)' })]);

      return h('div', {
        draggable: true,
        onDragstart: () => props.drag.start(props.index),
        onDragover: (e: DragEvent) => e.preventDefault(),
        onDrop: (e: DragEvent) => {
 e.preventDefault(); props.drag.drop(props.index); 
},
        onDragend: () => props.drag.end(),
        style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderRadius: '12px',
          background: props.dragging ? 'var(--sav-primary-tint)' : 'transparent', opacity: it.available ? 1 : 0.62,
          border: props.dragging ? '1px dashed var(--sav-primary)' : '1px solid transparent' },
      }, [
        h('span', { style: { cursor: 'grab', color: 'var(--sav-ink-4)', display: 'flex', flexShrink: 0 }, title: 'Drag to reorder' }, [h(Icon, { name: 'more', size: 18 })]),
        ItemThumb(),
        h('div', { style: { flex: 1, minWidth: 0 } }, [
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
            h('span', { style: { fontSize: '14px', fontWeight: 700, color: 'var(--sav-ink)' } }, [h(InlineEdit, { value: it.name, onChange: (v: string) => props.actions.editItem(it.id, 'name', v) })]),
            it.popular ? h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--sav-warn)', background: 'var(--sav-warn-soft)', padding: '2px 7px', borderRadius: '999px' } }, [h(Icon, { name: 'star', size: 10, color: 'var(--sav-warn)' }), 'Popular']) : null,
            !it.available ? h('span', { style: { fontSize: '10.5px', fontWeight: 700, color: 'var(--sav-ink-3)', background: 'var(--sav-surface-2)', padding: '2px 7px', borderRadius: '999px' } }, 'Unavailable') : null,
          ]),
          h('div', { style: { fontSize: '12.5px', color: 'var(--sav-ink-3)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' } }, [h(InlineEdit, { value: it.desc, onChange: (v: string) => props.actions.editItem(it.id, 'desc', v) })]),
        ]),
        h('span', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '15px', color: 'var(--sav-ink)', flexShrink: 0 } }, ['₦', h(InlineEdit, { value: String(it.price), onChange: (v: string) => props.actions.editItem(it.id, 'price', parseInt(v.replace(/\D/g, '')) || 0) })]),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 } }, [
          iconBtn('star', () => props.actions.editItem(it.id, 'popular', !it.popular), 'Toggle popular', it.popular),
          h(Toggle, { on: it.available, onClick: () => props.actions.editItem(it.id, 'available', !it.available), size: 'sm' }),
          iconBtn('close', () => props.actions.delItem(it.id), 'Delete item'),
        ]),
      ]);
    };
  },
});

type CatActions = ItemActions & {
  editCat: (k: keyof Category, v: unknown) => void;
  delCat: () => void;
  addItem: (it: Omit<MenuItem, 'id'>) => void;
  reorderItem: (from: number, to: number) => void;
};

const CategoryCard = defineComponent({
  name: 'KCategoryCard',
  props: {
    cat: { type: Object as PropType<Category>, required: true },
    index: { type: Number, required: true },
    dragging: Boolean,
    dropTarget: Boolean,
    actions: { type: Object as PropType<CatActions>, required: true },
    catDrag: { type: Object as PropType<CatDrag>, required: true },
  },
  setup(props) {
    const adding = ref(false);
    const dragFrom = ref<number | null>(null);
    const dragIdx = ref<number | null>(null);
    const rowDrag: RowDrag = {
      start: (i) => {
 dragFrom.value = i; dragIdx.value = i; 
},
      drop: (i) => {
 const from = dragFrom.value;

 if (from != null && from !== i) {
props.actions.reorderItem(from, i);
}

 dragFrom.value = null; dragIdx.value = null; 
},
      end: () => {
 dragFrom.value = null; dragIdx.value = null; 
},
    };

    return () => {
      const cat = props.cat;

      return h(Card, { pad: 0, style: { overflow: 'hidden', opacity: props.dragging ? 0.5 : 1, border: props.dropTarget ? '1px solid var(--sav-primary)' : '1px solid var(--sav-border)' } }, () => [
        h('div', {
          draggable: true,
          onDragstart: () => props.catDrag.start(props.index),
          onDragover: (e: DragEvent) => {
 e.preventDefault(); props.catDrag.over(props.index); 
},
          onDrop: (e: DragEvent) => {
 e.preventDefault(); props.catDrag.drop(props.index); 
},
          onDragend: () => props.catDrag.end(),
          style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid var(--sav-border)', background: 'var(--sav-surface-2)' },
        }, [
          h('span', { style: { cursor: 'grab', color: 'var(--sav-ink-4)', display: 'flex' }, title: 'Drag to reorder category' }, [h(Icon, { name: 'more', size: 18 })]),
          h('span', { style: { fontSize: '22px' } }, cat.emoji),
          h('div', { style: { flex: 1, minWidth: 0 } }, [
            h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '16px', color: 'var(--sav-ink)' } }, [h(InlineEdit, { value: cat.name, onChange: (v: string) => props.actions.editCat('name', v) })]),
            h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', marginTop: '1px' } }, `${cat.items.length} items · ${cat.items.filter((i) => i.available).length} available`),
          ]),
          h('span', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, cat.active ? 'Active' : 'Hidden'),
          h(Toggle, { on: cat.active, onClick: () => props.actions.editCat('active', !cat.active), size: 'sm' }),
          h('button', { onClick: () => props.actions.delCat(), title: 'Delete category', style: { width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sav-ink-4)' },
            onMouseenter: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.color = 'var(--sav-danger)'), onMouseleave: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.color = 'var(--sav-ink-4)') }, [h(Icon, { name: 'close', size: 17 })]),
        ]),
        h('div', { style: { padding: '6px 10px 12px' } }, [
          ...cat.items.map((it, i) => h(ItemRow, { key: it.id, item: it, index: i, dragging: dragIdx.value === i, actions: props.actions, drag: rowDrag })),
          adding.value
            ? h(AddItemForm, { onAdd: (it: Omit<MenuItem, 'id'>) => {
 props.actions.addItem(it); adding.value = false; 
}, onCancel: () => (adding.value = false) })
            : h('button', { onClick: () => (adding.value = true), style: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '11px 12px', borderRadius: '10px', color: 'var(--sav-primary-dark)', fontWeight: 600, fontSize: '13.5px', marginTop: '4px' },
                onMouseenter: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'var(--sav-primary-tint)'), onMouseleave: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'transparent') }, [h(Icon, { name: 'plus', size: 16 }), `Add item to ${cat.name}`]),
        ]),
      ]);
    };
  },
});

export const Menu = defineComponent({
  name: 'KitchenMenu',
  props: { empty: Boolean },
  setup(props) {
    const cats = ref<Category[]>(props.empty ? [] : MENU.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })));
    const confirm = ref<{ title: string; desc: string; onConfirm: () => void } | null>(null);
    const addingCat = ref(false);
    const newCat = ref({ name: '', emoji: '🍽️' });
    const catDragFrom = ref<number | null>(null);
    const catDragIdx = ref<number | null>(null);
    const catDropIdx = ref<number | null>(null);

    const findCat = (cid: string) => cats.value.find((c) => c.id === cid);

    const catActions = (cat: Category): CatActions => ({
      editCat: (k, v) => {
 const c = findCat(cat.id);

 if (c) {
(c as Record<string, unknown>)[k as string] = v;
} 
},
      delCat: () => {
 confirm.value = { title: `Delete "${cat.name}"?`, desc: `This removes the category and its ${cat.items.length} items. This can't be undone.`, onConfirm: () => {
 cats.value = cats.value.filter((c) => c.id !== cat.id); confirm.value = null; 
} }; 
},
      addItem: (it) => {
 const c = findCat(cat.id);

 if (c) {
c.items.push({ ...it, id: 'new' + (idSeq++) });
} 
},
      editItem: (id, k, v) => {
 const c = findCat(cat.id); const item = c?.items.find((i) => i.id === id);

 if (item) {
(item as Record<string, unknown>)[k as string] = v;
} 
},
      delItem: (id) => {
 const c = findCat(cat.id);

 if (c) {
c.items = c.items.filter((i) => i.id !== id);
} 
},
      reorderItem: (from, to) => {
 const c = findCat(cat.id);

 if (c) {
 const [m] = c.items.splice(from, 1); c.items.splice(to, 0, m); 
} 
},
    });

    const catDrag: CatDrag = {
      start: (i) => {
 catDragFrom.value = i; catDragIdx.value = i; 
},
      over: (i) => {
 catDropIdx.value = i; 
},
      drop: (i) => {
 const from = catDragFrom.value;

 if (from != null && from !== i) {
 const arr = cats.value.slice(); const [m] = arr.splice(from, 1); arr.splice(i, 0, m); cats.value = arr; 
}

 catDragFrom.value = null; catDragIdx.value = null; catDropIdx.value = null; 
},
      end: () => {
 catDragFrom.value = null; catDragIdx.value = null; catDropIdx.value = null; 
},
    };

    const addCategory = () => {
      if (!newCat.value.name.trim()) {
return;
}

      cats.value.push({ id: 'cat' + (idSeq++), name: newCat.value.name.trim(), emoji: newCat.value.emoji, active: true, items: [] });
      newCat.value = { name: '', emoji: '🍽️' };
      addingCat.value = false;
    };

    return () => {
      const totalItems = cats.value.reduce((s, c) => s + c.items.length, 0);
      const stats: [string, number][] = [['Categories', cats.value.length], ['Menu items', totalItems], ['Available', cats.value.reduce((s, c) => s + c.items.filter((i) => i.available).length, 0)]];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, [
          h('div', { style: { display: 'flex', gap: '18px', flexWrap: 'wrap' } }, stats.map(([l, v]) => h('div', { key: l }, [
            h('div', { style: { fontSize: '12px', color: 'var(--sav-ink-3)', fontWeight: 600 } }, l),
            h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '22px', color: 'var(--sav-ink)' } }, v),
          ]))),
          h('div', { style: { flex: 1 } }),
          h(Button, { icon: 'plus', onClick: () => (addingCat.value = !addingCat.value) }, () => 'Add category'),
        ]),

        addingCat.value ? h(Card, { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, () => [
          h('span', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--sav-ink-2)' } }, 'New category'),
          h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } }, EMOJIS.map((e) => h('button', { key: e, onClick: () => (newCat.value.emoji = e), style: { width: '34px', height: '34px', borderRadius: '9px', fontSize: '17px', border: '1px solid', borderColor: newCat.value.emoji === e ? 'var(--sav-primary)' : 'var(--sav-border)', background: newCat.value.emoji === e ? 'var(--sav-primary-soft)' : 'var(--sav-surface)' } }, e))),
          h('input', { value: newCat.value.name, placeholder: 'Category name', onInput: (e: Event) => (newCat.value.name = (e.target as HTMLInputElement).value), onKeydown: (e: KeyboardEvent) => {
 if (e.key === 'Enter') {
addCategory();
} 
}, onVnodeMounted: (vn: { el: HTMLElement | null }) => (vn.el as HTMLInputElement | null)?.focus(), style: { flex: 1, minWidth: '160px', height: '40px', borderRadius: '10px', border: '1px solid var(--sav-border)', padding: '0 12px', fontSize: '14px', outline: 'none', background: 'var(--sav-surface)', color: 'var(--sav-ink)' } }),
          h(Button, { size: 'sm', icon: 'check', onClick: addCategory }, () => 'Add'),
          h(Button, { variant: 'ghost', size: 'sm', onClick: () => (addingCat.value = false) }, () => 'Cancel'),
        ]) : null,

        cats.value.length === 0 && !addingCat.value ? h(EmptyState, { icon: 'store', title: 'Your menu is empty', desc: 'Add your first category — like Rice & Grains or Drinks — then start adding dishes customers can order.' }, {
          action: () => h(Button, { icon: 'plus', onClick: () => (addingCat.value = true) }, () => 'Add category'),
        }) : null,

        ...cats.value.map((cat, idx) => h(CategoryCard, {
          key: cat.id, cat, index: idx,
          dragging: catDragIdx.value === idx, dropTarget: catDropIdx.value === idx && catDragIdx.value !== idx,
          actions: catActions(cat), catDrag,
        })),

        confirm.value ? h(Confirm, { title: confirm.value.title, desc: confirm.value.desc, onConfirm: confirm.value.onConfirm, onCancel: () => (confirm.value = null) }) : null,
      ]);
    };
  },
});
