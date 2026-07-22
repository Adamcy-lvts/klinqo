// data.ts — Mira's Delight kitchen console data (mock).
// Ported from kitchen-data.jsx. The self-contained console renders on this
// bundled mock data, mirroring the platform Operations Console; real
// tenant-scoped data can be wired in via props in a later phase.

export const naira = (n: number | string): string =>
  '₦' + Number(n).toLocaleString('en-NG');

// ── The kitchen (single tenant) ──────────────────────────────
export const KITCHEN = {
  name: "Mira's Delight",
  initial: 'M',
  brandColor: 'linear-gradient(140deg,#1F8A5B,#16704A)',
  code: 'MIRAS01',
  status: 'active', // active / pending / suspended
  area: 'Ikoyi, Lagos',
  rating: 4.8,
  reviewCount: 142,
  storefront: 'savora.africa/m/miras-delight',
  tagline: 'Home-style Nigerian classics, cooked fresh to order.',
  owner: {
    name: 'Mira Okonkwo',
    role: "Owner · Mira's Delight",
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80',
  },
};

export type Kpi = {
  id: string; label: string; value: string; hint: string;
  spark: number[]; dir: 'up' | 'down'; delta: number; flat?: boolean;
};

// ── Dashboard KPIs (today) ───────────────────────────────────
export const KPIS: Kpi[] = [
  { id: 'orders',  label: 'Orders today',      value: '38',       hint: '5 still pending',     spark: [4,6,5,8,7,10,9,12,11,14,16,15,18,20], dir: 'up', delta: 14 },
  { id: 'revenue', label: 'Revenue today',     value: '₦284,500', hint: 'paid · 11 to settle', spark: [10,14,12,20,18,26,24,34,30,40,44,42,52,60], dir: 'up', delta: 9 },
  { id: 'pending', label: 'Pending orders',    value: '5',        hint: '2 placed · 3 prep',   spark: [2,3,2,4,3,5,4,6,5,4,6,5,4,5], dir: 'up', delta: 0, flat: true },
  { id: 'menu',    label: 'Active menu items', value: '14',       hint: '2 unavailable',       spark: [12,12,13,13,14,14,14,14,14,14,14,14,14,14], dir: 'up', delta: 0, flat: true },
];

