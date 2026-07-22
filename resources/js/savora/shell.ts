// shell.ts — Savora admin sidebar + topbar (ported from admin-shell.jsx)
import { defineComponent, h, ref, type PropType } from 'vue';
import Icon from './Icon';
import { Avatar, IconButton, SearchInput } from './ui';
import { savora } from './store';

const NAV = [
  { id: 'overview',  label: 'Overview',  icon: 'grid' },
  { id: 'orders',    label: 'Orders',    icon: 'receipt', badge: 6 },
  { id: 'kitchens',  label: 'Kitchens',  icon: 'store' },
  { id: 'customers', label: 'Customers', icon: 'users' },
  { id: 'payouts',   label: 'Payouts',   icon: 'wallet' },
];
const NAV2 = [
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'settings',  label: 'Settings',  icon: 'gear' },
];

export const PAGE_META: Record<string, { title: string; sub: string }> = {
  overview:  { title: 'Overview',  sub: "Here's how Savora is performing today, Adaeze." },
  orders:    { title: 'Orders',    sub: 'Live and recent orders across every kitchen.' },
  kitchens:  { title: 'Kitchens',  sub: 'Manage vendors, status and commissions.' },
  customers: { title: 'Customers', sub: 'Everyone ordering on the Savora platform.' },
  payouts:   { title: 'Payouts',   sub: 'Weekly settlements to partner kitchens.' },
  analytics: { title: 'Analytics', sub: 'Deep-dive into platform trends.' },
  settings:  { title: 'Settings',  sub: 'Platform configuration and team access.' },
};

export const Sidebar = defineComponent({
  name: 'SavSidebar',
  props: {
    active: String,
    onNavigate: Function as PropType<(id: string) => void>,
    collapsed: Boolean,
    mobileOpen: Boolean,
    onCloseMobile: Function as PropType<() => void>,
    onLogout: Function as PropType<() => void>,
  },
  setup(props) {
    const navItem = (item: { id: string; label: string; icon: string; badge?: number }) => {
      const on = props.active === item.id;
      return h('button', {
        key: item.id, title: item.label,
        onClick: () => { props.onNavigate?.(item.id); props.onCloseMobile?.(); },
        style: {
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
          padding: props.collapsed ? '11px 0' : '11px 12px', justifyContent: props.collapsed ? 'center' : 'flex-start',
          borderRadius: '12px', position: 'relative',
          background: on ? 'var(--sav-primary-soft)' : 'transparent',
          color: on ? 'var(--sav-primary-dark)' : 'var(--sav-ink-2)',
          fontWeight: on ? 700 : 500, fontSize: '14px', transition: 'background 120ms ease, color 120ms ease',
        },
        onMouseenter: (e: MouseEvent) => { if (!on) (e.currentTarget as HTMLElement).style.background = 'var(--sav-surface-2)'; },
        onMouseleave: (e: MouseEvent) => { if (!on) (e.currentTarget as HTMLElement).style.background = 'transparent'; },
      }, [
        on ? h('span', { style: { position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '20px', borderRadius: '4px', background: 'var(--sav-primary)' } }) : null,
        h(Icon, { name: item.icon, size: 20, stroke: on ? 2 : 1.7 }),
        !props.collapsed ? h('span', { style: { flex: 1, textAlign: 'left' } }, item.label) : null,
        !props.collapsed && item.badge ? h('span', { style: { minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '999px', background: on ? 'var(--sav-primary)' : 'var(--sav-ink-4)', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, item.badge) : null,
      ]);
    };

    return () => {
      const { ADMIN_USER, LOGO_MARK } = savora;
      const width = props.collapsed ? 76 : 248;
      const labelStyle = { fontSize: '10.5px', fontWeight: 700, color: 'var(--sav-ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' };
      return [
        props.mobileOpen ? h('div', { onClick: props.onCloseMobile, class: 'sav-mobile-only', style: { position: 'fixed', inset: 0, background: 'rgba(31,20,16,0.4)', zIndex: 40, backdropFilter: 'blur(2px)' } }) : null,
        h('aside', { class: 'sav-sidebar' + (props.mobileOpen ? ' open' : ''), style: {
          width: `${width}px`, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
          background: 'var(--sav-surface)', borderRight: '1px solid var(--sav-border)',
          display: 'flex', flexDirection: 'column', padding: '18px 16px', gap: '4px', zIndex: 45,
          transition: 'width 200ms ease',
        } }, [
          // Brand
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: props.collapsed ? '4px 0 14px' : '4px 6px 16px', justifyContent: props.collapsed ? 'center' : 'flex-start' } }, [
            h('img', { src: LOGO_MARK, alt: 'Savora', width: 34, height: 30, style: { objectFit: 'contain', flexShrink: 0 } }),
            !props.collapsed ? h('div', {}, [
              h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--sav-ink)', lineHeight: 1 } }, 'Savora'),
              h('div', { style: { fontSize: '10.5px', color: 'var(--sav-ink-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' } }, 'Operations'),
            ]) : null,
          ]),

          !props.collapsed ? h('div', { style: { ...labelStyle, padding: '6px 12px 4px' } }, 'Manage') : null,
          h('nav', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } }, NAV.map(navItem)),

          !props.collapsed ? h('div', { style: { ...labelStyle, padding: '14px 12px 4px' } }, 'Insights') : null,
          props.collapsed ? h('div', { style: { height: '1px', background: 'var(--sav-border)', margin: '10px 8px' } }) : null,
          h('nav', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } }, NAV2.map(navItem)),

          h('div', { style: { flex: 1 } }),

          // Upsell card
          !props.collapsed ? h('div', { style: { borderRadius: '16px', padding: '14px', marginBottom: '10px', background: 'linear-gradient(150deg, #2A1B12 0%, #4a2c18 100%)', color: '#fff', position: 'relative', overflow: 'hidden' } }, [
            h('div', { style: { position: 'absolute', top: '-16px', right: '-10px', fontSize: '60px', opacity: 0.14 } }, '🔥'),
            h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '14px', position: 'relative' } }, 'Weekly digest ready'),
            h('div', { style: { fontSize: '12px', opacity: 0.78, marginTop: '4px', lineHeight: 1.4, position: 'relative' } }, 'Performance across all 48 kitchens.'),
            h('button', { style: { marginTop: '10px', background: 'var(--sav-primary)', color: '#fff', fontWeight: 700, fontSize: '12.5px', padding: '7px 12px', borderRadius: '9px', position: 'relative' } }, 'View report'),
          ]) : null,

          // User
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: props.collapsed ? 0 : '8px 6px', justifyContent: props.collapsed ? 'center' : 'flex-start', borderTop: '1px solid var(--sav-border)', paddingTop: '12px' } }, [
            h(Avatar, { src: ADMIN_USER.avatar, name: ADMIN_USER.name, size: 36 }),
            !props.collapsed ? [
              h('div', { style: { flex: 1, minWidth: 0 } }, [
                h('div', { style: { fontSize: '13px', fontWeight: 700, color: 'var(--sav-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, ADMIN_USER.name),
                h('div', { style: { fontSize: '11.5px', color: 'var(--sav-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, ADMIN_USER.role),
              ]),
              h('button', { onClick: props.onLogout, title: 'Log out', style: { color: 'var(--sav-ink-3)' } }, [h(Icon, { name: 'logout', size: 18 })]),
            ] : null,
          ]),
        ]),
      ];
    };
  },
});

