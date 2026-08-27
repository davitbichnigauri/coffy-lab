'use strict';

/* ======================================================
   საერთო კოდი ყველა გვერდისთვის:
   დამხმარეები, შენახვა, კონფიგურაცია, ბეჭდის SVG,
   რეგისტრაცია და ზედა ზოლის პროფილის ჩიპი.
   ჩაიტვირთოს app.js/passport.js-მდე.
   ====================================================== */

/* ---------- დამხმარეები ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const GEL = n => {
  const v = Math.round(n * 100) / 100;
  return (Number.isInteger(v) ? String(v) : v.toFixed(2)) + ' ₾';
};
const pad2 = x => String(x).padStart(2, '0');
const fmtDate = ts => {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const padNo = n => String(n).padStart(3, '0');

const initialsOf = name =>
  String(name).trim().split(/\s+/).map(w => [...w][0] || '').slice(0, 2).join('').toUpperCase() || '☕';

function seededInt(str, min, max) {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return min + (h % (max - min + 1));
}

function contrastColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#3a2e26';
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#3a2e26' : '#ffffff';
}

/* ---------- შენახვა (localStorage, ჩავარდნისას — მეხსიერებაში) ---------- */
const store = (() => {
  let ok = true;
  try { localStorage.setItem('cl_test', '1'); localStorage.removeItem('cl_test'); }
  catch (e) { ok = false; }
  const mem = {};
  return {
    get(k) {
      try { return ok ? JSON.parse(localStorage.getItem(k)) : (mem[k] ?? null); }
      catch (e) { return mem[k] ?? null; }
    },
    set(k, v) {
      mem[k] = v;
      if (ok) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    },
    persistent: ok,
  };
})();

/* ---------- კონფიგურაცია ---------- */
const COFFEE_TYPES = [
  { id: 'espresso',   name: 'ესპრესო',     base: 4.0, fill: '#3b2417', desc: 'მკვრივი და ინტენსიური — ყავის სუფთა ხასიათი',        stamp: { shape: 'circle',  ink: '#8a3324' } },
  { id: 'americano',  name: 'ამერიკანო',   base: 4.5, fill: '#4a2f1d', desc: 'ესპრესო ცხელი წყლით — რბილი და გამოკვეთილი',          stamp: { shape: 'hexagon', ink: '#2e5e4e' } },
  { id: 'cappuccino', name: 'კაპუჩინო',    base: 6.0, fill: '#b98d64', desc: 'ესპრესო, ორთქლით გაცხელებული რძე და ხავერდოვანი ქაფი', stamp: { shape: 'rosette', ink: '#a4551e' } },
  { id: 'latte',      name: 'ლატე',        base: 6.5, fill: '#c9a37c', desc: 'ბევრი რბილი რძე და ესპრესოს ნაზი გემო',               stamp: { shape: 'oval',    ink: '#4a6fa5' } },
  { id: 'flatwhite',  name: 'ფლეთ უაითი',  base: 6.5, fill: '#bd9066', desc: 'ორმაგი შოტი და თხელი, აბრეშუმისებრი ქაფი',            stamp: { shape: 'square',  ink: '#6b4f9e' } },
  { id: 'mocha',      name: 'მოკა',        base: 7.0, fill: '#6b3f2a', desc: 'შოკოლადი და ესპრესო — დესერტი ჭიქაში',                stamp: { shape: 'shield',  ink: '#5d3a26' } },
  { id: 'macchiato',  name: 'მაკიატო',     base: 5.0, fill: '#8a5a3a', desc: 'ესპრესო რძის ქაფის ნაზი შეხებით',                     stamp: { shape: 'diamond', ink: '#b23a48' } },
  { id: 'coldbrew',   name: 'ქოლდ ბრიუ',   base: 7.0, fill: '#2f1d12', desc: 'ცივად დაყენებული 16 საათის განმავლობაში — რბილი გემო', stamp: { shape: 'octagon', ink: '#23617a' } },
];

const VOLUMES = [
  { id: 's', name: 'პატარა',   ml: 250, price: 0   },
  { id: 'm', name: 'საშუალო',  ml: 350, price: 1   },
  { id: 'l', name: 'დიდი',     ml: 450, price: 1.8 },
];

