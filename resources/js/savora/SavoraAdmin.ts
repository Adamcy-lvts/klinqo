// SavoraAdmin.ts — Savora admin shell + client-side section routing
// (ported from admin-app.jsx; the dev-only TweaksPanel scaffold is omitted)
import { defineComponent, h, ref, watch, onMounted, type Component, type PropType } from 'vue';
import { Sidebar, Topbar } from './shell';
import { Overview } from './pages/overview';
import { Orders } from './pages/orders';
import { Kitchens } from './pages/kitchens';
import { Customers } from './pages/customers';
import { Payouts } from './pages/payouts';
import { Analytics, Settings } from './pages/extra';

const PAGES: Record<string, Component> = {
  overview: Overview, orders: Orders, kitchens: Kitchens,
  customers: Customers, payouts: Payouts, analytics: Analytics, settings: Settings,
};

const LS_KEY = 'savora-admin-page';
const LS_COLLAPSED = 'savora-admin-collapsed';

export default defineComponent({
  name: 'SavoraAdmin',
  props: {
    onLogout: Function as PropType<() => void>,
  },
  setup(props) {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    const page = ref(ls?.getItem(LS_KEY) || 'overview');
    const collapsed = ref(ls?.getItem(LS_COLLAPSED) === '1');
    const mobileOpen = ref(false);
    const scrollRef = ref<HTMLElement | null>(null);

    watch(page, (p) => { ls?.setItem(LS_KEY, p); scrollRef.value?.scrollTo(0, 0); });
    watch(collapsed, (c) => ls?.setItem(LS_COLLAPSED, c ? '1' : '0'));
    onMounted(() => scrollRef.value?.scrollTo(0, 0));

    return () => {
      const Page = PAGES[page.value] || PAGES.overview;
      return h('div', { class: 'sav-root', style: { display: 'flex', minHeight: '100vh', background: 'var(--sav-bg)' } }, [
        h(Sidebar, {
          active: page.value, onNavigate: (id: string) => (page.value = id), collapsed: collapsed.value,
          mobileOpen: mobileOpen.value, onCloseMobile: () => (mobileOpen.value = false),
          onLogout: props.onLogout,
        }),
        h('div', { ref: scrollRef, style: { flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' } }, [
          h(Topbar, { page: page.value, onToggleSidebar: () => (collapsed.value = !collapsed.value), onMobileMenu: () => (mobileOpen.value = true) }),
          h('main', { class: 'sav-main', style: { padding: '24px 28px 48px', maxWidth: '1320px', margin: '0 auto' } }, [
            h('div', { key: page.value, class: 'sav-page-enter' }, [h(Page)]),
          ]),
        ]),
      ]);
    };
  },
});