export const Topbar = defineComponent({
  name: 'SavTopbar',
  props: {
    page: String,
    onToggleSidebar: Function as PropType<() => void>,
    onMobileMenu: Function as PropType<() => void>,
  },
  setup(props) {
    const q = ref('');
    return () => {
      const meta = PAGE_META[props.page || 'overview'] || PAGE_META.overview;
      return h('header', { class: 'sav-topbar', style: {
        position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 28px', background: 'rgba(255,247,242,0.82)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--sav-border)',
      } }, [
        h('button', { onClick: props.onMobileMenu, class: 'sav-mobile-only', style: { color: 'var(--sav-ink-2)' } }, [h(Icon, { name: 'menu', size: 22 })]),
        h('button', { onClick: props.onToggleSidebar, class: 'sav-desktop-only', style: { color: 'var(--sav-ink-3)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)' } }, [h(Icon, { name: 'menu', size: 18 })]),
        h('div', { style: { flex: 1, minWidth: 0 } }, [
          h('h1', { style: { margin: 0, fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '24px', letterSpacing: '-0.03em', color: 'var(--sav-ink)', lineHeight: 1.1 } }, meta.title),
          h('div', { class: 'sav-hide-sm', style: { fontSize: '13.5px', color: 'var(--sav-ink-3)', marginTop: '3px' } }, meta.sub),
        ]),
        h('div', { class: 'sav-hide-md' }, [h(SearchInput, { value: q.value, onChange: (v: string) => (q.value = v), placeholder: 'Search orders, kitchens, customers…', width: 300 })]),
        h('button', { class: 'sav-hide-sm', style: { display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 14px', borderRadius: '12px', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)', color: 'var(--sav-ink-2)', fontWeight: 600, fontSize: '13.5px', boxShadow: 'var(--sav-shadow-sm)' } }, [
          h(Icon, { name: 'calendar', size: 17, color: 'var(--sav-ink-3)' }), ' Today ',
          h(Icon, { name: 'caret', size: 15, color: 'var(--sav-ink-3)' }),
        ]),
        h(IconButton, { name: 'bell', badge: 3 }),
      ]);
    };
  },
});
