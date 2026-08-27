'use strict';

/* პასპორტის გვერდი — საერთო კოდი shared.js-შია (ჩაიტვირთოს მანამდე) */

/* რა მდგომარეობაზეა დახატული გვერდი — ცვლილებისას (bfcache, სხვა ჩანართი) თავიდან იხატება */
let renderedSig = null;
const dataSig = () => JSON.stringify([user && user.id, orders.length]);

function renderPassportPage() {
  renderedSig = dataSig();
  const v = $('#view-passport');

  if (!user) {
    v.innerHTML = `
      <div class="pp-wrap">
        <div class="pp-hero">
          <h1>ყავის პასპორტი</h1>
          <p>შენი ყავის მოგზაურობის ოფიციალური დოკუმენტი</p>
        </div>
        <div class="pp-teaser">
          <div class="pp-cover">
            <svg viewBox="0 0 44 44" width="64" height="64" aria-hidden="true">
              <circle cx="22" cy="22" r="20" fill="none" stroke="#d4af37" stroke-width="2"/>
              <g transform="rotate(-24 22 22)">
                <ellipse cx="22" cy="22" rx="6.5" ry="10" fill="#d4af37"/>
                <path d="M22 12 q6 10 0 20" fill="none" stroke="#173021" stroke-width="1.8" stroke-linecap="round"/>
              </g>
            </svg>
            <div class="pp-title">ყავის<br>პასპორტი</div>
            <div class="pp-sub">COFFEE LAB · PASSPORT</div>
          </div>
          <div class="pp-reg-card">
            <h2>გახსენი შენი პასპორტი ✦</h2>
            <p>დარეგისტრირდი და თითოეულ შეკვეთაზე მიიღებ უნიკალურ ბეჭედს — 8 სახეობა, 8 განსხვავებული ბეჭედი. შეაგროვე ყველა და გახდი ყავის ლეგენდა!</p>
            ${orders.length ? `<div class="guest-note">💡 შენ უკვე გაქვს ${orders.length} შეკვეთა — რეგისტრაციისას ყველა ბეჭედი ავტომატურად აისახება.</div>` : ''}
            <div class="form-row">
              <label for="ppName">სახელი *</label>
              <input type="text" id="ppName" class="text-input" maxlength="40" placeholder="მაგ.: ნინო" autocomplete="off">
            </div>
            <div class="form-row">
              <label for="ppEmail">ელფოსტა (არასავალდებულო)</label>
              <input type="email" id="ppEmail" class="text-input" maxlength="80" placeholder="nino@example.com" autocomplete="off">
            </div>
            ${store.persistent ? '' : '<div class="guest-note">⚠ ბრაუზერი შენახვას არ უშვებს — პასპორტი მხოლოდ ამ ჩანართში იმუშავებს.</div>'}
            <div class="btn-row">
              <button type="button" class="btn gold" id="ppRegister">პასპორტის შექმნა ✦</button>
            </div>
            <p class="privacy-note">მონაცემები ინახება მხოლოდ შენს ბრაუზერში — სერვერზე არაფერი იგზავნება.</p>
          </div>
        </div>
      </div>`;

    const doRegister = () => {
      const res = registerUser($('#ppName').value, $('#ppEmail').value);
      if (!res.ok) { toast(res.error); $('#ppName').focus(); return; }
      renderPassportPage();
      toast('პასპორტი შეიქმნა ✦');
      window.scrollTo({ top: 0 });
    };
    $('#ppRegister').addEventListener('click', doRegister);
    $('#ppName').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
    $('#ppEmail').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
    return;
  }

  const uniq = new Set(orders.map(o => o.coffee.typeId));
  const rank = rankFor(orders.length);
  const next = nextRank(orders.length);
  const passId = 'CL-' + String(seededInt(user.id, 100000, 999999));
  const initials = initialsOf(user.name);
  const prevRankMin = rank.min;
  const progress = next ? Math.min(100, Math.round(((orders.length - prevRankMin) / (next.min - prevRankMin)) * 100)) : 100;

  const collection = COFFEE_TYPES.map(t => {
    const tried = uniq.has(t.id);
    return `<div class="coll-item ${tried ? 'tried' : 'locked'}" title="${esc(t.name)}">
      ${miniCup(t.fill, 26)}<span>${esc(t.name)}</span>
    </div>`;
  }).join('');

  const stamps = [...orders].reverse().map(o => stampSVG(o)).join('');

  v.innerHTML = `
    <div class="pp-wrap">
      <div class="pp-hero">
        <h1>ყავის პასპორტი</h1>
        <p>ყოველი შეკვეთა — ახალი ბეჭედი შენს კოლექციაში</p>
      </div>
      <div class="pp-book">
        <div class="pp-page pp-left">
          <div class="pp-header">
            ${emblemSVG}
            <div class="pp-h-title">ყავის ლაბი<small>COFFEE LAB · PASSPORT</small></div>
          </div>
          <div class="pp-photo">${esc(initials)}</div>
          <dl class="pp-fields">
            <dt>სახელი</dt><dd>${esc(user.name)}</dd>
            <dt>პასპორტის №</dt><dd>${esc(passId)}</dd>
            <dt>გაცემის თარიღი</dt><dd>${esc(fmtDate(user.since))}</dd>
            <dt>წოდება</dt><dd>${esc(rank.name)}</dd>
          </dl>
          <div class="pp-stats">
            <div><b>${orders.length}</b><span>ბეჭედი</span></div>
            <div><b>${uniq.size}/${COFFEE_TYPES.length}</b><span>სახეობა</span></div>
          </div>
          ${next ? `
          <div class="pp-rankbar">
            <div class="rb-lbl"><span>${esc(rank.name)}</span><span>${esc(next.name)} — ${next.min} ბეჭედი</span></div>
            <div class="rb-track"><div class="rb-fill" style="width:${progress}%"></div></div>
          </div>` : `
          <div class="pp-rankbar">
            <div class="rb-lbl"><span>${esc(rank.name)} — მაქსიმალური წოდება! 🏆</span></div>
            <div class="rb-track"><div class="rb-fill" style="width:100%"></div></div>
          </div>`}
          <div class="pp-collection">
            <h4>კოლექცია — ${uniq.size}/${COFFEE_TYPES.length}</h4>
            <div class="coll-grid">${collection}</div>
          </div>
        </div>
        <div class="pp-page pp-right">
          <h3>ბეჭდები</h3>
          <p class="pp-r-sub">ვიზების გვერდი — ${orders.length ? `სულ ${orders.length} ბეჭედი` : 'ჯერ ცარიელია'}</p>
          ${orders.length
            ? `<div class="stamps-grid">${stamps}</div>`
            : `<div class="pp-empty">📭 ბეჭდები ჯერ არ გაქვს.<br>შეუკვეთე პირველი ყავა და მიიღე პირველი ბეჭედი!</div>`}
        </div>
      </div>
      <div class="pp-actions">
        <a class="btn primary" href="index.html">ახალი შეკვეთა ☕</a>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderPassportPage();
  if (!store.persistent) {
    toast('⚠ ბრაუზერი შენახვას არ უშვებს — მონაცემები მხოლოდ ამ სესიაში დარჩება');
  }
});

// shared.js აახლებს user/orders-ს bfcache-დან დაბრუნებისას ან სხვა ჩანართის ცვლილებაზე
document.addEventListener('cl:datachanged', () => {
  if (dataSig() !== renderedSig) renderPassportPage();
});
