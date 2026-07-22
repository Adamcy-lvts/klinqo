// KitchenConsole.ts — kitchen console shell + client-side section routing.
// Ported from kitchen-app.jsx (the dev-only TweaksPanel scaffold is omitted,
// matching the platform Operations Console port). The green "herb" accent is
// applied as a CSS-var override on the root, so the same Savora components
// render in the kitchen's own colour — the surface's key differentiator.
import { defineComponent, h, ref, watch, onMounted  } from 'vue';
import type {PropType} from 'vue';
import { CUSTOMERS } from './data';
import { Customers, CustomerDetail } from './pages/customers';
import { Dashboard } from './pages/dashboard';
import { DeliveryMethods } from './pages/delivery';
import { Menu } from './pages/menu';
import { Orders, OrderDetail } from './pages/orders';
import { Reports } from './pages/reports';
import { Reviews } from './pages/reviews';
import { Settings } from './pages/settings';
import { KSidebar, KTopbar, K_PAGE_META } from './shell';
import { kitchenStore } from './store';

const LS_PAGE = 'savora-kitchen-page';
const LS_COLLAPSED = 'savora-kitchen-collapsed';

// Herb green accent (the kitchen default) → primary + derived shades.
const ACCENT_VARS = {
  '--sav-primary': '#1F8A5B',
  '--sav-primary-dark': '#16704A',
  '--sav-primary-soft': 'rgba(31, 138, 91, 0.12)',
  '--sav-primary-tint': 'rgba(31, 138, 91, 0.06)',
};

type Sub = { type: 'order' | 'customer'; id: string } | null;

export default defineComponent({
  name: 'KitchenConsole',
  props: { onLogout: Function as PropType<() => void> },
  setup(props) {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    const page = ref(ls?.getItem(LS_PAGE) || 'dashboard');
    const sub = ref<Sub>(null);
    const collapsed = ref(ls?.getItem(LS_COLLAPSED) === '1');
    const mobileOpen = ref(false);
    const scrollRef = ref<HTMLElement | null>(null);
    const empty = false; // populated demo state (matches the design default)

    watch(page, (p) => {
 ls?.setItem(LS_PAGE, p); scrollRef.value?.scrollTo(0, 0); 
});
    watch(sub, () => scrollRef.value?.scrollTo(0, 0));
    watch(collapsed, (c) => ls?.setItem(LS_COLLAPSED, c ? '1' : '0'));
    onMounted(() => scrollRef.value?.scrollTo(0, 0));

    const navigate = (p: string) => {
 sub.value = null; page.value = p; 
};
    const openOrder = (id: string) => {
 page.value = 'orders'; sub.value = { type: 'order', id }; 
};
    const openCustomer = (id: string) => {
 page.value = 'customers'; sub.value = { type: 'customer', id }; 
};

    const liveCount = () => (empty ? 0 : kitchenStore.orders.filter((o) => ['placed', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)).length);

    const crumbs = () => {
      if (sub.value?.type === 'order') {
return ['Dashboard', 'Orders', '#' + sub.value.id];
}

      if (sub.value?.type === 'customer') {
        const c = CUSTOMERS.find((x) => x.id === sub.value!.id);

        return ['Dashboard', 'Customers', c ? c.name : 'Customer'];
      }

      return page.value === 'dashboard' ? ['Dashboard'] : ['Dashboard', K_PAGE_META[page.value] || ''];
    };

    const view = () => {
      if (sub.value?.type === 'order') {
return h(OrderDetail, { orderId: sub.value.id, onBack: () => (sub.value = null) });
}

      if (sub.value?.type === 'customer') {
return h(CustomerDetail, { customerId: sub.value.id, onBack: () => (sub.value = null), onOpenOrder: openOrder });
}

      switch (page.value) {
        case 'orders':    return h(Orders, { empty, onOpenOrder: openOrder });
        case 'menu':      return h(Menu, { empty });
        case 'delivery':  return h(DeliveryMethods, { empty });
        case 'customers': return h(Customers, { empty, onOpenCustomer: openCustomer });
        case 'reviews':   return h(Reviews, { empty });
        case 'reports':   return h(Reports, { empty });
        case 'settings':  return h(Settings);
        default:          return h(Dashboard, { empty, onOpenOrder: openOrder, onNavigate: navigate });
      }
    };

    return () => h('div', { class: 'sav-root sav-compact', style: { display: 'flex', minHeight: '100vh', background: 'var(--sav-bg)', ...ACCENT_VARS } }, [
      h(KSidebar, {
        active: page.value, onNavigate: navigate, collapsed: collapsed.value, liveCount: liveCount(),
        mobileOpen: mobileOpen.value, onCloseMobile: () => (mobileOpen.value = false), onLogout: props.onLogout,
      }),
      h('div', { ref: scrollRef, style: { flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' } }, [
        h(KTopbar, { page: page.value, crumbs: crumbs(), onToggleSidebar: () => (collapsed.value = !collapsed.value), onMobileMenu: () => (mobileOpen.value = true) }),
        h('main', { class: 'sav-main', style: { padding: '18px 22px 48px', maxWidth: '1320px', margin: '0 auto' } }, [
          h('div', { key: page.value + (sub.value ? sub.value.type + sub.value.id : ''), class: 'sav-page-enter' }, [view()]),
        ]),
      ]),
    ]);
  },
});
