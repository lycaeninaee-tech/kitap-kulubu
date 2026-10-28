import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { CONFIG } from './config.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const STATUS = { sirada: 'Sırada', okunuyor: 'Okunuyor', tamamlandi: 'Tamamlandı' };
const MOODS = ['Duygusal', 'Düşündürücü', 'Hüzünlü', 'Umut verici', 'Karanlık', 'Gergin', 'Eğlenceli', 'Maceralı', 'Rahatlatıcı', 'Sürükleyici', 'Akıcı', 'Ağır dil', 'Karakter takibi zor'];
const PACE = [['yavas', 'Yavaş'], ['orta', 'Orta'], ['hizli', 'Hızlı']];
const FOCUS = [['olay', 'Olay'], ['karakter', 'Karakter'], ['ikisi', 'İkisi de']];
const RSVP = [['geliyor', 'Geliyorum', 'y'], ['belki', 'Belki', 'm'], ['gelemiyor', 'Gelemiyorum', 'n']];
const GENERIC_Q = [
  'Kitabın sonu sana tatmin edici geldi mi? Seni şaşırttı mı?',
  'En çok hangi karakterle bağ kurdun, neden?',
  'Karakterlerin kararları sana inandırıcı geldi mi?',
  'Ana karakter kitabın başından sonuna nasıl değişti?',
  'Olayların altında bu kitap sence aslında ne anlatıyor?',
  'Hikâye bittikten sonra karakterlere ne olduğunu düşünüyorsun?',
  'Sesli okumak istediğin bir bölüm var mı? Neden o bölüm?',
  'Bu kitabı kime önerirdin?',
];
const TABS = [['genel', 'Genel'], ['yazar', 'Yazar'], ['bilgi', 'Bilgi'], ['once', 'Toplantı öncesi'], ['alinti', 'Alıntılar'], ['soru', 'Sorular'], ['toplanti', 'Toplantı']];
const VIEWS = [['buay', 'Bu ay', 'home'], ['kitaplik', 'Kitaplık', 'books'], ['oneriler', 'Öneriler', 'heart'], ['profil', 'Profilim', 'pin']];
const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  books: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m16.5 4.8 3.8-1 3.2 15.4-3.8 1z" transform="translate(-2 .5)"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.3 3.6 4 7 4c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.8C19.5 15.4 12 20 12 20z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  house: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4"/>',
};
const icon = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;

const S = {
  me: '', user: null, authReady: false, denied: false, club: null, books: [], sugg: [], notes: {}, loaded: false, loadError: '',
  view: 'buay', bookId: null, tab: 'genel', showAdd: false, ownFilter: 'all', shelfFilter: 'all',
  reveal: new Set(), armed: null, newPhoto: null, photoMsg: '', finds: {}, finding: new Set(),
};
const configured = !!(CONFIG.firebase && CONFIG.firebase.apiKey && CONFIG.firebase.projectId);
let fs = null, auth = null;
const subs = [];
const noteSubs = {};
const looking = new Set();

/* ---------- data layer ---------- */
const db = {
  watch(path, cb) { return onSnapshot(collection(fs, path), s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), fail); },
  add(path, data) { return addDoc(collection(fs, path), data); },
  // Merge so nested maps (ratings, progress, rsvp...) keep the other members' values.
  patch(path, id, data) { return setDoc(doc(fs, path, id), data, { merge: true }); },
  remove(path, id) { return deleteDoc(doc(fs, path, id)); },
};

/* ---------- helpers ---------- */
const nowISO = () => new Date().toISOString();
const thisMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const dateTR = (iso, opts) => {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  return isNaN(d) ? '' : d.toLocaleDateString('tr-TR', opts || { day: 'numeric', month: 'long', year: 'numeric' });
};
const monthTR = m => {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
};
const daysUntil = d => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(d + 'T00:00:00') - t) / 86400000);
};
const slug = n => (String(n || '').toLocaleLowerCase('tr')
  .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'uye';
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const members = () => CONFIG.members.map(m => m.name);
const colorOf = name => { const i = members().indexOf(name); return i >= 0 ? `var(--m${(i % 3) + 1})` : 'var(--muted)'; };
const avatar = (name, size = '') => `<span class="av ${size}" style="--c:${colorOf(name)}" aria-hidden="true">${esc((name || '?').charAt(0).toLocaleUpperCase('tr'))}</span>`;
const bookById = id => S.books.find(b => b.id === id);
const avgRating = b => { const v = Object.values(b.ratings || {}).filter(x => x > 0); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; };
const sortedBooks = () => [...S.books].sort((a, b) => (b.month || b.at || '').localeCompare(a.month || a.at || '') || (b.at || '').localeCompare(a.at || ''));
// The book being read now: among "okunuyor", the earliest month (the one whose meeting comes first).
const currentBook = () => {
  const reading = S.books.filter(b => (b.status || 'okunuyor') === 'okunuyor').sort((a, b) => (a.month || '').localeCompare(b.month || ''));
  return reading[0] || sortedBooks()[0];
};
const nextPicker = () => {
  const ms = members();
  const picked = [...S.books].filter(b => b.pickedBy).sort((a, b) => (a.month || a.at || '').localeCompare(b.month || b.at || '') || (a.at || '').localeCompare(b.at || ''));
  const last = picked[picked.length - 1];
  const i = last ? ms.indexOf(last.pickedBy) : -1;
  return ms[(i + 1) % ms.length];
};
const myProgress = b => (b.progress || {})[slug(S.me)] || 0;
const pagesOf = b => (b.info && b.info.pages) || 0;
const kindOf = n => n.kind === 'web' ? 'info' : n.kind === 'pre' ? 'own' : n.kind;
const coverSrc = b => b.coverData || b.coverUrl || '';
const voteCount = s => Object.values(s.votes || {}).filter(Boolean).length;
const stripHTML = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

let toastTimer;
const toast = t => { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3000); };
function fail(err) {
  console.error(err);
  if (err && err.code === 'permission-denied') return toast('Bu işlem için iznin yok. Kulüp üyesi hesabıyla giriş yaptığından emin ol.');
  toast('Kaydedilemedi: ' + (err && err.message ? err.message : 'bilinmeyen hata'));
}
const upd = (id, data) => { if (fs && id) db.patch('books', id, data).catch(fail); };

const stars = (v, editId) => editId
  ? `<span class="stars edit">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${i <= v ? 'on' : ''}" data-act="rate" data-id="${esc(editId)}" data-v="${i}" aria-label="${i} yıldız">★</button>`).join('')}</span>`
  : `<span class="stars" role="img" aria-label="${v ? v.toFixed(1) : 0} yıldız">${[1, 2, 3, 4, 5].map(i => `<span class="st${i <= Math.round(v) ? ' on' : ''}">★</span>`).join('')}</span>`;

function coverHTML(b, cls = '') {
  const src = coverSrc(b);
  if (src) return `<div class="cover ${cls}"><img src="${esc(src)}" alt="${esc(b.title)} kapağı" loading="lazy" referrerpolicy="no-referrer"></div>`;
  return `<div class="cover ph ${cls}" style="--h:${hash(b.title || '') % 360}" role="img" aria-label="${esc(b.title)}"><span class="ph-rule"></span><span class="ph-t">${esc(b.title)}</span><span class="ph-a">${esc(b.author || '')}</span></div>`;
}
const glowHTML = b => {
  const src = coverSrc(b);
  return src ? `<div class="glow" style="background-image:url('${esc(src)}')"></div>` : `<div class="glow ph" style="--h:${hash(b.title || '') % 360}"></div>`;
};

function progRow(b, name) {
  const p = (b.progress || {})[slug(name)] || 0;
  const mine = name === S.me;
  const pages = pagesOf(b);
  const pg = pages ? ` · s. ${Math.round(p / 100 * pages)}/${pages}` : '';
  return `<li style="--c:${colorOf(name)}">
    <div class="prow">${avatar(name, 'sm')}<span>${esc(name)}${mine ? ' <span class="muted small">(sen)</span>' : ''}</span><span class="pct"><b>%${p}</b>${pg}</span></div>
    ${mine
      ? `<div class="pgrow"><input type="number" min="0" id="prog-${esc(b.id)}" value="${(b.pageRead || {})[slug(name)] || ''}" placeholder="Sayfa" data-change="page" data-id="${esc(b.id)}" aria-label="Okuduğun sayfa">${pages ? `<span class="muted small">/ ${pages}</span>` : '<span class="muted small">sayfa sayısını girin</span>'}</div>`
      : `<div class="bar"><span style="width:${p}%"></span></div>`}
  </li>`;
}

// A note written further into the book than you are stays covered until you catch up.
const aheadOfMe = (n, b) => b && n.by !== S.me && typeof n.pct === 'number' && n.pct > myProgress(b);

function noteHTML(n, b) {
  const ahead = aheadOfMe(n, b);
  const hidden = (n.spoiler || ahead) && !S.reveal.has(n.id);
  const isMember = members().includes(n.by);
  const col = 'books/' + S.bookId + '/notes';
  const why = ahead
    ? `${esc(n.by)} bunu kitabın %${n.pct}'indeyken yazdı, sen %${myProgress(b)}'desin. Görmek için dokun.`
    : 'Spoiler içeriyor. Görmek için dokun.';
  return `<li class="note">
    <div class="nm">${isMember ? avatar(n.by, 'sm') : `<span class="av sm bot" aria-hidden="true">✦</span>`}<strong>${esc(n.by || 'Adsız')}</strong><span class="muted small">${esc(dateTR(n.at, { day: 'numeric', month: 'short' }))}${typeof n.pct === 'number' ? ' · %' + n.pct + ' noktasında' : ''}</span>${n.auto ? '<span class="badge">otomatik · doğrulayın</span>' : ''}${n.spoiler ? '<span class="badge sp">spoiler</span>' : ''}${delBtn(n, col)}</div>
    ${hidden ? `<button type="button" class="spoiler" data-act="reveal" data-id="${esc(n.id)}">${why}</button>` : `<p class="nt">${esc(n.text)}</p>`}
    ${n.source ? `<p class="src"><a href="${esc(n.source)}" target="_blank" rel="noopener">Kaynağa git</a></p>` : ''}
  </li>`;
}
const delBtn = (n, col) => n.by === S.me
  ? `<button type="button" class="del${S.armed === n.id ? ' armed' : ''}" data-act="del" data-col="${esc(col)}" data-id="${esc(n.id)}">${S.armed === n.id ? 'Silinsin mi?' : 'Sil'}</button>`
  : '';

const pad = n => String(n).padStart(2, '0');
function calendarLink(b) {
  if (!b.meetingDate) return '';
  const d = b.meetingDate.replace(/-/g, '');
  let dates;
  if (b.meetingTime) {
    const [h, m] = b.meetingTime.split(':').map(Number);
    const end = new Date(2000, 0, 1, h + 2, m);
    dates = `${d}T${pad(h)}${pad(m)}00/${d}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
  } else {
    const nx = new Date(b.meetingDate + 'T00:00:00'); nx.setDate(nx.getDate() + 1);
    dates = `${d}/${nx.getFullYear()}${pad(nx.getMonth() + 1)}${pad(nx.getDate())}`;
  }
  const q = new URLSearchParams({ action: 'TEMPLATE', text: `Kitap kulübü: ${b.title}`, dates, ctz: 'Europe/Istanbul', details: `${b.title}${b.author ? ' – ' + b.author : ''}`, location: b.meetingPlace || '' });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}

