// data.ts — Savora platform operations data (mock, ported from the design bundle)
// Backend wiring replaces these with Inertia props in a later phase.

const asset = (id: string, ext = 'jpg') => `/savora/${id}.${ext}`;

export const ADMIN_USER = {
  name: 'Adaeze Okafor',
  role: 'Platform Operations',
  email: 'adaeze@savora.africa',
  avatar: asset('avAdaeze'),
};

export const LOGO_MARK = asset('mark', 'png');

export const KPIS = [
  { id: 'gmv',      label: 'Gross merchandise value', value: '₦4.82M', raw: 4820000, delta: 12.4, dir: 'up',   spark: [38,42,40,48,46,55,52,60,58,66,63,72,70,79], hint: 'vs ₦4.29M yesterday' },
  { id: 'orders',   label: 'Orders today',            value: '1,284',  raw: 1284,    delta: 8.1,  dir: 'up',   spark: [60,64,58,70,66,74,72,80,76,84,82,90,88,96], hint: 'vs 1,188 yesterday' },
  { id: 'kitchens', label: 'Active kitchens',         value: '48',     raw: 48,      delta: 3,    dir: 'up',   unit: 'count', spark: [40,41,42,42,43,44,44,45,45,46,47,47,48,48], hint: '3 onboarded this week' },
  { id: 'aov',      label: 'Avg. order value',        value: '₦3,754', raw: 3754,    delta: 2.3,  dir: 'down', spark: [52,50,48,46,47,45,44,43,42,41,40,39,38,37], hint: 'vs ₦3,842 yesterday' },
];

export const SECONDARY = [
  { id: 'fulfil',  label: 'Fulfilment rate', value: '96.4%',  delta: 0.6,  dir: 'up' },
  { id: 'deliver', label: 'Avg. delivery',   value: '28 min', delta: 2,    dir: 'down', good: 'down' },
  { id: 'newcust', label: 'New customers',   value: '312',    delta: 18.2, dir: 'up' },
  { id: 'refunds', label: 'Refund rate',     value: '1.2%',   delta: 0.3,  dir: 'down', good: 'down' },
];

export const REVENUE_SERIES = [
  { day: 'Jun 02', gmv: 3.62, orders: 968 },
  { day: 'Jun 03', gmv: 3.41, orders: 902 },
  { day: 'Jun 04', gmv: 3.88, orders: 1024 },
  { day: 'Jun 05', gmv: 4.12, orders: 1098 },
  { day: 'Jun 06', gmv: 4.55, orders: 1186 },
  { day: 'Jun 07', gmv: 5.02, orders: 1304 },
  { day: 'Jun 08', gmv: 4.74, orders: 1242 },
  { day: 'Jun 09', gmv: 3.96, orders: 1041 },
  { day: 'Jun 10', gmv: 4.18, orders: 1110 },
  { day: 'Jun 11', gmv: 4.46, orders: 1172 },
  { day: 'Jun 12', gmv: 4.91, orders: 1268 },
  { day: 'Jun 13', gmv: 5.34, orders: 1390 },
  { day: 'Jun 14', gmv: 5.08, orders: 1322 },
  { day: 'Jun 15', gmv: 4.82, orders: 1284 },
];

export const CATEGORY_MIX = [
  { label: 'Rice & Grains',   value: 34, color: '#FF6B35' },
  { label: 'Soups & Swallow', value: 22, color: '#E0A100' },
  { label: 'Grills',          value: 18, color: '#D64545' },
  { label: 'Small Chops',     value: 14, color: '#1F8A5B' },
  { label: 'Drinks',          value: 12, color: '#8A6FD6' },
];

export const HOURLY = [
  { h: '8a', v: 18 }, { h: '9a', v: 26 }, { h: '10a', v: 31 }, { h: '11a', v: 44 },
  { h: '12p', v: 78 }, { h: '1p', v: 92 }, { h: '2p', v: 71 }, { h: '3p', v: 49 },
  { h: '4p', v: 38 }, { h: '5p', v: 52 }, { h: '6p', v: 81 }, { h: '7p', v: 96 },
  { h: '8p', v: 74 }, { h: '9p', v: 41 },
];

