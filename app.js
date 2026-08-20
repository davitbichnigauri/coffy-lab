'use strict';

/* შეკვეთის (index) გვერდის ლოგიკა — საერთო კოდი shared.js-შია (ჩაიტვირთოს მანამდე) */

/* ================= მდგომარეობა ================= */
const defaultState = () => ({
  step: 1,
  maxStep: 1,
  coffee: { typeId: 'cappuccino', volume: 'm', shots: 1, temp: 'hot', milk: 'cow', syrups: [], extras: [], sugar: 1 },
  cup:    { color: '#f3e5d0', text: '', lid: 'sip', straw: 'none' },
});

let state = defaultState();

/* ================= ფასის დათვლა ================= */
function priceLines() {
  const t   = coffeeById(state.coffee.typeId);
  const vol = VOLUMES.find(v => v.id === state.coffee.volume);
  const lines = [{ label: t.name, amount: t.base }];

  if (vol.price > 0) lines.push({ label: `${vol.name} (${vol.ml} მლ)`, amount: vol.price });
  if (state.coffee.shots > 1) lines.push({ label: `დამატებითი შოტი ×${state.coffee.shots - 1}`, amount: (state.coffee.shots - 1) * 1.5 });

  const milk = MILKS.find(m => m.id === state.coffee.milk);
  if (milk && milk.price > 0) lines.push({ label: milk.name, amount: milk.price });

  state.coffee.syrups.forEach(id => {
    const s = SYRUPS.find(x => x.id === id);
    if (s) lines.push({ label: s.name, amount: s.price });
  });
  state.coffee.extras.forEach(id => {
    const e = EXTRAS.find(x => x.id === id);
    if (e && e.price > 0) lines.push({ label: e.name, amount: e.price });
  });

  const straw = STRAWS.find(s => s.id === state.cup.straw);
  if (straw && straw.price > 0) lines.push({ label: straw.name, amount: straw.price });

  const total = lines.reduce((a, l) => a + l.amount, 0);
  return { lines, total };
}

/* ================= UI: ჩიპები და ბარათები ================= */
function chipGroup(container, items, isSelected, onPick) {
  container.innerHTML = '';
  items.forEach((it, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (isSelected(it) ? ' selected' : '');
    b.setAttribute('aria-pressed', isSelected(it) ? 'true' : 'false');
    const nm = document.createElement('span');
    nm.textContent = it.name;
    b.appendChild(nm);
    if (it.ml) {
      const sub = document.createElement('span');
      sub.className = 'chip-sub';
      sub.textContent = it.ml + ' მლ';
      b.appendChild(sub);
    }
    if (it.price > 0) {
      const p = document.createElement('span');
      p.className = 'chip-price';
      p.textContent = '+' + GEL(it.price);
      b.appendChild(p);
    }
    // refresh() თავიდან აშენებს ჯგუფს — ფოკუსი იმავე პოზიციის ახალ ღილაკს უბრუნდება
    b.addEventListener('click', () => { onPick(it); refresh(); container.children[idx]?.focus(); });
    container.appendChild(b);
  });
}

function renderCoffeeTypes() {
  const c = $('#coffeeTypes');
  c.innerHTML = '';
  COFFEE_TYPES.forEach((t, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'coffee-card' + (state.coffee.typeId === t.id ? ' selected' : '');
    card.setAttribute('aria-pressed', state.coffee.typeId === t.id ? 'true' : 'false');
    card.innerHTML = `
      <span aria-hidden="true">${miniCup(t.fill)}</span>
      <span class="cc-name">${esc(t.name)}</span>
      <span class="cc-desc">${esc(t.desc)}</span>
      <span class="cc-price">${GEL(t.base)}</span>`;
    card.addEventListener('click', () => { state.coffee.typeId = t.id; refresh(); c.children[idx]?.focus(); });
    c.appendChild(card);
  });
}