// ── Order lifecycle ──────────────────────────────────────────
// placed → confirmed → preparing → ready → delivering → delivered (or cancelled)
export type FlowStep = { to: string; label: string; icon: string; deliveryOnly?: boolean; pickupOnly?: boolean };
export const ORDER_FLOW: Record<string, { cancellable: boolean; next: FlowStep[] }> = {
  placed:     { cancellable: true,  next: [{ to: 'confirmed',  label: 'Confirm order',    icon: 'check' }] },
  confirmed:  { cancellable: true,  next: [{ to: 'preparing',  label: 'Start preparing',  icon: 'flame' }] },
  preparing:  { cancellable: true,  next: [{ to: 'ready',      label: 'Mark ready',       icon: 'check-circle' }] },
  ready:      { cancellable: true,  next: [
                  { to: 'delivering', label: 'Out for delivery', icon: 'truck', deliveryOnly: true },
                  { to: 'delivered',  label: 'Mark picked up',   icon: 'check-circle', pickupOnly: true },
                ] },
  delivering: { cancellable: false, next: [{ to: 'delivered',  label: 'Mark delivered',   icon: 'check-circle' }] },
  delivered:  { cancellable: false, next: [] },
  cancelled:  { cancellable: false, next: [] },
};
export const STATUS_SEQUENCE = ['placed', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

export type OrderItem = { qty: number; name: string; price: number };
export type Order = {
  id: string; customer: string; phone: string; area: string; address: string;
  status: string; payStatus: string; payMethod: string; deliveryType: string;
  time: string; note: string; items: OrderItem[];
  deliveryFee?: number; subtotal: number; total: number;
};

const mkOrder = (o: Omit<Order, 'subtotal' | 'total'> & { deliveryFee?: number }): Order => {
  const subtotal = o.items.reduce((s, it) => s + it.qty * it.price, 0);
  const deliveryFee = o.deliveryType === 'pickup' ? 0 : (o.deliveryFee ?? 600);

  return { ...o, subtotal, deliveryFee, total: subtotal + deliveryFee };
};

// ── Live / recent orders ─────────────────────────────────────
export const ORDERS: Order[] = [
  { id: '1052', customer: 'Tomi Adeyemi',  phone: '0803 412 7780', area: 'Ikoyi',           address: '14 Bourdillon Rd, Ikoyi',         status: 'placed',     payStatus: 'pending',  payMethod: 'pay-on-delivery', deliveryType: 'delivery', time: '1 min ago',  note: 'Extra pepper, please. Call on arrival.', items: [{ qty: 1, name: 'Smoky Jollof Rice', price: 3500 }, { qty: 1, name: 'Peppered Chicken', price: 4500 }] },
  { id: '1051', customer: 'Chidi Okeke',   phone: '0701 559 2034', area: 'Lekki Phase 1',   address: '7 Admiralty Way, Lekki',          status: 'placed',     payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '3 min ago',  note: '', items: [{ qty: 2, name: 'Egusi Soup & Pounded Yam', price: 4800 }] },
  { id: '1050', customer: 'Aisha Bello',   phone: '0809 233 1190', area: 'Ikoyi',           address: 'Counter pickup',                  status: 'confirmed',  payStatus: 'paid',     payMethod: 'online',          deliveryType: 'pickup',   time: '6 min ago',  note: 'Pickup around 1pm.', items: [{ qty: 1, name: 'Suya Platter', price: 6000 }, { qty: 1, name: 'Chapman', price: 1500 }] },
  { id: '1049', customer: 'Femi Olawale',  phone: '0814 770 5521', area: 'Victoria Island', address: '22 Adeola Odeku St, VI',           status: 'preparing',  payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '9 min ago',  note: '', items: [{ qty: 1, name: 'Seafood Okra', price: 5500 }, { qty: 1, name: 'Ofada Rice & Ayamase', price: 4500 }] },
  { id: '1048', customer: 'Zainab Yusuf',  phone: '0806 318 9942', area: 'Ikoyi',           address: '5 Glover Rd, Ikoyi',              status: 'preparing',  payStatus: 'pending',  payMethod: 'pay-on-delivery', deliveryType: 'delivery', time: '12 min ago', note: 'Ring the doorbell twice.', items: [{ qty: 3, name: 'Puff Puff (12 pcs)', price: 2000 }, { qty: 1, name: 'Zobo', price: 1200 }] },
  { id: '1047', customer: 'Kunle Bakare',  phone: '0802 661 4408', area: 'Yaba',            address: '18 Herbert Macaulay, Yaba',       status: 'preparing',  payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '14 min ago', note: '', items: [{ qty: 1, name: 'Grilled Tilapia', price: 6800 }] },
  { id: '1046', customer: 'Ngozi Eze',     phone: '0708 124 7763', area: 'Ikoyi',           address: 'Counter pickup',                  status: 'ready',      payStatus: 'paid',     payMethod: 'pay-on-pickup',   deliveryType: 'pickup',   time: '17 min ago', note: '', items: [{ qty: 1, name: 'Fried Rice & Chicken', price: 4200 }, { qty: 1, name: 'Chapman', price: 1500 }] },
  { id: '1045', customer: 'Seyi Adewale',  phone: '0813 905 2218', area: 'Gbagada',         address: '40 Diya St, Gbagada',             status: 'ready',      payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '20 min ago', note: '', items: [{ qty: 2, name: 'Afang Soup & Eba', price: 4200 }] },
  { id: '1044', customer: 'David Okon',    phone: '0805 447 1092', area: 'Surulere',        address: '9 Adeniran Ogunsanya, Surulere',  status: 'delivering', payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '24 min ago', note: '', items: [{ qty: 1, name: 'Suya Platter', price: 6000 }, { qty: 1, name: 'Spring Rolls & Samosa', price: 3000 }] },
  { id: '1043', customer: 'Funke Akin',    phone: '0807 332 6650', area: 'Ikoyi',           address: '2 Kingsway Rd, Ikoyi',            status: 'delivering', payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '28 min ago', note: 'Leave with the gateman.', items: [{ qty: 1, name: 'Coconut Rice', price: 3800 }, { qty: 1, name: 'Zobo', price: 1200 }] },
  { id: '1042', customer: 'Halima Sani',   phone: '0815 228 7741', area: 'Lekki Phase 1',   address: '11 Fola Osibo, Lekki',            status: 'delivered',  payStatus: 'paid',     payMethod: 'online',          deliveryType: 'delivery', time: '35 min ago', note: '', items: [{ qty: 2, name: 'Smoky Jollof Rice', price: 3500 }, { qty: 1, name: 'Peppered Chicken', price: 4500 }] },
  { id: '1041', customer: 'Tunde Bello',   phone: '0803 119 4486', area: 'Ikoyi',           address: 'Counter pickup',                  status: 'delivered',  payStatus: 'paid',     payMethod: 'pay-on-pickup',   deliveryType: 'pickup',   time: '42 min ago', note: '', items: [{ qty: 1, name: 'Egusi Soup & Pounded Yam', price: 4800 }] },
  { id: '1040', customer: 'Bisi Lawal',    phone: '0810 552 0037', area: 'Ikeja',           address: '6 Allen Ave, Ikeja',              status: 'cancelled',  payStatus: 'refunded', payMethod: 'online',          deliveryType: 'delivery', time: '50 min ago', note: 'Item unavailable — cancelled & refunded.', items: [{ qty: 1, name: 'Asun (Spicy Goat)', price: 5200 }] },
].map(mkOrder);

// New order that "arrives" live on the Orders feed
export const INCOMING_ORDER: Order = mkOrder({
  id: '1053', customer: 'Adaeze Nwankwo', phone: '0802 770 1188', area: 'Ikoyi', address: '8 Alexander Ave, Ikoyi',
  status: 'placed', payStatus: 'paid', payMethod: 'online', deliveryType: 'delivery', time: 'just now',
  note: 'No onions in the jollof.', items: [{ qty: 1, name: 'Smoky Jollof Rice', price: 3500 }, { qty: 1, name: 'Grilled Tilapia', price: 6800 }, { qty: 1, name: 'Chapman', price: 1500 }],
});

// ── Menu ─────────────────────────────────────────────────────
export type MenuItem = { id: string; name: string; desc: string; price: number; available: boolean; popular: boolean };
export type Category = { id: string; name: string; emoji: string; active: boolean; items: MenuItem[] };
export const MENU: Category[] = [
  { id: 'cat1', name: 'Rice & Grains', emoji: '🍚', active: true, items: [
    { id: 'm1', name: 'Smoky Jollof Rice',     desc: 'Party-style jollof with smoky finish & fried plantain', price: 3500, available: true,  popular: true },
    { id: 'm2', name: 'Fried Rice & Chicken',  desc: 'Mixed-veg fried rice with grilled chicken quarter',     price: 4200, available: true,  popular: false },
    { id: 'm3', name: 'Coconut Rice',          desc: 'Fragrant coconut rice with peppered sauce',             price: 3800, available: true,  popular: false },
    { id: 'm4', name: 'Ofada Rice & Ayamase',  desc: 'Local ofada rice with spicy green pepper sauce',        price: 4500, available: true,  popular: true },
  ] },
  { id: 'cat2', name: 'Soups & Swallow', emoji: '🍲', active: true, items: [
    { id: 'm5', name: 'Egusi Soup & Pounded Yam', desc: 'Melon-seed soup, assorted meat, smooth pounded yam', price: 4800, available: true, popular: true },
    { id: 'm6', name: 'Afang Soup & Eba',         desc: 'Afang leaf & waterleaf soup with eba',                price: 4200, available: true, popular: false },
    { id: 'm7', name: 'Seafood Okra',             desc: 'Okra with prawns, fish & periwinkle',                 price: 5500, available: true, popular: false },
  ] },
  { id: 'cat3', name: 'Grills', emoji: '🔥', active: true, items: [
    { id: 'm8',  name: 'Suya Platter',        desc: 'Beef suya with onions, tomato & yaji spice',     price: 6000, available: true,  popular: true },
    { id: 'm9',  name: 'Peppered Chicken',    desc: 'Grilled chicken in clay-pot pepper sauce',       price: 4500, available: true,  popular: false },
    { id: 'm10', name: 'Grilled Tilapia',     desc: 'Whole tilapia, charred, with pepper dip',        price: 6800, available: true,  popular: false },
    { id: 'm11', name: 'Asun (Spicy Goat)',   desc: 'Peppered grilled goat meat',                     price: 5200, available: false, popular: false },
  ] },
  { id: 'cat4', name: 'Small Chops', emoji: '🍢', active: true, items: [
    { id: 'm12', name: 'Puff Puff (12 pcs)',     desc: 'Golden fried dough balls, lightly sweet',     price: 2000, available: true, popular: false },
    { id: 'm13', name: 'Spring Rolls & Samosa',  desc: '6 pieces, mixed, with chilli dip',            price: 3000, available: true, popular: true },
  ] },
  { id: 'cat5', name: 'Drinks', emoji: '🥤', active: true, items: [
    { id: 'm14', name: 'Chapman',                desc: 'Classic Nigerian fruit punch mocktail',       price: 1500, available: true,  popular: false },
    { id: 'm15', name: 'Zobo',                   desc: 'Chilled hibiscus drink with ginger',          price: 1200, available: true,  popular: false },
    { id: 'm16', name: 'Fresh Pineapple Juice',  desc: 'Cold-pressed, no added sugar',                price: 1800, available: false, popular: false },
  ] },
];
export const EMOJIS = ['🍚', '🍲', '🔥', '🍢', '🥤', '🍛', '🍗', '🥗', '🍰', '🍤', '🌶️', '🥘'];

// ── Delivery methods ─────────────────────────────────────────
export type DeliveryMethod = { id: string; name: string; desc: string; fee: number; active: boolean };
export const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'd1', name: 'Pickup',             desc: 'Customer collects from your counter',       fee: 0,    active: true },
  { id: 'd2', name: 'Standard delivery',  desc: 'Rider drop-off within 45–60 min',           fee: 600,  active: true },
  { id: 'd3', name: 'Express delivery',   desc: 'Priority rider, under 30 min (Ikoyi only)', fee: 1200, active: true },
  { id: 'd4', name: 'Scheduled delivery', desc: 'Pick a future time slot at checkout',       fee: 800,  active: false },
];