function rsvpBlock(b, bare) {
  const r = b.rsvp || {};
  const mine = r[slug(S.me)] || '';
  const label = { geliyor: ['Geliyor', 'y'], belki: ['Belki', 'm'], gelemiyor: ['Gelemiyor', 'n'] };
  return `<div class="rsvp"${bare ? ' style="margin:0;padding:0;border:0"' : ''}>
    <div class="rsvp-row"><span class="small muted">Sen:</span><span class="seg" role="group" aria-label="Katılım">${RSVP.map(([k, l, c]) => `<button type="button" class="${mine === k ? 'on ' + c : ''}" data-act="rsvp" data-id="${esc(b.id)}" data-v="${k}" aria-pressed="${mine === k}">${l}</button>`).join('')}</span></div>
    <div class="faces">${members().map(n => { const v = r[slug(n)]; return `<span>${avatar(n, 'sm')}${esc(n)} ${v ? `<span class="st-${label[v][1]}">${label[v][0]}</span>` : '<span class="muted">yanıt yok</span>'}</span>`; }).join('')}</div>
  </div>`;
}

/* ---------- book lookup (Google Books + Open Library) ---------- */
async function searchBooks(title, author) {
  const out = [];
  const gq = `intitle:${title}${author ? ' inauthor:' + author : ''}`;
  const key = CONFIG.googleBooksKey ? '&key=' + encodeURIComponent(CONFIG.googleBooksKey) : '';
  const google = fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gq)}&maxResults=12&printType=books${key}`)
    .then(r => r.ok ? r.json() : null)
    .then(j => (j && j.items || []).map(it => {
      const v = it.volumeInfo || {};
      const img = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
      return {
        from: 'Google Books', title: v.title || '', author: (v.authors || []).join(', '),
        cover: img ? img.replace(/^http:/, 'https:').replace('&edge=curl', '') : '',
        pages: v.pageCount || 0, year: parseInt(v.publishedDate, 10) || 0, publisher: v.publisher || '',
        genre: (v.categories || [])[0] || '', description: stripHTML(v.description), link: v.infoLink || '',
      };
    }))
    .catch(() => []);
  const olParams = new URLSearchParams({ title, fields: 'key,title,author_name,cover_i,number_of_pages_median,first_publish_year,publisher', limit: '10' });
  if (author) olParams.set('author', author);
  const ol = fetch('https://openlibrary.org/search.json?' + olParams)
    .then(r => r.ok ? r.json() : null)
    .then(j => (j && j.docs || []).map(d => ({
      from: 'Open Library', title: d.title || '', author: (d.author_name || []).join(', '),
      cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
      pages: d.number_of_pages_median || 0, year: d.first_publish_year || 0, publisher: (d.publisher || [])[0] || '',
      genre: '', description: '', link: d.key ? 'https://openlibrary.org' + d.key : '',
    })))
    .catch(() => []);
  const [g, o] = await Promise.all([google, ol]);
  out.push(...g, ...o);
  return out;
}

// Once per book: fills missing facts, author, cover and a description from the first good match.
async function autoLookup(b) {
  if (looking.size || b.lookupAt || !fs) return;
  looking.add(b.id);
  try {
    await db.patch('books', b.id, { lookupAt: nowISO() });
    const found = await searchBooks(b.title, b.author);
    S.finds[b.id] = found;
    if (!found.length) return;
    const best = found.find(x => x.cover && x.from === 'Google Books') || found.find(x => x.cover) || found[0];
    const any = k => (found.find(x => x[k]) || {})[k];
    const cur = b.info || {};
    const info = {
      ...cur,
      pages: cur.pages || best.pages || any('pages') || null,
      year: cur.year || any('year') || null,
      publisher: cur.publisher || best.publisher || any('publisher') || null,
      genre: cur.genre || best.genre || any('genre') || null,
    };
    const patch = { info };
    if (!b.author && best.author) patch.author = best.author;
    if (!coverSrc(b) && best.cover) patch.coverUrl = best.cover;
    await db.patch('books', b.id, patch);
    const desc = best.description || any('description');
    if (desc) await db.add('books/' + b.id + '/notes', { kind: 'info', by: best.description ? best.from : 'Google Books', auto: true, text: 'Tanıtım: ' + desc, at: nowISO() });
  } catch (e) { console.error(e); } finally {
    looking.delete(b.id);
    setTimeout(lookupNext, 0);
  }
}
function lookupNext() {
  const b = S.books.find(x => !x.lookupAt && !looking.has(x.id));
  if (b) autoLookup(b);
}

async function findCovers(id) {
  const b = bookById(id);
  if (!b) return;
  S.finding.add(id);
  render();
  S.finds[id] = await searchBooks(b.title, b.author);
  S.finding.delete(id);
  render();
}

// Shrinks a photo to a cover-sized JPEG so it fits inside the book's record.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 600 / img.naturalHeight, 400 / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- views ---------- */
function viewSetup() {
  return `<div class="card empty"><h2>Site kuruluyor</h2><p class="muted">Veritabanı ayarları henüz eklenmedi. Kurulum bitince burada kulübünüz açılacak.</p></div>`;
}
function viewLogin() {
  return `
  <section class="hero login">
    <div class="glow ph" style="--h:330"></div>
    <div class="hero-body" style="grid-column:1/-1">
      <div class="hb-text">
        <p class="label">Aslı · Ebrar · Şebnem</p>
        <h2 class="hero-title">Kitap Kulübü</h2>
        <p class="hero-author">Her ay bir kitap, ay sonunda buluşma. Devam etmek için Google hesabınla giriş yap.</p>
      </div>
      <div class="actions"><button type="button" class="btn accent" data-act="login">${googleG()}Google ile giriş yap</button></div>
      ${S.denied ? `<p class="small" style="color:var(--accent)"><b>${esc(S.user && S.user.email)}</b> kulüp üyeleri listesinde yok. Kulüpteki e-postanla giriş yap.</p>` : ''}
    </div>
  </section>`;
}
const googleG = () => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3zM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22zM6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9zM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.8 9.4 6 12 6z"/></svg>';

function viewHome() {
  const b = currentBook();
  if (!b) return `<div class="page-head"><h1>Bu ay</h1></div><div class="card empty"><h2>Henüz kitap yok</h2><p class="muted">İlk kitabınızı Kitaplık'tan ekleyin.</p><button type="button" class="btn accent" data-act="nav" data-view="kitaplik">Kitaplığa git</button></div>`;
  ensureNotes(b.id);
  const id = esc(b.id);
  const d = b.meetingDate ? daysUntil(b.meetingDate) : null;
  const ms = members();
  const np = nextPicker();
  const info = b.info || {};
  const themes = (info.themes || []).slice(0, 4).map(t => `<span class="chip">${esc(t)}</span>`).join('');
  const meta = [info.year, info.pages ? info.pages + ' sayfa' : '', info.genre].filter(Boolean).map(esc).join(' · ');
  const avgP = Math.round(ms.reduce((s, n) => s + ((b.progress || {})[slug(n)] || 0), 0) / ms.length);
  const top = S.sugg.filter(s => !s.adoptedBookId).sort((x, y) => voteCount(y) - voteCount(x))[0];
  const feed = (S.notes[b.id] || []).filter(n => !n.auto && ['own', 'quote', 'meeting'].includes(kindOf(n))).slice(-4).reverse();
  const later = S.books.filter(x => x.id !== b.id && (x.status || 'okunuyor') !== 'tamamlandi' && (x.month || '') >= (b.month || '')).sort((x, y) => (x.month || '').localeCompare(y.month || ''));
  return `
  <div class="page-head"><div><p class="label">${esc(b.month ? monthTR(b.month) : 'Bu ay')}</p><h1>Şu an okuduğumuz</h1></div></div>
  <section class="hero">
    ${glowHTML(b)}
    ${coverHTML(b, 'lg')}
    <div class="hero-body">
      <div class="hb-text">
        <h2 class="hero-title">${esc(b.title)}</h2>
        <p class="hero-author">${esc(b.author || '')}</p>
        <div class="meta">${b.pickedBy ? `<span>${avatar(b.pickedBy, 'sm')}${esc(b.pickedBy)} seçti</span>` : ''}${meta ? `<span>${meta}</span>` : ''}</div>
      </div>
      ${themes ? `<div class="chips">${themes}</div>` : ''}
      <div class="actions">
        <button type="button" class="btn accent" data-act="open" data-id="${id}">Kitabın sayfası</button>
        <button type="button" class="btn ghost" data-act="open" data-id="${id}" data-tab="soru">Tartışma soruları</button>
      </div>
    </div>
  </section>
  <div class="grid3">
    <section class="card">
      <h3>${icon('cal')}Toplantı</h3>
      ${b.meetingDate ? `
        <p class="big">${d > 0 ? d + '<small>gün kaldı</small>' : d === 0 ? 'Bugün' : 'Yapıldı'}</p>
        <div class="facts-inline">
          <span>${icon('cal')}${esc(dateTR(b.meetingDate, { weekday: 'long', day: 'numeric', month: 'long' }))}</span>
          ${b.meetingTime ? `<span>${icon('clock')}${esc(b.meetingTime)}</span>` : ''}
          ${b.meetingPlace ? `<span>${icon('pin')}${esc(b.meetingPlace)}</span>` : ''}
          ${b.host ? `<span>${icon('house')}Ev sahibi: ${esc(b.host)}</span>` : ''}
        </div>
        ${d >= 0 ? rsvpBlock(b) : ''}
        <div class="actions" style="margin-top:14px">
          <a class="btn ghost sm" href="${esc(calendarLink(b))}" target="_blank" rel="noopener">${icon('cal')}Takvime ekle</a>
          <button type="button" class="linkbtn" data-act="open" data-id="${id}" data-tab="toplanti">Düzenle</button>
        </div>` : `
        <p class="muted">Tarih henüz belli değil.</p>
        <div class="actions" style="margin-top:12px"><button type="button" class="btn ghost sm" data-act="open" data-id="${id}" data-tab="toplanti">${icon('plus')}Tarih ve yer ekle</button></div>`}
    </section>
    <section class="card">
      <h3>${icon('books')}Okuma durumu <span class="count pct">ort. %${avgP}</span></h3>
      <ul class="prog">${ms.map(n => progRow(b, n)).join('')}</ul>
    </section>
    <section class="card">
      <h3>${icon('spark')}Sıradaki seçen</h3>
      <div class="next">${avatar(np, 'lg')}<div><p class="big" style="font-size:28px">${esc(np)}</p><p class="small muted">bir sonraki kitabı seçecek</p></div></div>
      <p class="order">${ms.map(n => `<span class="${n === np ? 'on' : ''}">${esc(n)}</span>`).join('<span>→</span>')}</p>
      ${later.length ? `<p class="small muted" style="margin-top:10px">Planlanan: ${later.map(x => `<button type="button" class="linkbtn" style="font-size:13px" data-act="open" data-id="${esc(x.id)}">${esc(x.title)}</button>${x.month ? ' (' + esc(monthTR(x.month)) + ')' : ''}`).join(', ')}</p>` : ''}
      ${top ? `<button type="button" class="toppick" data-act="nav" data-view="oneriler"><span class="label">En çok oy alan öneri</span><b>${esc(top.title)}</b><span class="small muted">${esc(top.author || '')} · ${voteCount(top)} oy</span></button>` : ''}
    </section>
  </div>
  <section class="card">
    <h3>${icon('chat')}Kulüpte son yazılanlar</h3>
    ${feed.length ? `<ul class="feed">${feed.map(n => {
      const hide = (n.spoiler || aheadOfMe(n, b)) && !S.reveal.has(n.id);
      const k = kindOf(n);
      return `<li>${avatar(n.by)}<div style="min-width:0"><p class="small"><strong>${esc(n.by)}</strong> <span class="muted">${k === 'quote' ? 'bir alıntı ekledi' : k === 'meeting' ? 'toplantı notu yazdı' : 'not yazdı'} · ${esc(dateTR(n.at, { day: 'numeric', month: 'short' }))}</span></p>
        ${hide ? `<button type="button" class="linkbtn small" data-act="open" data-id="${id}" data-tab="${k === 'quote' ? 'alinti' : k === 'meeting' ? 'toplanti' : 'once'}">Spoiler olabilir, kitabın sayfasında aç</button>` : `<p class="ft${k === 'quote' ? ' q' : ''}">${k === 'quote' ? '“' + esc(n.text) + '”' : esc(n.text)}</p>`}</div></li>`;
    }).join('')}</ul>` : `<p class="muted">Henüz not yok. Okurken aklına geleni <button type="button" class="linkbtn" data-act="open" data-id="${id}" data-tab="once">Toplantı öncesi</button> bölümüne, sevdiğin cümleleri <button type="button" class="linkbtn" data-act="open" data-id="${id}" data-tab="alinti">Alıntılar</button>'a ekle.</p>`}
  </section>`;
}

function viewLibrary() {
  const ms = members();
  const done = S.books.filter(b => b.status === 'tamamlandi');
  const pages = done.reduce((s, b) => s + pagesOf(b), 0);
  const rated = S.books.map(b => [b, avgRating(b)]).filter(([, a]) => a > 0).sort((x, y) => y[1] - x[1]);
  const clubAvg = rated.length ? rated.reduce((s, [, a]) => s + a, 0) / rated.length : 0;
  const f = S.shelfFilter;
  const list = sortedBooks().filter(b => f === 'all' || (b.status || 'okunuyor') === f);
  const count = k => S.books.filter(b => (b.status || 'okunuyor') === k).length;
  const shelf = list.map(b => {
    const a = avgRating(b);
    return `<button type="button" class="bcard" data-act="open" data-id="${esc(b.id)}">
      ${coverHTML(b)}
      <span class="bc-t">${esc(b.title)}</span>
      <span class="bc-a">${esc(b.author || '—')}</span>
      <span class="bc-m"><span class="pill s-${esc(b.status || 'okunuyor')}">${esc(STATUS[b.status] || 'Okunuyor')}</span>${b.month ? esc(monthTR(b.month)) : ''}${a ? stars(a) : ''}</span>
    </button>`;
  }).join('');
  return `
  <div class="page-head">
    <div><p class="label">${S.books.length} kitap</p><h1>Kitaplık</h1></div>
    <button type="button" class="btn accent" data-act="toggle-add">${S.showAdd ? 'Kapat' : icon('plus') + 'Yeni kitap'}</button>
  </div>
  ${S.showAdd ? addForm() : ''}
  <div class="stats">
    <div class="stat"><b>${done.length}</b><span>Bitirilen kitap</span></div>
    <div class="stat"><b>${pages ? pages.toLocaleString('tr-TR') : '–'}</b><span>Okunan sayfa</span></div>
    <div class="stat"><b>${clubAvg ? clubAvg.toFixed(1) : '–'}</b><span>Kulüp puan ortalaması</span></div>
    <div class="stat"><b class="t">${rated.length ? esc(rated[0][0].title) : '–'}</b><span>En sevilen</span></div>
  </div>
  <div class="toolbar">
    <div class="filters" role="group" aria-label="Duruma göre süz">
      ${[['all', 'Tümü', S.books.length], ['okunuyor', 'Okunuyor', count('okunuyor')], ['sirada', 'Sırada', count('sirada')], ['tamamlandi', 'Tamamlandı', count('tamamlandi')]]
        .map(([k, l, c]) => `<button type="button" class="${f === k ? 'on' : ''}" data-act="shelf" data-f="${k}" aria-pressed="${f === k}">${l} ${c}</button>`).join('')}
    </div>
    <div class="picks">${ms.map(n => `<span>${avatar(n, 'sm')}${esc(n)} <b>${S.books.filter(b => b.pickedBy === n).length}</b> seçim</span>`).join('')}</div>
  </div>
  <div class="shelf">
    ${shelf}
    ${S.showAdd ? '' : `<button type="button" class="addcard" data-act="toggle-add">${icon('plus')}Kitap ekle</button>`}
  </div>`;
}

function addForm() {
  const ms = members();
  return `
  <form class="card stack" data-form="book">
    <h3>Yeni kitap</h3>
    <div class="row2">
      <label>Kitap adı<input id="nb-title" name="title" required autocomplete="off" data-draft></label>
      <label>Yazar<input id="nb-author" name="author" autocomplete="off" data-draft placeholder="Bilmiyorsan boş bırak"></label>
    </div>
    <div class="row2">
      <label>Seçen<select id="nb-picker" name="pickedBy" data-draft>${ms.map(n => `<option${n === nextPicker() ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <label>Ay<input id="nb-month" type="month" name="month" value="${thisMonth()}" data-draft></label>
    </div>
    <div class="actions">
      <label class="btn ghost sm" style="display:inline-flex;color:var(--ink)">${icon('img')}${S.newPhoto ? 'Fotoğrafı değiştir' : 'Kapak fotoğrafı ekle'}<input class="sr" type="file" accept="image/*" data-change="nbphoto"></label>
      <span class="muted small">${esc(S.photoMsg || 'İsteğe bağlı. Kapağın resmini buraya yapıştırabilirsin de.')}</span>
    </div>
    <p class="muted small">Kitabı ekleyince kapak, sayfa sayısı, yayın yılı ve tanıtım yazısı Google Books ve Open Library'den otomatik aranır.</p>
    <div class="actions"><button class="btn accent" type="submit">Kitabı ekle</button><button type="button" class="btn ghost" data-act="toggle-add">Vazgeç</button></div>
  </form>`;
}

function viewSugg() {
  const open = S.sugg.filter(s => !s.adoptedBookId);
  const adopted = S.sugg.filter(s => s.adoptedBookId);
  open.sort((a, b) => voteCount(b) - voteCount(a) || (a.at || '').localeCompare(b.at || ''));
  const item = (s, i) => {
    const voted = !!(s.votes && s.votes[slug(S.me)]);
    const voters = members().filter(n => s.votes && s.votes[slug(n)]);
    return `<li class="card sugg">
      ${s.adoptedBookId ? `<span class="rank">✓</span>` : `<button type="button" class="vote${voted ? ' on' : ''}" data-act="vote" data-id="${esc(s.id)}" aria-pressed="${voted}" aria-label="Oy ver">${icon('heart')}<span>${voteCount(s)}</span></button>`}
      <div class="stack">
        ${i === 0 && !s.adoptedBookId && voteCount(s) ? '<span class="label" style="color:var(--accent)">En çok oy alan</span>' : ''}
        <h3>${esc(s.title)}</h3>
        ${s.author ? `<p class="muted">${esc(s.author)}</p>` : ''}
        ${s.why ? `<p class="nt">${esc(s.why)}</p>` : ''}
        <p class="who small">${avatar(s.by, 'sm')}<span>${esc(s.by)} önerdi</span>${voters.length ? `<span class="muted">· Beğenenler: ${voters.map(esc).join(', ')}</span>` : ''}</p>
        ${s.adoptedBookId ? '<p><span class="pill s-tamamlandi">Kulübe seçildi</span></p>' : `
        <div class="actions">
          <button type="button" class="btn ghost sm" data-act="adopt" data-id="${esc(s.id)}">Okuyacağımız kitap yap</button>
          ${delBtn(s, 'suggestions')}
        </div>`}
      </div>
    </li>`;
  };
  const np = nextPicker();
  return `
  <div class="page-head"><div><p class="label">Sıradaki seçimi ${esc(np)} yapacak</p><h1>Öneriler</h1></div></div>
  <div class="cols">
    <div class="stack" style="gap:12px">
      ${open.length ? `<ul class="notes" style="gap:12px;margin:0">${open.map(item).join('')}</ul>` : '<div class="card empty"><p class="muted">Henüz öneri yok. Okumak istediğin ilk kitabı sen ekle.</p></div>'}
      ${adopted.length ? `<h3 style="margin-top:10px">Seçilmiş öneriler</h3><ul class="notes" style="margin:0">${adopted.map(item).join('')}</ul>` : ''}
    </div>
    <form class="card stack" data-form="sugg">
      <h3>Kitap öner</h3>
      <p class="muted small">Okumak istediğin kitapları ekle, beğendiklerinize kalp verin. Sırası gelen kişi en çok kalp alanlardan seçebilir.</p>
      <label>Kitap adı<input id="sg-title" name="title" required autocomplete="off" data-draft></label>
      <label>Yazar<input id="sg-author" name="author" autocomplete="off" data-draft></label>
      <label>Neden bu kitap?<textarea id="sg-why" name="why" rows="3" data-draft></textarea></label>
      <div class="actions"><button class="btn accent" type="submit">Öneriyi ekle</button></div>
    </form>
  </div>`;
}

function viewBook() {
  const b = bookById(S.bookId);
  if (!b) { S.view = 'kitaplik'; return viewLibrary(); }
  ensureNotes(b.id);
  const id = esc(b.id);
  const a = avgRating(b);
  const info = b.info || {};
  const list = S.notes[b.id] || [];
  const n = k => list.filter(x => kindOf(x) === k).length;
  const counts = { once: n('info') + n('own'), alinti: n('quote'), soru: n('question'), toplanti: n('meeting') };
  const body = { genel: tabGeneral, once: tabBefore, alinti: tabQuotes, soru: tabQuestions, toplanti: tabMeeting, yazar: tabAuthor, bilgi: tabInfo }[S.tab] || tabGeneral;
  return `
  <nav class="crumbs"><button type="button" data-act="back">${icon('back')}Kitaplık</button><span>/</span><span>${esc(b.title)}</span></nav>
  <section class="hero">
    ${glowHTML(b)}
    ${coverHTML(b, 'lg')}
    <div class="hero-body">
      <div class="hb-text">
        <div class="meta"><span class="pill s-${esc(b.status || 'okunuyor')}">${esc(STATUS[b.status] || 'Okunuyor')}</span>${b.month ? `<span>${esc(monthTR(b.month))}</span>` : ''}</div>
        <h2 class="hero-title">${esc(b.title)}</h2>
        <p class="hero-author">${esc(b.author || 'Yazar belirtilmedi')}</p>
        <div class="meta">
          ${b.pickedBy ? `<span>${avatar(b.pickedBy, 'sm')}${esc(b.pickedBy)} seçti</span>` : ''}
          <span>${stars(a)}${a ? a.toFixed(1) : 'Puan yok'}</span>
          ${info.pages ? `<span>${esc(info.pages)} sayfa</span>` : ''}
        </div>
      </div>
    </div>
  </section>
  <nav class="subtabs" aria-label="Kitap bölümleri">
    ${TABS.map(([k, label]) => `<button type="button" class="${S.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}" aria-pressed="${S.tab === k}">${label}${counts[k] ? `<span class="n">${counts[k]}</span>` : ''}</button>`).join('')}
  </nav>
  ${body(b, id)}`;
}

function coverFinder(b, id) {
  const q = encodeURIComponent([b.title, b.author].filter(Boolean).join(' '));
  const finds = (S.finds[b.id] || []).filter(x => x.cover);
  const busy = S.finding.has(b.id);
  return `
  <div class="finder">
    <div class="actions">
      <button type="button" class="btn sm" data-act="find" data-id="${id}" ${busy ? 'disabled' : ''}>${icon('search')}${busy ? 'Aranıyor...' : 'Kapakları ara'}</button>
      <span class="muted small">Google Books ve Open Library'de arar.</span>
    </div>
    ${finds.length ? `<div class="cands">${finds.slice(0, 12).map((x, i) => `<button type="button" class="cand${coverSrc(b) === x.cover ? ' on' : ''}" data-act="pick" data-id="${id}" data-i="${i}" title="${esc(x.title)} · ${esc(x.from)}"><img src="${esc(x.cover)}" alt="${esc(x.title)}" loading="lazy" referrerpolicy="no-referrer"><span>${esc(x.from)}</span></button>`).join('')}</div>`
      : S.finds[b.id] && !busy ? '<p class="muted small">Bu adla kapak bulunamadı. Aşağıdaki yollardan birini dene.</p>' : ''}
    <details class="more">
      <summary>Bulunamadıysa: kendin ekle</summary>
      <div class="finder" style="margin-top:12px">
        <div class="find-links">
          <a class="btn ghost sm" href="https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${q}" target="_blank" rel="noopener">Kitapyurdu'nda bul${icon('ext')}</a>
          <a class="btn ghost sm" href="https://www.google.com/search?tbm=isch&q=${q}%20kitap%20kapa%C4%9F%C4%B1" target="_blank" rel="noopener">Google Görseller${icon('ext')}</a>
        </div>
        <ol class="steps">
          <li>Bağlantılardan birinde kapağı bul.</li>
          <li>Resme sağ tıkla (telefonda basılı tut) ve <b>Resmi kopyala</b>'yı seç.</li>
          <li>Aşağıdaki kutuya tıkla ve yapıştır (Ctrl+V, telefonda basılı tut, <b>Yapıştır</b>).</li>
        </ol>
        <div class="paste" id="paste-${id}" contenteditable="true" role="textbox" aria-label="Kapak resmini buraya yapıştır" data-paste="${id}" spellcheck="false"><span><b>Kapak resmini buraya yapıştır</b><br>ya da resim dosyasını sürükleyip bırak</span></div>
        <div class="actions">
          <label class="btn ghost sm" style="display:inline-flex;color:var(--ink)">${icon('img')}Bilgisayardan / telefondan seç<input class="sr" type="file" accept="image/*" data-change="cover" data-id="${id}"></label>
        </div>
      </div>
    </details>
  </div>`;
}

function tabGeneral(b, id) {
  const info = b.info || {};
  const facts = [['Özgün adı', info.originalTitle], ['İlk yayın', info.year], ['Sayfa', info.pages], ['Tür', info.genre], ['Yayınevi', info.publisher]].filter(([, v]) => v);
  const themes = (info.themes || []).map(t => `<span class="chip">${esc(t)}</span>`).join('');
  const summary = (S.notes[b.id] || []).find(n => n.auto && /^(Özet|Tanıtım):/.test(n.text || ''));
  return `
  <div class="cols">
    <div class="stack" style="gap:18px">
      <section class="card">
        <h3>Kitap hakkında</h3>
        ${summary ? `<p class="about">${esc(summary.text.replace(/^(Özet|Tanıtım):\s*/, ''))}</p>` : ''}
        ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : `<p class="muted small" style="margin-bottom:12px">${looking.has(b.id) ? 'Bilgiler aranıyor...' : 'Bilgiler henüz eklenmedi.'}</p>`}
        ${themes ? `<div class="chips">${themes}</div>` : ''}
        <div class="sec">
          <div class="row2">
            <label>Durum<select id="g-status" data-change="status" data-id="${id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${(b.status || 'okunuyor') === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
            <label>Ay<input id="g-month" type="month" data-change="month" data-id="${id}" value="${esc(b.month || '')}"></label>
          </div>
          <div class="row2">
            <label>Yazar<input id="g-author" data-change="author" data-id="${id}" value="${esc(b.author || '')}" autocomplete="off"></label>
            <label>Sayfa sayısı<input id="g-pages" type="number" min="1" inputmode="numeric" data-change="pages" data-id="${id}" value="${esc(info.pages || '')}"></label>
          </div>
        </div>
      </section>
      <section class="card">
        <h3>${icon('img')}${coverSrc(b) ? 'Kapağı değiştir' : 'Kapak ekle'}</h3>
        ${coverFinder(b, id)}
      </section>
    </div>
    <div class="stack" style="gap:18px">
      <section class="card">
        <h3>Puanlar ${avgRating(b) ? `<span class="count pct">ort. ${avgRating(b).toFixed(1)}</span>` : ''}</h3>
        ${members().map(n => `<div class="rate-row">${avatar(n, 'sm')}<span>${esc(n)}${n === S.me ? ' <span class="muted small">(sen)</span>' : ''}</span>${n === S.me ? stars((b.ratings || {})[slug(n)] || 0, b.id) : stars((b.ratings || {})[slug(n)] || 0)}</div>`).join('')}
      </section>
      <section class="card">
        <h3>Okuma durumu</h3>
        <ul class="prog">${members().map(n => progRow(b, n)).join('')}</ul>
      </section>
      ${readerCard(b, id)} <section class="card"><button type="button" class="btn ghost sm" data-act="del" data-col="books" data-id="${id}">${S.armed === b.id ? 'Emin misin? Tekrar tıkla' : 'Kitabı sil'}</button></section>
    </div>
  </div>`;
}

// StoryGraph-style reader profile: each member tags mood, pace and focus; the club view is the share of members per tag.
function readerCard(b, id) {
  const ms = members();
  const mood = b.mood || {};
  const pace = b.pace || {};
  const focus = b.focus || {};
  const me = slug(S.me);
  const reviewers = ms.filter(n => Object.values(mood[slug(n)] || {}).some(Boolean) || pace[slug(n)] || focus[slug(n)]);
  const share = pred => reviewers.length ? Math.round(ms.filter(n => pred(slug(n))).length / reviewers.length * 100) : 0;
  const moodRows = MOODS.map(t => [t, share(k => (mood[k] || {})[t])]).filter(([, p]) => p > 0).sort((x, y) => y[1] - x[1]);
  const legacy = Object.entries(b.ease || {}).filter(([, v]) => v).map(([t]) => t);
  const pick = (field, map, opts) => `<span class="seg" role="group">${opts.map(([k, l]) => `<button type="button" class="${map[me] === k ? 'on' : ''}" data-act="${field}" data-id="${id}" data-v="${k}" aria-pressed="${map[me] === k}">${l}</button>`).join('')}</span>`;
  const majority = (map, opts) => {
    const c = {}; ms.forEach(n => { const v = map[slug(n)]; if (v) c[v] = (c[v] || 0) + 1; });
    const top = Object.entries(c).sort((x, y) => y[1] - x[1])[0];
    return top ? (opts.find(([k]) => k === top[0]) || [])[1] : '';
  };
  return `
  <section class="card">
    <h3>Kulübün gözünden ${reviewers.length ? `<span class="count pct">${reviewers.length}/${ms.length} kişi</span>` : ''}</h3>
    ${reviewers.length ? `
      <div class="facts" style="margin-bottom:14px">
        <div><dt>Tempo</dt><dd>${esc(majority(pace, PACE) || '–')}</dd></div>
        <div><dt>Odak</dt><dd>${esc(majority(focus, FOCUS) || '–')}</dd></div>
      </div>
      ${moodRows.length ? `<ul class="moodbars">${moodRows.map(([t, p]) => `<li><span>${esc(t)}</span><span class="bar"><span style="width:${p}%"></span></span><span class="pct">%${p}</span></li>`).join('')}</ul>` : ''}`
    : `<p class="muted small">Okudukça bu kitabın sana nasıl geldiğini aşağıdan işaretle. Herkesin işaretlediği bir araya gelir.</p>`}
    ${legacy.length ? `<div class="chips" style="margin-top:12px">${legacy.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
    <div class="sec">
      <h4>Senin için nasıldı, ${esc(S.me)}?</h4>
      <div class="tags">${MOODS.map((t, i) => `<label class="chk"><input type="checkbox" id="mood-${i}" data-change="mood" data-id="${id}" value="${esc(t)}"${(mood[me] || {})[t] ? ' checked' : ''}>${esc(t)}</label>`).join('')}</div>
      <div class="rsvp-row" style="margin-top:6px"><span class="small muted" style="min-width:52px">Tempo</span>${pick('pace', pace, PACE)}</div>
      <div class="rsvp-row"><span class="small muted" style="min-width:52px">Odak</span>${pick('focus', focus, FOCUS)}</div>
    </div>
  </section>`;
}

function tabBefore(b) {
  const list = S.notes[b.id] || [];
  const infos = list.filter(n => kindOf(n) === 'info');
  let own = list.filter(n => kindOf(n) === 'own');
  if (S.ownFilter !== 'all') own = own.filter(n => n.by === S.ownFilter);
  return `
  <div class="cols">
    <section class="card">
      <h3>Okurken notlarımız</h3>
      <div class="filters" style="margin-bottom:14px">
        <button type="button" class="${S.ownFilter === 'all' ? 'on' : ''}" data-act="filter" data-f="all">Herkes</button>
        ${members().map(n => `<button type="button" class="${S.ownFilter === n ? 'on' : ''}" data-act="filter" data-f="${esc(n)}">${esc(n)}</button>`).join('')}
      </div>
      <ul class="notes">${own.map(n => noteHTML(n, b)).join('') || '<li class="muted small">Henüz not yok.</li>'}</ul>
      <form class="stack" data-form="own">
        <textarea id="f-own" name="text" rows="3" required placeholder="Kitap ve yazar hakkında düşüncelerin" data-draft></textarea>
        <label class="chk" style="justify-self:start"><input id="f-own-sp" type="checkbox" name="spoiler" data-draft>Spoiler içeriyor</label>
        <p class="muted small">Notun, kitabın neresinde olduğunla (%${myProgress(b)}) birlikte kaydedilir. Henüz oraya gelmemiş olanlar için kapalı durur.</p>
        <div class="actions"><button class="btn accent sm" type="submit">Notumu ekle</button></div>
      </form>
    </section>
    <section class="card">
      <h3>Kitap ve yazar bilgileri</h3>
      <p class="muted small" style="margin:-6px 0 12px">Otomatik gelen tanıtım ve internetten bulduklarınız.</p>
      <ul class="notes">${infos.map(n => noteHTML(n, b)).join('') || '<li class="muted small">Henüz bilgi yok.</li>'}</ul>
      <form class="stack" data-form="info">
        <textarea id="f-info" name="text" rows="2" required placeholder="Bulduğun bilgi" data-draft></textarea>
        <input id="f-info-src" name="source" type="url" placeholder="Kaynak bağlantısı (https://...)" autocomplete="off" data-draft>
        <div class="actions"><button class="btn sm" type="submit">Bilgi ekle</button></div>
      </form>
    </section>
  </div>`;
}

function tabQuotes(b) {
  const list = (S.notes[b.id] || []).filter(n => kindOf(n) === 'quote');
  const col = 'books/' + b.id + '/notes';
  return `
  <div class="cols">
    <section class="card">
      <h3>${icon('quote')}Alıntılar</h3>
      <ul class="notes">${list.map(n => {
        const hide = aheadOfMe(n, b) && !S.reveal.has(n.id);
        return `<li class="note quote">
          ${hide ? `<button type="button" class="spoiler" data-act="reveal" data-id="${esc(n.id)}">${esc(n.by)} bu alıntıyı kitabın %${n.pct}'inden ekledi. Görmek için dokun.</button>` : `<blockquote>${esc(n.text)}</blockquote>`}
          <div class="nm" style="margin:10px 0 0">${avatar(n.by, 'sm')}<span class="small"><strong>${esc(n.by)}</strong>${n.page ? ' · s. ' + esc(n.page) : ''}</span>${delBtn(n, col)}</div>
        </li>`;
      }).join('') || '<li class="muted small">Henüz alıntı yok. Altını çizdiğin cümleleri buraya ekle.</li>'}</ul>
    </section>
    <form class="card stack" data-form="quote">
      <h3>Alıntı ekle</h3>
      <textarea id="f-quote" name="text" rows="4" required placeholder="Sevdiğin cümle" data-draft></textarea>
      <label>Sayfa<input id="f-quote-page" name="page" type="number" min="1" inputmode="numeric" data-draft></label>
      <div class="actions"><button class="btn accent sm" type="submit">Alıntıyı ekle</button></div>
    </form>
  </div>`;
}

function tabQuestions(b, id) {
  const list = (S.notes[b.id] || []).filter(n => kindOf(n) === 'question');
  const col = 'books/' + b.id + '/notes';
  const done = list.filter(n => n.done).length;
  return `
  <div class="cols">
    <section class="card">
      <h3>Tartışma soruları ${list.length ? `<span class="count pct">${done}/${list.length} konuşuldu</span>` : ''}</h3>
      ${list.length ? `<div class="meter"><span style="width:${Math.round(done / list.length * 100)}%"></span></div>` : '<p class="muted small" style="margin-bottom:12px">Toplantıda konuşmak istediğiniz soruları ekleyin.</p>'}
      <ul class="notes">${list.map(n => `<li class="note q${n.done ? ' done' : ''}">
        <button type="button" class="check" data-act="qdone" data-id="${esc(n.id)}" aria-pressed="${!!n.done}" aria-label="Konuşuldu olarak işaretle">${icon('check')}</button>
        <div style="min-width:0"><p class="qt nt">${esc(n.text)}</p><div class="nm" style="margin:6px 0 0"><span class="muted small">${esc(n.by)}</span>${n.auto ? '<span class="badge">Claude</span>' : ''}${delBtn(n, col)}</div></div>
      </li>`).join('')}</ul>
      ${b.genericAdded ? '' : `<button type="button" class="btn ghost sm" data-act="generic" data-id="${id}">Her kitaba uyan 8 soruyu ekle</button>`}
    </section>
    <form class="card stack" data-form="question">
      <h3>Soru ekle</h3>
      <p class="muted small">Her birimiz toplantıya bir iki soru getirirse sohbet daha güzel akar.</p>
      <textarea id="f-q" name="text" rows="3" required placeholder="Sormak istediğin soru" data-draft></textarea>
      <div class="actions"><button class="btn accent sm" type="submit">Soruyu ekle</button></div>
    </form>
  </div>`;
}

function tabMeeting(b, id) {
  const list = (S.notes[b.id] || []).filter(n => kindOf(n) === 'meeting');
  const att = b.attended || {};
  const d = b.meetingDate ? daysUntil(b.meetingDate) : null;
  return `
  <div class="cols">
    <section class="card">
      <h3>${icon('cal')}Toplantı bilgileri</h3>
      <div class="stack">
        <div class="row2">
          <label>Tarih<input id="m-date" type="date" data-change="mdate" data-id="${id}" value="${esc(b.meetingDate || '')}"></label>
          <label>Saat<input id="m-time" type="time" data-change="mtime" data-id="${id}" value="${esc(b.meetingTime || '')}"></label>
        </div>
        <div class="row2">
          <label>Yer<input id="m-place" data-change="mplace" data-id="${id}" value="${esc(b.meetingPlace || '')}" placeholder="Kafe, ev, park..." autocomplete="off"></label>
          <label>Ev sahibi<select id="m-host" data-change="host" data-id="${id}"><option value="">Seçilmedi</option>${members().map(n => `<option${b.host === n ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        </div>
        ${b.meetingDate ? `<div class="actions"><a class="btn ghost sm" href="${esc(calendarLink(b))}" target="_blank" rel="noopener">${icon('cal')}Google Takvim'e ekle</a></div>` : ''}
      </div>
      ${b.meetingDate && d >= 0 ? `<div class="sec"><h4>Kim geliyor?</h4>${rsvpBlock(b, true)}</div>` : ''}
      <div class="sec">
        <h4>Toplantıya kimler geldi?</h4>
        <div class="attend">${members().map(n => `<button type="button" class="${att[slug(n)] ? 'on' : ''}" data-act="attend" data-id="${id}" data-name="${esc(n)}" aria-pressed="${!!att[slug(n)]}">${avatar(n, 'sm')}${esc(n)}</button>`).join('')}</div>
        <p class="muted small">Toplantı bitince Genel'den puanını ver ve durumu "Tamamlandı" yap.</p>
      </div>
    </section>
    <section class="card">
      <h3>Toplantı notları</h3>
      <ul class="notes">${list.map(n => noteHTML(n, b)).join('') || '<li class="muted small">Henüz not yok.</li>'}</ul>
      <form class="stack" data-form="meeting">
        <textarea id="f-meet" name="text" rows="3" required placeholder="Toplantıda konuşulanlar, kararlar, güzel anlar" data-draft></textarea>
        <div class="actions"><button class="btn accent sm" type="submit">Not ekle</button></div>
      </form>
    </section>
  </div>`;
}

/* ---------- render ---------- */
function renderChrome() {
  const signedIn = !!S.me;
  const who = signedIn
    ? `<div class="whoami" style="--c:${colorOf(S.me)}">${avatar(S.me)}<div><b>${esc(S.me)}</b><span>${esc(S.user && S.user.email)}</span></div></div><button type="button" class="linkbtn small" data-act="logout">${icon('out')}Çıkış yap</button>`
    : '';
  $('#me-side').innerHTML = who;
  $('#me-top').innerHTML = signedIn ? `<button type="button" class="avbtn" data-act="logout" aria-label="${esc(S.me)}, çıkış yap" title="Çıkış yap">${avatar(S.me)}</button>` : '';
  const active = S.view === 'kitap' ? 'kitaplik' : S.view;
  const navBtns = signedIn ? VIEWS.map(([k, l, ic]) => `<button type="button" class="${active === k ? 'on' : ''}" data-act="nav" data-view="${k}" aria-current="${active === k ? 'page' : 'false'}">${icon(ic)}<span>${l}</span></button>`).join('') : '';
  $('#snav').innerHTML = navBtns;
  $('#tabbar').innerHTML = navBtns;
  $('#tabbar').hidden = !signedIn;
}

function render() {
  renderChrome();
  const view = $('#view');
  const act = document.activeElement;
  const focusId = act && view.contains(act) && act.id ? act.id : null;
  let sel = null;
  try { if (focusId && typeof act.selectionStart === 'number') sel = [act.selectionStart, act.selectionEnd]; } catch (e) {}
  const keep = {};
  view.querySelectorAll('[data-draft]').forEach(el => { if (el.id) keep[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
  if (focusId && act.type !== 'checkbox' && act.type !== 'file' && act.value !== undefined) keep[focusId] = act.value;
  const openDetails = [...view.querySelectorAll('details[open]')].length > 0;

  if (!configured) view.innerHTML = viewSetup();
  else if (!S.authReady) view.innerHTML = '<div class="skel" aria-label="Yükleniyor"></div>';
  else if (!S.me && !viewerOf(S.user)) view.innerHTML = viewLogin();
  else if (S.loadError) view.innerHTML = `<div class="card empty"><h2>Kayıtlar açılamadı</h2><p class="muted">${esc(S.loadError)}</p></div>`;
  else if (!S.loaded) view.innerHTML = '<div class="skel" aria-label="Kulüp yükleniyor"></div>';
  else view.innerHTML = S.view === 'kitap' ? viewBook() : S.view === 'kitaplik' ? viewLibrary() : S.view === 'oneriler' ? viewSugg() : S.view === 'profil' ? viewProfile() : viewHome();

  if (openDetails) view.querySelectorAll('details.more').forEach(d => { d.open = true; });
  for (const [id, v] of Object.entries(keep)) {
    const el = document.getElementById(id);
    if (!el || el.value === undefined) continue;
    if (el.type === 'checkbox') el.checked = v; else el.value = v;
  }
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus({ preventScroll: true });
      if (sel) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
    }
  }
}

function go(view, extra = {}) {
  Object.assign(S, { view }, extra);
  const h = view === 'kitap' ? 'kitap-' + S.bookId : view;
  try { history.replaceState(null, '', '#' + h); } catch (err) {}
  window.scrollTo(0, 0);
  render();
}
function readHash() {
  const h = decodeURIComponent((location.hash || '').slice(1));
  if (h.startsWith('kitap-')) { S.view = 'kitap'; S.bookId = h.slice(6); S.tab = 'genel'; }
  else if (['buay', 'kitaplik', 'oneriler'].includes(h)) S.view = h;
}
readHash();
window.addEventListener('hashchange', () => { readHash(); render(); });

/* ---------- data ---------- */
function ensureNotes(id) {
  if (!fs || noteSubs[id]) return;
  noteSubs[id] = db.watch('books/' + id + '/notes', list => {
    S.notes[id] = list.sort((a, b) => (a.at || '').localeCompare(b.at || ''));
    render();
  });
  subs.push(noteSubs[id]);
}

async function takePhoto(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) return toast('Bu bir resim değil.');
  S.newPhoto = file;
  S.photoMsg = 'Resim kapak olarak eklenecek.';
  render();
}

async function newBook({ title, author, pickedBy, month }, photo) {
  const data = {
    title, author, pickedBy, month: month || thisMonth(), status: 'okunuyor',
    meetingDate: '', meetingTime: '', meetingPlace: '', host: '',
    ratings: {}, progress: {}, attended: {}, rsvp: {}, at: nowISO(),
  };
  if (photo) { try { data.coverData = await shrink(photo); } catch (e) { toast('Resim okunamadı, kapak sonra eklenebilir.'); } }
  const ref = await db.add('books', data);
  S.showAdd = false;
  go('kitap', { bookId: ref.id, tab: 'genel' });
  return ref;
}

async function uploadFile(id, file) {
  if (!file || !/^image\//.test(file.type)) return toast('Bu bir resim değil. Resmin kendisini kopyala, bağlantısını değil.');
  toast('Kapak ekleniyor...');
  try {
    const data = await shrink(file);
    await db.patch('books', id, { coverData: data, coverUrl: '' });
    toast('Kapak eklendi');
  } catch (err) { fail(err); }
}

const imageFrom = dt => {
  if (!dt) return null;
  const f = [...(dt.files || [])].find(x => /^image\//.test(x.type));
  if (f) return f;
  for (const it of [...(dt.items || [])]) if (it.kind === 'file' && /^image\//.test(it.type)) return it.getAsFile();
  return null;
};

async function addGeneric(id) {
  const start = Date.now();
  try {
    await db.patch('books', id, { genericAdded: true });
    for (let i = 0; i < GENERIC_Q.length; i++) {
      await db.add('books/' + id + '/notes', { kind: 'question', by: 'Genel soru', done: false, text: GENERIC_Q[i], at: new Date(start + i).toISOString() });
    }
  } catch (err) { fail(err); }
}

async function adopt(sid) {
  const s = S.sugg.find(x => x.id === sid);
  if (!s) return;
  try {
    const ref = await newBook({ title: s.title, author: s.author || '', pickedBy: nextPicker(), month: thisMonth() });
    await db.patch('suggestions', sid, { adoptedBookId: ref.id });
  } catch (err) { fail(err); }
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act;
  const id = el.dataset.id;
  if (a !== 'del') S.armed = null;
  switch (a) {
    case 'login': login(); break;
    case 'logout': if (auth) signOut(auth); break;
    case 'nav': go(el.dataset.view); break;
    case 'open': go('kitap', { bookId: id, tab: el.dataset.tab || 'genel' }); break;
    case 'back': go('kitaplik'); break;
    case 'tab': S.tab = el.dataset.tab; render(); break;
    case 'toggle-add': S.showAdd = !S.showAdd; if (S.view !== 'kitaplik') go('kitaplik'); else render(); break;
    case 'filter': S.ownFilter = el.dataset.f; render(); break;
    case 'shelf': S.shelfFilter = el.dataset.f; render(); break;
    case 'reveal': S.reveal.add(id); render(); break;
    case 'rate': upd(id, { ratings: { [slug(S.me)]: Number(el.dataset.v) } }); break;
    case 'rsvp': upd(id, { rsvp: { [slug(S.me)]: el.dataset.v } }); break;
    case 'pace': case 'focus': {
      const b = bookById(id);
      const cur = b && (b[a] || {})[slug(S.me)];
      upd(id, { [a]: { [slug(S.me)]: cur === el.dataset.v ? '' : el.dataset.v } });
      break;
    }
    case 'attend': {
      const b = bookById(id);
      const k = slug(el.dataset.name);
      if (b) upd(id, { attended: { [k]: !(b.attended && b.attended[k]) } });
      break;
    }
    case 'vote': {
      const s = S.sugg.find(x => x.id === id);
      const k = slug(S.me);
      if (s) db.patch('suggestions', id, { votes: { [k]: !(s.votes && s.votes[k]) } }).catch(fail);
      break;
    }
    case 'adopt': adopt(id); break;
    case 'qdone': {
      const n = (S.notes[S.bookId] || []).find(x => x.id === id);
      if (n) db.patch('books/' + S.bookId + '/notes', id, { done: !n.done }).catch(fail);
      break;
    }
    case 'tstart': startTimer(document.getElementById('timer-book') ? document.getElementById('timer-book').value : ''); break; case 'tstop': stopTimer(); break; case 'msave': saveMusic(); break; case 'generic': addGeneric(id); break;
    case 'find': findCovers(id); break;
    case 'pick': {
      const x = (S.finds[id] || []).filter(c => c.cover)[Number(el.dataset.i)];
      if (x) { upd(id, { coverUrl: x.cover, coverData: '' }); toast('Kapak seçildi'); }
      break;
    }
    case 'del':
      if (S.armed === id) {
        S.armed = null;
        db.remove(el.dataset.col, id).catch(fail);
      } else {
        S.armed = id;
      }
      render();
      break;
  }
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.change) {
    case 'status': upd(id, { status: el.value }); break;
    case 'month': upd(id, { month: el.value }); break;
    case 'author': upd(id, { author: el.value.trim() }); break;
    case 'pages': upd(id, { info: { pages: Number(el.value) || null } }); break;
    case 'mdate': upd(id, { meetingDate: el.value }); break;
    case 'mtime': upd(id, { meetingTime: el.value }); break;
    case 'mplace': upd(id, { meetingPlace: el.value.trim() }); break;
    case 'host': upd(id, { host: el.value }); break;
    case 'mood': upd(id, { mood: { [slug(S.me)]: { [el.value]: el.checked } } }); break;
    case 'progress': upd(id, { progress: { [slug(S.me)]: Number(el.value) } }); break; case 'page': { const b = bookById(id); const pg = Number(el.value) || 0; const pct = pagesOf(b) ? Math.min(100, Math.round(pg / pagesOf(b) * 100)) : 0; upd(id, { progress: { [slug(S.me)]: pct }, pageRead: { [slug(S.me)]: pg } }); break; } case 'page': { const b = bookById(id); const pg = Number(el.value) || 0; const pct = pagesOf(b) ? Math.min(100, Math.round(pg / pagesOf(b) * 100)) : 0; upd(id, { progress: { [slug(S.me)]: pct }, pageRead: { [slug(S.me)]: pg } }); break; }
    case 'cover': { const f = el.files && el.files[0]; el.value = ''; if (f) uploadFile(id, f); break; }
    case 'nbphoto': { const f = el.files && el.files[0]; el.value = ''; takePhoto(f); break; }
  }
});

// Pasting an image anywhere on a book page (or into the new-book form) makes it the cover.
document.addEventListener('paste', e => {
  if (!S.me) return;
  const img = imageFrom(e.clipboardData);
  const zone = e.target.closest && e.target.closest('[data-paste]');
  if (zone) e.preventDefault();
  if (!img) {
    if (zone) toast('Panoda resim yok. Kapak resmine sağ tıklayıp "Resmi kopyala"yı seç.');
    return;
  }
  if (S.view === 'kitaplik' && S.showAdd) { e.preventDefault(); takePhoto(img); return; }
  if (S.view === 'kitap' && S.bookId) { e.preventDefault(); uploadFile(S.bookId, img); }
});
document.addEventListener('beforeinput', e => { if (e.target.closest && e.target.closest('[data-paste]') && e.inputType !== 'insertFromPaste') e.preventDefault(); });
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('[data-paste]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('[data-paste]'); if (z) z.classList.remove('over'); });
document.addEventListener('drop', e => {
  const z = e.target.closest && e.target.closest('[data-paste]');
  if (!z) return;
  e.preventDefault();
  z.classList.remove('over');
  const img = imageFrom(e.dataTransfer);
  if (img) uploadFile(z.dataset.paste, img);
  else toast('Resim dosyası bırak. Sitelerden sürüklenen resimler bazen gelmez; o zaman kopyala-yapıştır dene.');
});

document.addEventListener('submit', async e => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  const f = form.elements;
  try {
    if (kind === 'book') {
      const title = f.title.value.trim();
      if (!title) return;
      const data = { title, author: f.author.value.trim(), pickedBy: f.pickedBy.value, month: f.month.value };
      const photo = S.newPhoto;
      Object.assign(S, { newPhoto: null, photoMsg: '' });
      form.reset();
      await newBook(data, photo);
      return;
    }
    if (kind === 'sugg') {
      const title = f.title.value.trim();
      if (!title) return;
      await db.add('suggestions', { title, author: f.author.value.trim(), why: f.why.value.trim(), by: S.me, votes: { [slug(S.me)]: true }, at: nowISO() });
      form.reset();
      toast('Öneri eklendi');
      return;
    }
    const text = f.text.value.trim();
    if (!text || !S.bookId) return;
    const b = bookById(S.bookId);
    const data = { kind, by: S.me, text, at: nowISO() };
    if (kind === 'info' && f.source) {
      const src = f.source.value.trim();
      if (src && !/^https:\/\//.test(src)) return toast('Kaynak bağlantısı https:// ile başlamalı.');
      if (src) data.source = src;
    }
    if (kind === 'own' && f.spoiler && f.spoiler.checked) data.spoiler = true;
    if ((kind === 'own' || kind === 'quote') && b) data.pct = myProgress(b);
    if (kind === 'quote' && f.page && f.page.value) data.page = Number(f.page.value);
    if (kind === 'question') data.done = false;
    await db.add('books/' + S.bookId + '/notes', data);
    form.reset();
    toast('Eklendi');
  } catch (err) { fail(err); }
});

/* ---------- auth + start ---------- */
async function login() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) return signInWithRedirect(auth, provider);
    if (err && err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') toast('Giriş yapılamadı: ' + (err.message || err.code));
  }
}

function startData() {
  subs.push(db.watch('books', list => { S.books = list; S.loaded = true; render(); lookupNext(); }));
  subs.push(db.watch('suggestions', list => { S.sugg = list; render(); }));
}
function stopData() {
  while (subs.length) { try { subs.pop()(); } catch (e) {} }
  for (const k of Object.keys(noteSubs)) delete noteSubs[k];
  Object.assign(S, { books: [], sugg: [], notes: {}, loaded: false });
}

function init() {
  render();
  if (!configured) return;
  const app = initializeApp(CONFIG.firebase);
  auth = getAuth(app);
  auth.languageCode = 'tr';
  fs = getFirestore(app);
  onAuthStateChanged(auth, user => {
    stopData();
    S.user = user;
    S.authReady = true;
    const m = user && CONFIG.members.find(x => x.email && x.email.toLowerCase() === String(user.email || '').toLowerCase());
    S.me = m ? m.name : '';
    S.denied = !!user && !m && !viewerOf(user);
    if (S.me || viewerOf(user)) startData();
    render();
  });
}
init();

// Exposed for the one-time move from the old Claude page (see README).
window.kulupImport = async (url = 'tasima.json') => {
  if (!S.me) return console.warn('Önce giriş yap.');
  const existing = await getDocs(collection(fs, 'books'));
  if (!existing.empty) return console.warn('Kitaplık boş değil, taşıma yapılmadı.');
  const data = await (await fetch(url)).json();
  for (const b of data.books || []) {
    const { id, notes = [], ...rest } = b;
    await setDoc(doc(fs, 'books', id), rest);
    for (const n of notes) { const { id: nid, ...nr } = n; await setDoc(doc(fs, 'books/' + id + '/notes', nid), nr); }
  }
  for (const s of data.suggestions || []) { const { id, ...rest } = s; await setDoc(doc(fs, 'suggestions', id), rest); }
  console.log('Taşıma bitti.');
};
// Kitap bilgileri: kitap-bilgi.json dosyasından yazar notu, künye ve ilginç bilgiler gelir.
let KITAP_BILGI = {};
fetch('kitap-bilgi.json', { cache: 'no-store' })
.then(r => (r.ok ? r.json() : {}))
.then(j => { KITAP_BILGI = j || {}; if (S.view === 'kitap') render(); })
.catch(() => {});
const bilgiOf = b => KITAP_BILGI[b.id] || {};
function tabAuthor(b) {
const extra = bilgiOf(b).yazar || {};
const name = extra.ad || b.author || 'Yazar belirtilmedi';
const others = S.books.filter(x => x.id !== b.id && b.author && x.author === b.author);
return `<section class="card"><h3>Yazar</h3><h2>${esc(name)}</h2><p class="about">${esc(extra.not || 'Bu yazar hakkında bilgi henüz eklenmedi.')}</p>${others.length ? `<p class="small muted">Kulüpte bu yazarın diğer kitapları: ${others.map(x => esc(x.title)).join(', ')}</p>` : ''}</section>`;
}
function tabInfo(b) {
const info = b.info || {};
const extra = bilgiOf(b);
const rows = [['Yazar', b.author], ['Orijinal ad', extra.orijinal], ['Yayınevi', info.publisher], ['Yıl', info.year], ['Sayfa', info.pages], ['Tür', info.genre]].filter(r => r[1]);
const facts = extra.bilgi || [];
return `<section class="card"><h3>Künye</h3>${rows.length ? `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '<p class="muted">Künye bilgisi henüz yok.</p>'}</section><section class="card"><h3>İlginç bilgiler</h3>${facts.length ? `<ul class="feed">${facts.map(t => `<li><span>✦</span><span class="ft">${esc(t)}</span></li>`).join('')}</ul>` : '<p class="muted">Henüz bilgi eklenmedi.</p>'}</section>`;
}
// Salt okunur izleyici: CONFIG.viewers listesindeki e-postalar kitapları görebilir, yazamaz.
function viewerOf(u) {
return !!u && (CONFIG.viewers || []).some(e => e.toLowerCase() === String(u.email || '').toLowerCase());
}
// Profil sayfası: okuma zamanlayıcısı, müzik bağlantısı ve oturum geçmişi
let TIMER = null;
try { TIMER = JSON.parse(localStorage.getItem('kulup-timer') || 'null'); } catch (e) { TIMER = null; }
let PROFILE_SUB = false, SESSION_SUB = false;
const fmtSure = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ' sa ' : '') + m + ' dk ' + String(x).padStart(2, '0') + ' sn'; };
const timerElapsed = () => (TIMER ? Math.floor((Date.now() - TIMER.start) / 1000) : 0);
setInterval(() => { const el = document.getElementById('timer-out'); if (el && TIMER) el.textContent = fmtSure(timerElapsed()); }, 1000);
function startTimer(bookId) {
if (!S.me || !bookId) return toast('Önce kim olduğunu seç.');
TIMER = { bookId, start: Date.now() };
localStorage.setItem('kulup-timer', JSON.stringify(TIMER));
render();
}
async function stopTimer() {
if (!TIMER) return;
const t = TIMER;
const secs = timerElapsed();
TIMER = null;
localStorage.removeItem('kulup-timer');
if (secs >= 5 && fs) {
await db.add('sessions', { by: slug(S.me), bookId: t.bookId, seconds: secs, at: nowISO() }).catch(fail);
toast('Oturum kaydedildi');
}
render();
}
function saveMusic() {
if (!S.me) return toast('Önce kim olduğunu seç.');
let v = (document.getElementById('music-url').value || '').trim();
if (v && !/^https?:/.test(v)) v = 'https://' + v;
db.patch('profiles', slug(S.me), { name: S.me, music: v }).then(() => toast('Kaydedildi')).catch(fail);
}
function ensureSessions() {
if (SESSION_SUB || !fs) return;
SESSION_SUB = true;
onSnapshot(collection(fs, 'sessions'), snap => { S.sessions = snap.docs.filter(d => d.exists()).map(d => ({ ...d.data(), id: d.id })); if (S.view === 'profil') render(); });
}
function ensureProfiles() {
if (PROFILE_SUB || !fs) return;
PROFILE_SUB = true;
onSnapshot(collection(fs, 'profiles'), snap => { S.profiles = Object.fromEntries(snap.docs.filter(d => d.exists()).map(d => ({ ...d.data(), id: d.id })).map(d => [d.id, d])); if (S.view === 'profil') render(); });
}
function musicEmbed(url) {
if (!url) return '';
const sp = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
if (sp) return `<iframe src="https://open.spotify.com/embed/${sp[1]}/${sp[2]}" width="100%" height="152" frameborder="0" allow="encrypted-media" loading="lazy"></iframe>`;
const vid = url.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})/);
const list = (url.match(/list=([\w-]+)/) || [])[1];
if (vid) return `<iframe src="https://www.youtube.com/embed/${vid[1] || vid[2]}" width="100%" height="200" frameborder="0" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
if (list) return `<iframe src="https://www.youtube.com/embed/videoseries?list=${list}" width="100%" height="200" frameborder="0" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
return '';
}
function viewProfile() {
ensureSessions();
ensureProfiles();
if (!S.me) return `<div class="page-head"><h1>Profilim</h1></div><div class="card empty"><p class="muted">Profilini görmek için önce kim olduğunu seç.</p></div>`;
const me = slug(S.me);
const mine = (S.sessions || []).filter(s => s.by === me).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
const total = mine.reduce((a, s) => a + (s.seconds || 0), 0);
const prof = (S.profiles || {})[me] || {};
const running = TIMER ? bookById(TIMER.bookId) : null;
const opts = S.books.map(b => `<option value="${esc(b.id)}">${esc(b.title)}</option>`).join('');
return `
<div class="page-head"><div><p class="label">Profil</p><h1>${esc(S.me)}</h1></div></div>
<div class="grid3">
<section class="card"><h3>Toplam okuma</h3><p class="big">${esc(fmtSure(total))}</p><p class="small muted">${mine.length} oturum</p></section>
<section class="card"><h3>Zamanlayıcı</h3>${TIMER && running ? `<p class="big" id="timer-out">${esc(fmtSure(timerElapsed()))}</p><p class="small muted">${esc(running.title)} okunuyor</p><div class="actions" style="margin-top:12px"><button type="button" class="btn accent" data-act="tstop">Durdur ve kaydet</button></div>` : `<label>Kitap<select id="timer-book">${opts}</select></label><div class="actions" style="margin-top:12px"><button type="button" class="btn accent" data-act="tstart">Başlat</button></div>`}</section>
<section class="card"><h3>Son oturumlar</h3>${mine.length ? `<ul class="feed">${mine.slice(0, 6).map(s => `<li><span class="ft">${esc((bookById(s.bookId) || {}).title || 'Silinmiş kitap')}</span><span class="small muted">${esc(fmtSure(s.seconds || 0))}</span></li>`).join('')}</ul>` : '<p class="muted small">Henüz oturum yok.</p>'}</section>
</div>
<section class="card"><h3>Müziğim</h3>${musicEmbed(prof.music) || '<p class="muted small">Spotify ya da YouTube bağlantını ekle, burada çalsın.</p>'}
<label style="margin-top:14px">Bağlantı<input id="music-url" value="${esc(prof.music || '')}" placeholder="open.spotify.com/... ya da youtube.com/..."></label>
<div class="actions" style="margin-top:12px"><button type="button" class="btn sm" data-act="msave">Kaydet</button>${prof.music ? `<a class="btn ghost sm" href="${esc(prof.music)}" target="_blank" rel="noopener">Uygulamada aç</a>` : ''}</div></section>`;
}
