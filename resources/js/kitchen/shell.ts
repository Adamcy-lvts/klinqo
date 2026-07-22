// shell.ts — kitchen sidebar (own brand) + breadcrumb topbar.
// Ported from kitchen-shell.jsx. The green accent comes from the CSS-var
// override applied on the console root (see KitchenConsole.ts).
import { defineComponent, h  } from 'vue';
import type {PropType} from 'vue';
import Icon from '@/savora/Icon';
import { Avatar, IconButton } from '@/savora/ui';
import { KITCHEN } from './data';
import { KitchenMark } from './ui';

const K_NAV = [
  { id: 'dashboard', label: 'Dashboard',        icon: 'grid' },
  { id: 'orders',    label: 'Orders',           icon: 'receipt' },
  { id: 'menu',      label: 'Menu',             icon: 'store' },
  { id: 'delivery',  label: 'Delivery methods', icon: 'truck' },
  { id: 'customers', label: 'Customers',        icon: 'users' },
  { id: 'reviews',   label: 'Reviews',          icon: 'star' },
  { id: 'reports',   label: 'Reports',          icon: 'chart' },
];
const K_NAV2 = [{ id: 'settings', label: 'Settings', icon: 'gear' }];

export const K_PAGE_META: Record<string, string> = {
  dashboard: 'Dashboard', orders: 'Orders', menu: 'Menu', delivery: 'Delivery methods',
  customers: 'Customers', reviews: 'Reviews', reports: 'Reports', settings: 'Settings',
};

export const KSidebar = defineComponent({
  name: 'KSidebar',
  props: {
    active: String,
    onNavigate: Function as PropType<(id: string) => void>,
    collapsed: Boolean,
    mobileOpen: Boolean,
    liveCount: { type: Number, default: 0 },
    onCloseMobile: Function as PropType<() => void>,
    onLogout: Function as PropType<() => void>,
  },
  setup(props) {
    const navItem = (item: { id: string; label: string; icon: string }) => {
      const on = props.active === item.id;
      const badge = item.id === 'orders' ? props.liveCount : 0;

      return h('button', {
        key: item.id, title: item.label,
        onClick: () => {
 props.onNavigate?.(item.id); props.onCloseMobile?.(); 
},
        style: {
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
          padding: props.collapsed ? '11px 0' : '11px 12px', justifyContent: props.collapsed ? 'center' : 'flex-start',
          borderRadius: '12px', position: 'relative',
          background: on ? 'var(--sav-primary-soft)' : 'transparent',
          color: on ? 'var(--sav-primary-dark)' : 'var(--sav-ink-2)',
          fontWeight: on ? 700 : 500, fontSize: '14px', transition: 'background 120ms ease, color 120ms ease',
        },
        onMouseenter: (e: MouseEvent) => {
 if (!on) {
(e.currentTarget as HTMLElement).style.background = 'var(--sav-surface-2)';
} 
},
        onMouseleave: (e: MouseEvent) => {
 if (!on) {
(e.currentTarget as HTMLElement).style.background = 'transparent';
} 
},
      }, [
        on ? h('span', { style: { position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '20px', borderRadius: '4px', background: 'var(--sav-primary)' } }) : null,
        h(Icon, { name: item.icon, size: 20, stroke: on ? 2 : 1.7 }),
        !props.collapsed ? h('span', { style: { flex: 1, textAlign: 'left' } }, item.label) : null,
        !props.collapsed && badge > 0 ? h('span', { style: { minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '999px', background: on ? 'var(--sav-primary)' : 'var(--sav-ink-4)', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, badge) : null,
      ]);
    };

    return () => {
      const width = props.collapsed ? 76 : 248;
      const labelStyle = { fontSize: '10.5px', fontWeight: 700, color: 'var(--sav-ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' };

      return [
        props.mobileOpen ? h('div', { onClick: props.onCloseMobile, class: 'sav-mobile-only', style: { position: 'fixed', inset: 0, background: 'rgba(31,20,16,0.4)', zIndex: 40, backdropFilter: 'blur(2px)' } }) : null,
        h('aside', { class: 'sav-sidebar' + (props.mobileOpen ? ' open' : ''), style: {
          width: `${width}px`, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
          background: 'var(--sav-surface)', borderRight: '1px solid var(--sav-border)',
          display: 'flex', flexDirection: 'column', padding: '18px 16px', gap: '4px', zIndex: 45, transition: 'width 200ms ease',
        } }, [
          // Kitchen brand
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: props.collapsed ? '4px 0 14px' : '4px 6px 16px', justifyContent: props.collapsed ? 'center' : 'flex-start' } }, [
            h(KitchenMark, { size: 36, radius: 11 }),
            !props.collapsed ? h('div', { style: { minWidth: 0 } }, [
              h('div', { style: { fontSize: '9.5px', color: 'var(--sav-primary-dark)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' } }, 'Kitchen'),
              h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--sav-ink)', lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, KITCHEN.name),
            ]) : null,
          ]),

          !props.collapsed ? h('div', { style: { ...labelStyle, padding: '6px 12px 4px' } }, 'Operate') : null,
          h('nav', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } }, K_NAV.map(navItem)),

          !props.collapsed ? h('div', { style: { ...labelStyle, padding: '14px 12px 4px' } }, 'Account') : null,
          props.collapsed ? h('div', { style: { height: '1px', background: 'var(--sav-border)', margin: '10px 8px' } }) : null,
          h('nav', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } }, K_NAV2.map(navItem)),

          h('div', { style: { flex: 1 } }),

          // Storefront card
          !props.collapsed ? h('div', { style: { borderRadius: '16px', padding: '14px', marginBottom: '10px', background: 'linear-gradient(150deg,#16704A 0%,#1F8A5B 100%)', color: '#fff', position: 'relative', overflow: 'hidden' } }, [
            h('div', { style: { position: 'absolute', top: '-14px', right: '-8px', fontSize: '56px', opacity: 0.16 } }, '🍲'),
            h('div', { style: { fontFamily: 'var(--sav-display)', fontWeight: 700, fontSize: '14px', position: 'relative' } }, 'Your storefront is live'),
            h('div', { style: { fontSize: '12px', opacity: 0.82, marginTop: '4px', lineHeight: 1.4, position: 'relative' } }, 'Share your link to take more orders.'),
            h('button', { style: { marginTop: '10px', background: '#fff', color: 'var(--sav-primary-dark)', fontWeight: 700, fontSize: '12.5px', padding: '7px 12px', borderRadius: '9px', position: 'relative' } }, 'Share link'),
          ]) : null,

          // Owner
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: props.collapsed ? 0 : '8px 6px', justifyContent: props.collapsed ? 'center' : 'flex-start', borderTop: '1px solid var(--sav-border)', paddingTop: '12px' } }, [
            h(Avatar, { src: KITCHEN.owner.avatar, name: KITCHEN.owner.name, size: 36 }),
            !props.collapsed ? [
              h('div', { style: { flex: 1, minWidth: 0 } }, [
                h('div', { style: { fontSize: '13px', fontWeight: 700, color: 'var(--sav-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, KITCHEN.owner.name),
                h('div', { style: { fontSize: '11.5px', color: 'var(--sav-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, 'Owner'),
              ]),
              h('button', { onClick: props.onLogout, title: 'Log out', style: { color: 'var(--sav-ink-3)' } }, [h(Icon, { name: 'logout', size: 18 })]),
            ] : null,
          ]),
        ]),
      ];
    };
  },
});