export const KITCHENS = [
  { id: 'k1', name: "Mira's Delight",  code: 'MIRAS01', area: 'Ikoyi',           initial: 'M', color: 'linear-gradient(135deg,#FF6B35,#F7931E)', rating: 4.8, orders: 1247, gmv: '₦8.4M', gmvRaw: 8.4, status: 'active',  commission: 18, joined: 'Jan 2025', payout: '₦1.21M' },
  { id: 'k2', name: 'Bún Coffee Co.',  code: 'BUN001',  area: 'Victoria Island', initial: 'B', color: 'linear-gradient(135deg,#6F4E37,#3E2723)', rating: 4.7, orders: 612,  gmv: '₦3.1M', gmvRaw: 3.1, status: 'active',  commission: 16, joined: 'Feb 2025', payout: '₦486K' },
  { id: 'k3', name: 'Lagos Bowls',     code: 'LAGB02',  area: 'Lekki Phase 1',   initial: 'L', color: 'linear-gradient(135deg,#2D7A4F,#1F5D3B)', rating: 4.6, orders: 384,  gmv: '₦2.2M', gmvRaw: 2.2, status: 'active',  commission: 18, joined: 'Mar 2025', payout: '₦352K' },
  { id: 'k4', name: 'Wokstar',         code: 'WOKS03',  area: 'Ikeja',           initial: 'W', color: 'linear-gradient(135deg,#C2185B,#6A1B4A)', rating: 4.5, orders: 521,  gmv: '₦2.8M', gmvRaw: 2.8, status: 'active',  commission: 17, joined: 'Mar 2025', payout: '₦441K' },
  { id: 'k5', name: 'Firepit Grill',   code: 'FIRE04',  area: 'Yaba',            initial: 'F', color: 'linear-gradient(135deg,#D32F2F,#6F1A1A)', rating: 4.4, orders: 298,  gmv: '₦2.6M', gmvRaw: 2.6, status: 'paused',  commission: 18, joined: 'Apr 2025', payout: '₦389K' },
  { id: 'k6', name: "Mama Puff's",     code: 'MAMA05',  area: 'Ikoyi',           initial: 'P', color: 'linear-gradient(135deg,#F57C00,#BF5700)', rating: 4.7, orders: 871,  gmv: '₦1.9M', gmvRaw: 1.9, status: 'active',  commission: 15, joined: 'Apr 2025', payout: '₦298K' },
  { id: 'k7', name: "Olu's Kitchen",   code: 'OLUK06',  area: 'Surulere',        initial: 'O', color: 'linear-gradient(135deg,#00897B,#00564D)', rating: 4.3, orders: 142,  gmv: '₦0.9M', gmvRaw: 0.9, status: 'pending', commission: 18, joined: 'Jun 2025', payout: '—' },
  { id: 'k8', name: 'The Pepper Pot',  code: 'PEPP07',  area: 'Gbagada',         initial: 'T', color: 'linear-gradient(135deg,#5E35B1,#311B5E)', rating: 4.6, orders: 209,  gmv: '₦1.4M', gmvRaw: 1.4, status: 'active',  commission: 17, joined: 'May 2025', payout: '₦221K' },
];

export const STATUS_ORDER = ['preparing', 'ready', 'enroute', 'delivered', 'cancelled'];