const SHOTS = [
  { id: 1, name: '1 შოტი',  price: 0   },
  { id: 2, name: '2 შოტი',  price: 1.5 },
  { id: 3, name: '3 შოტი',  price: 3   },
];

const TEMPS = [
  { id: 'hot',  name: '🔥 ცხელი', price: 0 },
  { id: 'cold', name: '🧊 ცივი',  price: 0 },
];

const MILKS = [
  { id: 'none',   name: 'რძის გარეშე', price: 0   },
  { id: 'cow',    name: 'ძროხის რძე',  price: 0   },
  { id: 'skim',   name: 'უცხიმო რძე',  price: 0   },
  { id: 'almond', name: 'ნუშის რძე',   price: 1   },
  { id: 'oat',    name: 'შვრიის რძე',  price: 1   },
  { id: 'soy',    name: 'სოიოს რძე',   price: 0.8 },
];

const SYRUPS = [
  { id: 'vanilla',  name: 'ვანილის სიროფი',   price: 0.8 },
  { id: 'caramel',  name: 'კარამელის სიროფი', price: 0.8 },
  { id: 'hazelnut', name: 'თხილის სიროფი',    price: 0.8 },
  { id: 'choco',    name: 'შოკოლადის სიროფი', price: 0.8 },
  { id: 'lavender', name: 'ლავანდის სიროფი',  price: 0.8 },
];

const EXTRAS = [
  { id: 'cream',    name: 'ათქვეფილი ნაღები', price: 1   },
  { id: 'cinnamon', name: 'დარიჩინი',          price: 0.3 },
  { id: 'cocoa',    name: 'კაკაოს ფხვნილი',    price: 0.3 },
  { id: 'honey',    name: 'თაფლი',             price: 0.5 },
  { id: 'ice',      name: 'ყინული',            price: 0   },
];

const LIDS = [
  { id: 'sip',  name: 'საწრუპიანი ხუფი', price: 0 },
  { id: 'flat', name: 'ბრტყელი ხუფი',    price: 0 },
  { id: 'none', name: 'ხუფის გარეშე',    price: 0 },
];

const STRAWS = [
  { id: 'none',   name: 'საწრუპის გარეშე',  price: 0   },
  { id: 'paper',  name: 'ქაღალდის საწრუპი', price: 0.2 },
  { id: 'bamboo', name: 'ბამბუკის საწრუპი', price: 0.5 },
];

const CUP_COLORS = [
  { hex: '#ffffff', name: 'თეთრი' },
  { hex: '#f3e5d0', name: 'კრემისფერი' },
  { hex: '#2b2b2e', name: 'შავი' },
  { hex: '#c0392b', name: 'წითელი' },
  { hex: '#2e6fdb', name: 'ლურჯი' },
  { hex: '#3b7a57', name: 'მწვანე' },
  { hex: '#f4c430', name: 'ყვითელი' },
  { hex: '#e8749e', name: 'ვარდისფერი' },
  { hex: '#7c5cbf', name: 'იისფერი' },
  { hex: '#47b5c4', name: 'ფირუზისფერი' },
];

const RANKS = [
  { min: 0,  name: 'ახალბედა' },
  { min: 1,  name: 'დამწყები დეგუსტატორი' },
  { min: 3,  name: 'ყავის მოყვარული' },
  { min: 5,  name: 'ბარისტას მეგობარი' },
  { min: 10, name: 'ყავის მცოდნე' },
  { min: 20, name: 'ყავის ლეგენდა' },
];

const coffeeById = id => COFFEE_TYPES.find(t => t.id === id);

function rankFor(n) { let r = RANKS[0]; for (const x of RANKS) if (n >= x.min) r = x; return r; }
function nextRank(n) { return RANKS.find(x => x.min > n) || null; }

/* ---------- შენახული მონაცემები + ვალიდაცია ---------- */
let user = null;
let orders = [];