function renderChips() {
  chipGroup($('#volumeChips'), VOLUMES, it => it.id === state.coffee.volume, it => state.coffee.volume = it.id);
  chipGroup($('#shotChips'),   SHOTS,   it => it.id === state.coffee.shots,  it => state.coffee.shots = it.id);
  chipGroup($('#tempChips'),   TEMPS,   it => it.id === state.coffee.temp,   it => state.coffee.temp = it.id);
  chipGroup($('#milkChips'),   MILKS,   it => it.id === state.coffee.milk,   it => state.coffee.milk = it.id);
  chipGroup($('#syrupChips'),  SYRUPS,  it => state.coffee.syrups.includes(it.id), it => {
    const i = state.coffee.syrups.indexOf(it.id);
    if (i >= 0) state.coffee.syrups.splice(i, 1); else state.coffee.syrups.push(it.id);
  });
  chipGroup($('#extraChips'),  EXTRAS,  it => state.coffee.extras.includes(it.id), it => {
    const i = state.coffee.extras.indexOf(it.id);
    if (i >= 0) state.coffee.extras.splice(i, 1); else state.coffee.extras.push(it.id);
  });
  chipGroup($('#lidChips'),    LIDS,    it => it.id === state.cup.lid,   it => state.cup.lid = it.id);
  chipGroup($('#strawChips'),  STRAWS,  it => it.id === state.cup.straw, it => state.cup.straw = it.id);
}

function renderSwatches() {
  const c = $('#colorSwatches');
  c.innerHTML = '';
  CUP_COLORS.forEach((cc, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (state.cup.color.toLowerCase() === cc.hex ? ' selected' : '');
    b.style.background = cc.hex;
    b.title = cc.name;
    b.setAttribute('aria-label', cc.name);
    b.setAttribute('aria-pressed', state.cup.color.toLowerCase() === cc.hex ? 'true' : 'false');
    b.addEventListener('click', () => { state.cup.color = cc.hex; refresh(); c.children[idx]?.focus(); });
    c.appendChild(b);
  });
}

function renderSugar() {
  const n = state.coffee.sugar;
  $('#sugarOut').textContent = n === 0 ? 'შაქრის გარეშე' : `${n} კოვზი`;
}

/* ================= ჭიქის გადახედვა ================= */
function renderPreview() {
  const t = coffeeById(state.coffee.typeId);
  const color = state.cup.color;
  const fg = contrastColor(color);

  $('#cupBody').setAttribute('fill', color);
  $('#coffeeTop').setAttribute('fill', t.fill);

  const txt = $('#cupText');
  const text = state.cup.text.trim();
  txt.textContent = text;
  const len = [...text].length;
  txt.setAttribute('font-size', len <= 6 ? 23 : len <= 10 ? 18 : len <= 14 ? 15 : 13);
  txt.setAttribute('fill', fg);
  $('#cupBrand').setAttribute('fill', fg);

  const lid = state.cup.lid;
  $('#lidG').style.display     = lid === 'none' ? 'none' : '';
  $('#lidDome').style.display  = lid === 'sip'  ? '' : 'none';
  $('#sipHole').style.display  = lid === 'sip'  ? '' : 'none';
  $('#coffeeTop').style.display = lid === 'none' ? '' : 'none';

  const straw = state.cup.straw;
  $('#strawG').style.display = straw === 'none' ? 'none' : '';
  $('#strawRect').setAttribute('fill', straw === 'bamboo' ? '#c9a878' : '#f3f1ec');
  $('#strawStripe').style.display = straw === 'paper' ? '' : 'none';

  $('#steamG').style.display = (state.coffee.temp === 'hot'  && lid === 'none') ? '' : 'none';
  $('#iceG').style.display   = (state.coffee.temp === 'cold' && lid === 'none' &&
                                state.coffee.extras.includes('ice')) ? '' : 'none';
}