export const KTopbar = defineComponent({
  name: 'KTopbar',
  props: {
    page: String,
    crumbs: Array as PropType<string[]>,
    onToggleSidebar: Function as PropType<() => void>,
    onMobileMenu: Function as PropType<() => void>,
  },
  setup(props) {
    const breadcrumb = (crumbs: string[]) => h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: 'var(--sav-ink-3)', fontWeight: 600 } },
      crumbs.flatMap((c, i) => [
        i > 0 ? h(Icon, { key: 'sep' + i, name: 'chevron', size: 12, color: 'var(--sav-ink-4)' }) : null,
        h('span', { key: 'c' + i, style: { color: i === crumbs.length - 1 ? 'var(--sav-ink-2)' : 'var(--sav-ink-3)' } }, c),
      ]));

    return () => {
      const title = K_PAGE_META[props.page || 'dashboard'] || 'Dashboard';
      const crumbs = props.crumbs && props.crumbs.length ? props.crumbs : ['Dashboard', title];

      return h('header', { style: {
        position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 28px', background: 'rgba(255,247,242,0.82)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--sav-border)',
      } }, [
        h('button', { onClick: props.onMobileMenu, class: 'sav-mobile-only', style: { color: 'var(--sav-ink-2)' } }, [h(Icon, { name: 'menu', size: 22 })]),
        h('button', { onClick: props.onToggleSidebar, class: 'sav-desktop-only', style: { color: 'var(--sav-ink-3)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)' } }, [h(Icon, { name: 'menu', size: 18 })]),
        h('div', { style: { flex: 1, minWidth: 0 } }, [
          breadcrumb(crumbs),
          h('h1', { style: { margin: '3px 0 0', fontFamily: 'var(--sav-display)', fontWeight: 800, fontSize: '23px', letterSpacing: '-0.03em', color: 'var(--sav-ink)', lineHeight: 1.1 } }, title),
        ]),
        h('button', { class: 'sav-hide-md', style: { display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 14px', borderRadius: '12px', border: '1px solid var(--sav-border)', background: 'var(--sav-surface)', color: 'var(--sav-ink-2)', fontWeight: 600, fontSize: '13.5px', boxShadow: 'var(--sav-shadow-sm)' } }, [
          h(Icon, { name: 'arrow-ur', size: 16, color: 'var(--sav-primary-dark)' }), ' View storefront',
        ]),
        h(IconButton, { name: 'bell', badge: 2 }),
      ]);
    };
  },
});