function reloadStoredData() {
  user = store.get('cl_user');
  if (!user || typeof user.name !== 'string' || !user.name.trim() || typeof user.since !== 'number') user = null;

  let o = store.get('cl_orders');
  if (!Array.isArray(o)) o = [];
  orders = o.filter(x =>
    x && typeof x === 'object' &&
    x.coffee && typeof x.coffee.typeId === 'string' &&
    typeof x.date === 'number' && typeof x.no === 'number');
}
reloadStoredData();

/* ---------- რეგისტრაცია ---------- */
function registerUser(name, email) {
  name = String(name || '').trim();
  email = String(email || '').trim();
  if (!name) return { ok: false, error: 'შეიყვანე სახელი 🙂' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'ელფოსტის ფორმატი არასწორია' };
  // თუ სხვა ჩანართში პასპორტი უკვე შექმნილია, იდენტობა (№, გაცემის თარიღი) არ უნდა შეიცვალოს
  const existing = store.get('cl_user');
  const keepIdentity = existing && typeof existing.id === 'string' && typeof existing.since === 'number';
  user = {
    name, email,
    id: keepIdentity ? existing.id : 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    since: keepIdentity ? existing.since : Date.now(),
  };
  store.set('cl_user', user);
  renderTopbarUser();
  return { ok: true };
}

/* ---------- საერთო SVG ---------- */
function miniCup(fill, size = 38) {
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">
    <path d="M9 13 h22 l-2.6 17.5 a3.2 3.2 0 0 1 -3.2 2.8 h-10.4 a3.2 3.2 0 0 1 -3.2 -2.8 Z" fill="${fill}"/>
    <path d="M31 15 h3.4 a4.2 4.2 0 0 1 0 8.4 h-4.6" fill="none" stroke="${fill}" stroke-width="2.4"/>
    <ellipse cx="20" cy="13" rx="11" ry="2.8" fill="#fff5e8" stroke="${fill}" stroke-width="1.2"/>
  </svg>`;
}

const emblemSVG = `
  <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
    <circle cx="22" cy="22" r="20" fill="none" stroke="#8a5a34" stroke-width="2"/>
    <circle cx="22" cy="22" r="16" fill="none" stroke="#8a5a34" stroke-width="1" stroke-dasharray="3 2.5"/>
    <g transform="rotate(-24 22 22)">
      <ellipse cx="22" cy="22" rx="6.5" ry="10" fill="#8a5a34"/>
      <path d="M22 12 q6 10 0 20" fill="none" stroke="#f7f0dd" stroke-width="1.8" stroke-linecap="round"/>
    </g>
  </svg>`;

/* ---------- ბეჭდის SVG ---------- */
function polyPoints(n, r, rotDeg = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((-90 + rotDeg + i * 360 / n) * Math.PI) / 180;
    pts.push((70 + r * Math.cos(a)).toFixed(1) + ',' + (70 + r * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}

function stampShape(shape, ink) {
  switch (shape) {
    case 'circle':  return `<circle cx="70" cy="70" r="64" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <circle cx="70" cy="70" r="55" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    case 'rosette': return `<circle cx="70" cy="70" r="61" fill="none" stroke="${ink}" stroke-width="7" stroke-dasharray="2.5 6.5" stroke-linecap="round"/>
                            <circle cx="70" cy="70" r="53" fill="none" stroke="${ink}" stroke-width="2"/>`;
    case 'hexagon': return `<polygon points="${polyPoints(6, 64)}" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <polygon points="${polyPoints(6, 55)}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    case 'octagon': return `<polygon points="${polyPoints(8, 64, 22.5)}" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <polygon points="${polyPoints(8, 55, 22.5)}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    case 'square':  return `<rect x="8" y="8" width="124" height="124" rx="14" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <rect x="17" y="17" width="106" height="106" rx="10" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    case 'diamond': return `<polygon points="${polyPoints(4, 66)}" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <polygon points="${polyPoints(4, 56)}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    case 'oval':    return `<ellipse cx="70" cy="70" rx="66" ry="53" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <ellipse cx="70" cy="70" rx="57" ry="45" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    case 'shield':  return `<path d="M70 6 L128 27 V72 q0 35 -58 58 q-58 -23 -58 -58 V27 Z" fill="none" stroke="${ink}" stroke-width="3.5"/>
                            <path d="M70 16 L119 33.5 V71 q0 28 -49 48 q-49 -20 -49 -48 V33.5 Z" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    default:        return `<circle cx="70" cy="70" r="64" fill="none" stroke="${ink}" stroke-width="3.5"/>`;
  }
}