export const ORDERS = [
  { id: '2847', kitchen: "Mira's Delight", code: 'k1', customer: 'Tomi Adeyemi', items: 3, total: '₦9,200',  totalRaw: 9200,  status: 'enroute',   pay: 'Card',     area: 'Ikoyi',           time: '2 min ago',  agent: 'Bola N.' },
  { id: '2846', kitchen: 'Wokstar',        code: 'k4', customer: 'Chidi Okeke',  items: 2, total: '₦6,400',  totalRaw: 6400,  status: 'preparing', pay: 'Card',     area: 'Ikeja',           time: '4 min ago',  agent: '—' },
  { id: '2845', kitchen: "Mama Puff's",    code: 'k6', customer: 'Aisha Bello',  items: 5, total: '₦4,100',  totalRaw: 4100,  status: 'ready',     pay: 'Cash',     area: 'Ikoyi',           time: '6 min ago',  agent: 'Emeka A.' },
  { id: '2844', kitchen: 'Lagos Bowls',    code: 'k3', customer: 'Femi Olawale', items: 1, total: '₦5,800',  totalRaw: 5800,  status: 'enroute',   pay: 'Card',     area: 'Lekki Phase 1',   time: '9 min ago',  agent: 'Yemi K.' },
  { id: '2843', kitchen: 'Bún Coffee Co.', code: 'k2', customer: 'Zainab Yusuf', items: 4, total: '₦3,600',  totalRaw: 3600,  status: 'delivered', pay: 'Card',     area: 'Victoria Island', time: '12 min ago', agent: 'Bola N.' },
  { id: '2842', kitchen: 'Firepit Grill',  code: 'k5', customer: 'Kunle Bakare', items: 2, total: '₦12,300', totalRaw: 12300, status: 'preparing', pay: 'Transfer', area: 'Yaba',            time: '14 min ago', agent: '—' },
  { id: '2841', kitchen: "Mira's Delight", code: 'k1', customer: 'Ngozi Eze',    items: 2, total: '₦7,000',  totalRaw: 7000,  status: 'delivered', pay: 'Card',     area: 'Ikoyi',           time: '18 min ago', agent: 'Emeka A.' },
  { id: '2840', kitchen: 'The Pepper Pot', code: 'k8', customer: 'Seyi Adewale', items: 3, total: '₦8,900',  totalRaw: 8900,  status: 'cancelled', pay: 'Card',     area: 'Gbagada',         time: '21 min ago', agent: '—' },
  { id: '2839', kitchen: 'Wokstar',        code: 'k4', customer: 'Tunde Bello',  items: 1, total: '₦2,400',  totalRaw: 2400,  status: 'delivered', pay: 'Cash',     area: 'Ikeja',           time: '25 min ago', agent: 'Yemi K.' },
  { id: '2838', kitchen: 'Lagos Bowls',    code: 'k3', customer: 'Halima Sani',  items: 2, total: '₦9,600',  totalRaw: 9600,  status: 'delivered', pay: 'Card',     area: 'Lekki Phase 1',   time: '29 min ago', agent: 'Bola N.' },
  { id: '2837', kitchen: "Mama Puff's",    code: 'k6', customer: 'David Okon',   items: 6, total: '₦5,200',  totalRaw: 5200,  status: 'delivered', pay: 'Transfer', area: 'Surulere',        time: '33 min ago', agent: 'Emeka A.' },
  { id: '2836', kitchen: "Mira's Delight", code: 'k1', customer: 'Funke Akin',   items: 3, total: '₦10,400', totalRaw: 10400, status: 'delivered', pay: 'Card',     area: 'Ikoyi',           time: '37 min ago', agent: 'Yemi K.' },
];

export const CUSTOMERS = [
  { id: 'c1', name: 'Tomi Adeyemi', email: 'tomi.a@gmail.com',   avatar: asset('avTomi'),   orders: 64, spend: '₦248K', spendRaw: 248000, area: 'Ikoyi',           tier: 'VIP',     last: '2 min ago' },
  { id: 'c2', name: 'Femi Olawale', email: 'femi.o@outlook.com', avatar: asset('avFemi'),   orders: 41, spend: '₦162K', spendRaw: 162000, area: 'Lekki Phase 1',   tier: 'Regular', last: '9 min ago' },
  { id: 'c3', name: 'Aisha Bello',  email: 'aisha.b@gmail.com',  avatar: asset('avAisha'),  orders: 38, spend: '₦151K', spendRaw: 151000, area: 'Ikoyi',           tier: 'Regular', last: '6 min ago' },
  { id: 'c4', name: 'Chidi Okeke',  email: 'chidi.k@gmail.com',  avatar: asset('avChidi'),  orders: 29, spend: '₦118K', spendRaw: 118000, area: 'Ikeja',           tier: 'Regular', last: '4 min ago' },
  { id: 'c5', name: 'Zainab Yusuf', email: 'zainab.y@gmail.com', avatar: asset('avZainab'), orders: 22, spend: '₦92K',  spendRaw: 92000,  area: 'Victoria Island', tier: 'Regular', last: '12 min ago' },
  { id: 'c6', name: 'Kunle Bakare', email: 'kunle.b@yahoo.com',  avatar: asset('avKunle'),  orders: 17, spend: '₦71K',  spendRaw: 71000,  area: 'Yaba',            tier: 'New',     last: '14 min ago' },
  { id: 'c7', name: 'Ngozi Eze',    email: 'ngozi.e@gmail.com',  avatar: asset('avNgozi'),  orders: 15, spend: '₦58K',  spendRaw: 58000,  area: 'Ikoyi',           tier: 'New',     last: '18 min ago' },
  { id: 'c8', name: 'Seyi Adewale', email: 'seyi.a@gmail.com',   avatar: asset('avSeyi'),   orders: 11, spend: '₦44K',  spendRaw: 44000,  area: 'Gbagada',         tier: 'New',     last: '21 min ago' },
];