/* ================= ფასის პანელი ================= */
function priceLinesHTML(lines) {
  return lines.map(l =>
    `<div class="price-line"><span>${esc(l.label)}</span><b>${l.amount > 0 && l !== lines[0] ? '+' : ''}${GEL(l.amount)}</b></div>`
  ).join('');
}

function renderPrice() {
  const { lines, total } = priceLines();
  $('#priceLines').innerHTML = priceLinesHTML(lines);
  $('#priceTotal').textContent = GEL(total);
}

/* ================= შეჯამება ================= */
function renderSummary() {
  const t = coffeeById(state.coffee.typeId);
  const vol = VOLUMES.find(v => v.id === state.coffee.volume);
  const milk = MILKS.find(m => m.id === state.coffee.milk);
  const lid = LIDS.find(l => l.id === state.cup.lid);
  const straw = STRAWS.find(s => s.id === state.cup.straw);
  const temp = TEMPS.find(x => x.id === state.coffee.temp);
  const syrups = state.coffee.syrups.map(id => SYRUPS.find(s => s.id === id)?.name).filter(Boolean);
  const extras = state.coffee.extras.map(id => EXTRAS.find(e => e.id === id)?.name).filter(Boolean);
  const { lines, total } = priceLines();
  const text = state.cup.text.trim();

  $('#summaryBox').innerHTML = `
    <div class="sum-section">
      <h3>☕ ყავა</h3>
      <table class="sum-table"><tbody>
        <tr><td>სახეობა</td><td>${esc(t.name)}</td></tr>
        <tr><td>მოცულობა</td><td>${esc(vol.name)} · ${vol.ml} მლ</td></tr>
        <tr><td>ესპრესოს შოტები</td><td>${state.coffee.shots}</td></tr>
        <tr><td>ტემპერატურა</td><td>${esc(temp.name)}</td></tr>
        <tr><td>რძე</td><td>${esc(milk.name)}</td></tr>
        <tr><td>სიროფები</td><td>${syrups.length ? esc(syrups.join(', ')) : '—'}</td></tr>
        <tr><td>დამატებები</td><td>${extras.length ? esc(extras.join(', ')) : '—'}</td></tr>
        <tr><td>შაქარი</td><td>${state.coffee.sugar === 0 ? 'შაქრის გარეშე' : state.coffee.sugar + ' კოვზი'}</td></tr>
      </tbody></table>
    </div>
    <div class="sum-section">
      <h3>🥤 ჭიქა</h3>
      <table class="sum-table"><tbody>
        <tr><td>ფერი</td><td><span class="color-dot" style="background:${esc(state.cup.color)}"></span>${esc(state.cup.color)}</td></tr>
        <tr><td>წარწერა</td><td>${text ? '„' + esc(text) + '“' : '—'}</td></tr>
        <tr><td>ხუფი</td><td>${esc(lid.name)}</td></tr>
        <tr><td>საწრუპი</td><td>${esc(straw.name)}</td></tr>
      </tbody></table>
    </div>
    <div class="sum-price">
      ${priceLinesHTML(lines)}
      <div class="price-total"><span>გადასახდელი</span><b>${GEL(total)}</b></div>
    </div>`;
}