function stampSVG(order, { size = 132, ghost = false, animate = false } = {}) {
  const t = coffeeById(order.coffee.typeId) || COFFEE_TYPES[0];
  const ink = t.stamp.ink;
  const rot = seededInt(order.id, -12, 12);
  // კონტექსტის სუფიქსი, რომ სხვადასხვა ადგილას დახატულმა ბეჭდებმა defs id არ გაიზიარონ
  const uid = 'arc-' + esc(String(order.id)) + (ghost ? '-g' : animate ? '-a' : '');
  const vol = VOLUMES.find(v => v.id === order.coffee.volume);
  const cls = ['stamp', ghost ? 'stamp-ghost' : '', animate ? 'stamp-in' : ''].filter(Boolean).join(' ');

  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 140 140" role="img" aria-label="ბეჭედი: ${esc(t.name)}">
    <defs><path id="${uid}" d="M 26 70 A 44 44 0 0 1 114 70"/></defs>
    <g transform="rotate(${rot} 70 70)" opacity="0.9">
      ${stampShape(t.stamp.shape, ink)}
      <text font-size="13" font-weight="800" fill="${ink}" letter-spacing="1">
        <textPath href="#${uid}" startOffset="50%" text-anchor="middle">✦ ${esc(t.name)} ✦</textPath>
      </text>
      <g transform="rotate(-20 70 64)" fill="${ink}">
        <ellipse cx="70" cy="64" rx="8.5" ry="12.5"/>
        <path d="M70 51.5 q6.5 12.5 0 25" fill="none" stroke="#f7f0dd" stroke-width="2" stroke-linecap="round"/>
      </g>
      <text x="70" y="95" text-anchor="middle" font-size="10" font-weight="700" fill="${ink}">${vol ? vol.ml + ' მლ' : ''} · ${esc(fmtDate(order.date))}</text>
      <text x="70" y="109" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1.5" fill="${ink}">№ ${esc(padNo(order.no))}</text>
    </g>
  </svg>`;
}

/* ---------- ტოსტი ---------- */
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- ზედა ზოლი: ბეჭდების ბეჯი + პროფილის ჩიპი (ყველა გვერდზე) ---------- */
function renderTopbarUser() {
  const badge = $('#stampBadge');
  if (badge) {
    if (user && orders.length > 0) {
      badge.textContent = orders.length;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  const chip = $('#userChip');
  if (!chip) return;
  if (user) {
    chip.classList.remove('hidden');
    chip.innerHTML = '';
    const av = document.createElement('span');
    av.className = 'avatar';
    av.textContent = initialsOf(user.name);
    const nm = document.createElement('span');
    nm.className = 'uc-name';
    nm.textContent = user.name;
    nm.title = user.name;
    chip.append(av, nm);
    chip.setAttribute('role', 'link');
    chip.setAttribute('aria-label', 'ყავის პასპორტი — ' + user.name);
    chip.tabIndex = 0;
    const go = () => { location.href = 'passport.html'; };
    chip.onclick = go;
    chip.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    };
  } else {
    chip.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', renderTopbarUser);

/* ---------- მონაცემების განახლება bfcache-დან დაბრუნებისას და სხვა ჩანართიდან ---------- */
function refreshSharedData() {
  reloadStoredData();
  renderTopbarUser();
  // გვერდის სკრიპტებს შეუძლიათ ამ ივენთზე საკუთარი ხედი გადახატონ
  document.dispatchEvent(new CustomEvent('cl:datachanged'));
}

window.addEventListener('pageshow', e => { if (e.persisted) refreshSharedData(); });
window.addEventListener('storage', e => {
  if (e.key === 'cl_user' || e.key === 'cl_orders') refreshSharedData();
});