export const PAYOUTS = [
  { id: 'PO-1042', kitchen: "Mira's Delight", code: 'k1', period: 'Jun 8 – Jun 14', gross: '₦1.48M', commission: '₦266K', net: '₦1.21M', status: 'paid',       date: 'Jun 15' },
  { id: 'PO-1041', kitchen: 'Bún Coffee Co.', code: 'k2', period: 'Jun 8 – Jun 14', gross: '₦579K',  commission: '₦93K',  net: '₦486K',  status: 'paid',       date: 'Jun 15' },
  { id: 'PO-1040', kitchen: 'Wokstar',        code: 'k4', period: 'Jun 8 – Jun 14', gross: '₦531K',  commission: '₦90K',  net: '₦441K',  status: 'processing', date: 'Jun 15' },
  { id: 'PO-1039', kitchen: 'Lagos Bowls',    code: 'k3', period: 'Jun 8 – Jun 14', gross: '₦429K',  commission: '₦77K',  net: '₦352K',  status: 'processing', date: 'Jun 15' },
  { id: 'PO-1038', kitchen: "Mama Puff's",    code: 'k6', period: 'Jun 8 – Jun 14', gross: '₦351K',  commission: '₦53K',  net: '₦298K',  status: 'pending',    date: '—' },
  { id: 'PO-1037', kitchen: 'The Pepper Pot', code: 'k8', period: 'Jun 8 – Jun 14', gross: '₦266K',  commission: '₦45K',  net: '₦221K',  status: 'pending',    date: '—' },
  { id: 'PO-1036', kitchen: 'Firepit Grill',  code: 'k5', period: 'Jun 1 – Jun 7',  gross: '₦474K',  commission: '₦85K',  net: '₦389K',  status: 'on hold',    date: '—' },
];

export const ACTIVITY = [
  { id: 'a1', icon: 'store', text: "New kitchen Olu's Kitchen submitted for review",       time: '8 min ago',  tone: 'warn' },
  { id: 'a2', icon: 'check', text: "Payout PO-1042 of ₦1.21M sent to Mira's Delight",       time: '32 min ago', tone: 'good' },
  { id: 'a3', icon: 'alert', text: 'Firepit Grill paused — 4 consecutive cancellations',    time: '1 hr ago',   tone: 'bad' },
  { id: 'a4', icon: 'star',  text: 'Lagos Bowls crossed 4.6★ over 380 reviews',             time: '2 hr ago',   tone: 'good' },
  { id: 'a5', icon: 'user',  text: '312 new customers onboarded today',                     time: '3 hr ago',   tone: 'neutral' },
];

export const TEAM = [
  { name: 'Adaeze Okafor',  role: 'Owner',      email: 'adaeze@savora.africa', avatar: asset('avAdaeze80') },
  { name: 'Bola Nwosu',     role: 'Operations', email: 'bola@savora.africa',   avatar: asset('avChidi') },
  { name: 'Emeka Adeyemi',  role: 'Support',    email: 'emeka@savora.africa',  avatar: asset('avFemi') },
];

export const FEES = [
  { label: 'Default commission', value: '18%' },
  { label: 'Delivery fee', value: '₦600' },
  { label: 'Service fee', value: '5%' },
  { label: 'Min. order', value: '₦1,500' },
];