/* ================= ნაბიჯები ================= */
function showStep(n) {
  state.step = n;
  state.maxStep = Math.max(state.maxStep, n);
  [1, 2, 3].forEach(i => $('#step' + i).classList.toggle('hidden', i !== n));
  $$('#stepsBar li').forEach(li => {
    const s = Number(li.dataset.step);
    li.classList.toggle('active', s === n);
    li.classList.toggle('done', s < n);
  });
  if (n === 3) renderSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================= შეკვეთა ================= */
function placeOrder() {
  if (!$('#modal').classList.contains('hidden')) return; // Enter-ის გამეორება დუბლიკატს არ ქმნის
  const { total } = priceLines();
  const order = {
    id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    no: orders.length + 1,
    date: Date.now(),
    coffee: { ...state.coffee, syrups: [...state.coffee.syrups], extras: [...state.coffee.extras] },
    cup: { ...state.cup, text: state.cup.text.trim() },
    total,
  };
  orders.push(order);
  store.set('cl_orders', orders);
  renderTopbarUser();
  showSuccessModal(order);
}

function resetOrder() {
  state = defaultState();
  syncStaticInputs();
  refresh();
  showStep(1);
}

/* ================= მოდალი ================= */
let modalReturnFocus = null;

function openModal() {
  modalReturnFocus = document.activeElement;
  $('#modal').classList.remove('hidden');
  $('#modal .modal').focus();
}

function closeModal() {
  $('#modal').classList.add('hidden');
  $('#modalContent').innerHTML = '';
  const f = (modalReturnFocus && modalReturnFocus.isConnected && modalReturnFocus.offsetParent !== null)
    ? modalReturnFocus : $('#navOrder');
  f.focus();
  modalReturnFocus = null;
}

function showSuccessModal(order) {
  const mc = $('#modalContent');
  const head = `
    <div class="success-icon">✓</div>
    <h2>შეკვეთა მიღებულია!</h2>
    <p class="order-no">შეკვეთა № ${esc(padNo(order.no))} · მზად იქნება დაახლოებით 5–7 წუთში</p>`;

  if (user) {
    mc.innerHTML = `
      ${head}
      <div class="modal-stamp">${stampSVG(order, { animate: true })}</div>
      <p style="text-align:center;font-size:14px;font-weight:600;color:var(--accent-dark)">
        ახალი ბეჭედი დაესვა შენს ყავის პასპორტს ✦
      </p>
      <div class="btn-row">
        <a class="btn gold" href="passport.html">პასპორტის ნახვა 📖</a>
        <button type="button" class="btn ghost" id="mNewOrder">ახალი შეკვეთა</button>
      </div>`;
    $('#mNewOrder').addEventListener('click', () => { closeModal(); resetOrder(); });
  } else {
    mc.innerHTML = `
      ${head}
      <hr class="divider">
      <h2 style="font-size:17px">📖 შექმენი ყავის პასპორტი</h2>
      <p style="font-size:13.5px;color:var(--muted);line-height:1.6;margin-top:4px">
        დარეგისტრირდი (არასავალდებულოა) და თითოეულ შეკვეთაზე მიიღებ უნიკალურ ბეჭედს —
        როგორც პასპორტში, მოგზაურობის შემდეგ. ეს ბეჭედი უკვე გელოდება:
      </p>
      <div class="modal-stamp">${stampSVG(order, { ghost: true })}</div>
      <div class="form-row">
        <label for="regName">სახელი *</label>
        <input type="text" id="regName" class="text-input" maxlength="40" placeholder="მაგ.: ნინო" autocomplete="off">
      </div>
      <div class="form-row">
        <label for="regEmail">ელფოსტა (არასავალდებულო)</label>
        <input type="email" id="regEmail" class="text-input" maxlength="80" placeholder="nino@example.com" autocomplete="off">
      </div>
      <div class="btn-row">
        <button type="button" class="btn gold" id="mRegister">პასპორტის შექმნა ✦</button>
        <button type="button" class="btn ghost" id="mSkip">გამოტოვება</button>
      </div>
      <p class="privacy-note">მონაცემები ინახება მხოლოდ შენს ბრაუზერში — სერვერზე არაფერი იგზავნება.</p>`;
    $('#mRegister').addEventListener('click', () => registerFrom('#regName', '#regEmail', order));
    $('#regName').addEventListener('keydown', e => { if (e.key === 'Enter') registerFrom('#regName', '#regEmail', order); });
    $('#mSkip').addEventListener('click', () => { closeModal(); resetOrder(); });
  }
  openModal();
}

function registerFrom(nameSel, emailSel, order) {
  const res = registerUser($(nameSel).value, $(emailSel) ? $(emailSel).value : '');
  if (!res.ok) { toast(res.error); $(nameSel).focus(); return; }

  const mc = $('#modalContent');
  mc.innerHTML = `
    <div class="success-icon">✦</div>
    <h2>პასპორტი მზადაა, ${esc(user.name)}!</h2>
    <p class="order-no">${orders.length === 1
      ? 'პირველი ბეჭედი უკვე დაესვა.'
      : `აქამდე გაკეთებული ${orders.length} შეკვეთის ბეჭედიც ავტომატურად აისახა.`}</p>
    <div class="modal-stamp">${stampSVG(order, { animate: true })}</div>
    <div class="btn-row">
      <a class="btn gold" href="passport.html">პასპორტის ნახვა 📖</a>
      <button type="button" class="btn ghost" id="mNewOrder">ახალი შეკვეთა</button>
    </div>`;
  $('#mNewOrder').addEventListener('click', () => { closeModal(); resetOrder(); });
  $('#modal .modal').focus();
}

/* ================= განახლება ================= */
function refresh() {
  renderCoffeeTypes();
  renderChips();
  renderSwatches();
  renderSugar();
  renderPreview();
  renderPrice();
  if (state.step === 3) renderSummary();
}

function syncStaticInputs() {
  $('#sugarRange').value = state.coffee.sugar;
  $('#cupTextInput').value = state.cup.text;
  // ითვლება UTF-16 ერთეულებით, რომ maxlength-ს დაემთხვეს
  $('#cupTextCount').textContent = `${state.cup.text.length} / 18 სიმბოლო`;
  $('#customColor').value = /^#[0-9a-f]{6}$/i.test(state.cup.color) ? state.cup.color : '#f3e5d0';
}

/* ================= ინიციალიზაცია ================= */
function init() {
  // ძველი ბმულების თავსებადობა: index.html#passport → passport.html
  if (location.hash === '#passport') { location.replace('passport.html'); return; }

  if (!store.persistent) {
    toast('⚠ ბრაუზერი შენახვას არ უშვებს — მონაცემები მხოლოდ ამ სესიაში დარჩება');
  }

  $('#sugarRange').addEventListener('input', e => {
    state.coffee.sugar = Number(e.target.value);
    renderSugar();
  });

  $('#cupTextInput').addEventListener('input', e => {
    state.cup.text = e.target.value;
    $('#cupTextCount').textContent = `${e.target.value.length} / 18 სიმბოლო`;
    renderPreview();
  });

  $('#customColor').addEventListener('input', e => {
    state.cup.color = e.target.value;
    renderSwatches();
    renderPreview();
  });

  $('#toStep2').addEventListener('click', () => showStep(2));
  $('#toStep3').addEventListener('click', () => showStep(3));
  $('#backTo1').addEventListener('click', () => showStep(1));
  $('#backTo2').addEventListener('click', () => showStep(2));
  $('#placeOrderBtn').addEventListener('click', placeOrder);

  $$('#stepsBar li').forEach(li => {
    const go = () => {
      const s = Number(li.dataset.step);
      if (s <= state.maxStep) showStep(s);
    };
    li.addEventListener('click', go);
    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  document.addEventListener('keydown', e => {
    if ($('#modal').classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      // ნახევრად შევსებული რეგისტრაციის ფორმა უხმოდ არ უნდა წაიშალოს
      const nm = $('#regName'), em = $('#regEmail');
      if (nm && (nm.value.trim() || (em && em.value.trim()))) {
        toast('ფორმის დახურვისთვის დააჭირე „გამოტოვებას“ 🙂');
        return;
      }
      closeModal();
      resetOrder();
    } else if (e.key === 'Tab') {
      // ფოკუსი მოდალშივე რჩება
      const els = $$('button, input, a[href]', $('#modal')).filter(el => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === $('#modal .modal'))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      } else if (!$('#modal').contains(active)) {
        e.preventDefault(); first.focus();
      }
    }
  });

  syncStaticInputs();
  renderTopbarUser();
  refresh();
  showStep(1);
}

document.addEventListener('DOMContentLoaded', init);