// ── Customers (this kitchen only) ────────────────────────────
export type Customer = { id: string; name: string; phone: string; email: string; avatar: string; orders: number; spendRaw: number; tier: string; last: string };
export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Tomi Adeyemi',  phone: '0803 412 7780', email: 'tomi.a@gmail.com',   avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80', orders: 18, spendRaw: 142800, tier: 'VIP',     last: '1 min ago' },
  { id: 'c2', name: 'Halima Sani',   phone: '0815 228 7741', email: 'halima.s@gmail.com', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80', orders: 12, spendRaw: 98400,  tier: 'VIP',     last: '35 min ago' },
  { id: 'c3', name: 'Femi Olawale',  phone: '0814 770 5521', email: 'femi.o@outlook.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80', orders: 9,  spendRaw: 76200,  tier: 'Regular', last: '9 min ago' },
  { id: 'c4', name: 'Aisha Bello',   phone: '0809 233 1190', email: 'aisha.b@gmail.com',  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80', orders: 8,  spendRaw: 61500,  tier: 'Regular', last: '6 min ago' },
  { id: 'c5', name: 'David Okon',    phone: '0805 447 1092', email: 'david.o@gmail.com',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80', orders: 7,  spendRaw: 54000,  tier: 'Regular', last: '24 min ago' },
  { id: 'c6', name: 'Zainab Yusuf',  phone: '0806 318 9942', email: 'zainab.y@gmail.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80', orders: 5,  spendRaw: 38900,  tier: 'Regular', last: '12 min ago' },
  { id: 'c7', name: 'Kunle Bakare',  phone: '0802 661 4408', email: 'kunle.b@yahoo.com',  avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80', orders: 4,  spendRaw: 29600,  tier: 'New',     last: '14 min ago' },
  { id: 'c8', name: 'Ngozi Eze',     phone: '0708 124 7763', email: 'ngozi.e@gmail.com',  avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&q=80', orders: 3,  spendRaw: 19200,  tier: 'New',     last: '17 min ago' },
];

export type CustomerOrder = { id: string; status: string; payStatus: string; totalRaw: number; date: string };
export const CUSTOMER_ORDERS: Record<string, CustomerOrder[]> = {
  c1: [
    { id: '1052', status: 'placed',    payStatus: 'pending',  totalRaw: 8600,  date: 'Jun 16' },
    { id: '1019', status: 'delivered', payStatus: 'paid',     totalRaw: 11200, date: 'Jun 12' },
    { id: '0994', status: 'delivered', payStatus: 'paid',     totalRaw: 7400,  date: 'Jun 08' },
    { id: '0971', status: 'delivered', payStatus: 'paid',     totalRaw: 9600,  date: 'Jun 03' },
    { id: '0940', status: 'cancelled', payStatus: 'refunded', totalRaw: 4200,  date: 'May 28' },
  ],
};

// ── Reviews ──────────────────────────────────────────────────
export type Review = { id: string; rating: number; customer: string; order: string; date: string; hidden: boolean; text: string };
export const REVIEWS: Review[] = [
  { id: 'r1', rating: 5, customer: 'Tomi Adeyemi', order: '1042', date: '2 days ago',  hidden: false, text: 'Best jollof in Lagos — came hot and packed beautifully. The plantain was perfect.' },
  { id: 'r2', rating: 5, customer: 'Aisha Bello',  order: '1031', date: '3 days ago',  hidden: false, text: 'The suya platter is unreal. Generous portion and the yaji spice is on point. Ordering again.' },
  { id: 'r3', rating: 4, customer: 'Femi Olawale', order: '1024', date: '5 days ago',  hidden: false, text: 'Great food and well seasoned. Delivery was a little slow during the lunch rush.' },
  { id: 'r4', rating: 5, customer: 'David Okon',   order: '1018', date: '1 week ago',  hidden: false, text: 'Loved the egusi — proper home cooking. Pounded yam was smooth.' },
  { id: 'r5', rating: 2, customer: 'Bisi Lawal',   order: '1009', date: '1 week ago',  hidden: true,  text: 'Order arrived cold and the soup was light on meat. Disappointed this time.' },
  { id: 'r6', rating: 5, customer: 'Halima Sani',  order: '1002', date: '2 weeks ago', hidden: false, text: 'My go-to kitchen. Consistent, tasty, and always on time. Highly recommend.' },
];

// ── Reports ──────────────────────────────────────────────────
export type RevenuePoint = { day: string; revenue: number; orders: number };
export const REVENUE_SERIES: RevenuePoint[] = [
  { day: 'Jun 03', revenue: 198, orders: 31 },
  { day: 'Jun 04', revenue: 214, orders: 34 },
  { day: 'Jun 05', revenue: 256, orders: 41 },
  { day: 'Jun 06', revenue: 288, orders: 45 },
  { day: 'Jun 07', revenue: 312, orders: 48 },
  { day: 'Jun 08', revenue: 241, orders: 38 },
  { day: 'Jun 09', revenue: 205, orders: 32 },
  { day: 'Jun 10', revenue: 228, orders: 36 },
  { day: 'Jun 11', revenue: 262, orders: 42 },
  { day: 'Jun 12', revenue: 295, orders: 46 },
  { day: 'Jun 13', revenue: 318, orders: 49 },
  { day: 'Jun 14', revenue: 274, orders: 43 },
  { day: 'Jun 15', revenue: 248, orders: 39 },
  { day: 'Jun 16', revenue: 285, orders: 38 },
];

export type TopItem = { name: string; qty: number; revRaw: number };
export const TOP_ITEMS: TopItem[] = [
  { name: 'Smoky Jollof Rice',        qty: 412, revRaw: 1442000 },
  { name: 'Suya Platter',             qty: 286, revRaw: 1716000 },
  { name: 'Egusi Soup & Pounded Yam', qty: 241, revRaw: 1156800 },
  { name: 'Peppered Chicken',         qty: 198, revRaw: 891000 },
  { name: 'Fried Rice & Chicken',     qty: 176, revRaw: 739200 },
  { name: 'Ofada Rice & Ayamase',     qty: 154, revRaw: 693000 },
  { name: 'Grilled Tilapia',          qty: 132, revRaw: 897600 },
  { name: 'Chapman',                  qty: 121, revRaw: 181500 },
  { name: 'Afang Soup & Eba',         qty: 98,  revRaw: 411600 },
  { name: 'Spring Rolls & Samosa',    qty: 87,  revRaw: 261000 },
];

// ── Settings ─────────────────────────────────────────────────
export type DayHours = { day: string; open: string; close: string; closed: boolean };
export const SETTINGS = {
  profile: { name: "Mira's Delight", tagline: 'Home-style Nigerian classics, cooked fresh to order.', description: 'Family-run kitchen in Ikoyi serving Lagos favourites — jollof, egusi, suya and more. Everything made to order with fresh ingredients.', phone: '0803 412 0000', email: 'hello@mirasdelight.ng', address: '14 Bourdillon Road, Ikoyi', areaName: 'Ikoyi' },
  prep: { min: 20, max: 40 },
  channels: { online: true, onDelivery: true, onPickup: false },
  hours: [
    { day: 'Monday',    open: '10:00', close: '21:00', closed: false },
    { day: 'Tuesday',   open: '10:00', close: '21:00', closed: false },
    { day: 'Wednesday', open: '10:00', close: '21:00', closed: false },
    { day: 'Thursday',  open: '10:00', close: '21:00', closed: false },
    { day: 'Friday',    open: '10:00', close: '22:00', closed: false },
    { day: 'Saturday',  open: '11:00', close: '22:00', closed: false },
    { day: 'Sunday',    open: '12:00', close: '20:00', closed: true  },
  ] as DayHours[],
  cuisines: ['Nigerian', 'West African', 'Grills', 'Rice dishes', 'Soups'],
};
export const ALL_CUISINES = ['Nigerian', 'West African', 'Grills', 'Rice dishes', 'Soups', 'Pastries', 'Seafood', 'Vegetarian', 'Continental', 'Chinese', 'Desserts', 'Drinks'];

export const PAY_METHOD_LABEL: Record<string, string> = {
  'online': 'Online', 'pay-on-delivery': 'Pay on delivery', 'pay-on-pickup': 'Pay on pickup',
};
