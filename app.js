import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { CONFIG } from './config.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const STATUS = { sirada: 'Sırada', okunuyor: 'Okunuyor', tamamlandi: 'Tamamlandı', birakildi: 'Bırakıldı' };
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
const VIEWS = [['buay', 'Bu ay', 'home'], ['kitaplik', 'Kitaplık', 'books'], ['oneriler', 'Öneriler', 'heart'], ['profil', 'Profilim', 'pin'], ['zamanlayici', 'Okuma köşesi', 'clock'], ['takip', 'Takip', 'chart']];
const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  books: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m16.5 4.8 3.8-1 3.2 15.4-3.8 1z" transform="translate(-2 .5)"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.3 3.6 4 7 4c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.8C19.5 15.4 12 20 12 20z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M3 20h18M6 20v-6M11 20V8M16 20v-9M21 20V4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
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
    ${hidden ? `<button type="button" class="spoiler" data-act="reveal" data-id="${esc(n.id)}">${why}</button>` : n.audio ? `<div class="vnote">${icon('mic')}<audio controls preload="none" src="${esc(n.audio)}"></audio><span class="muted small">${esc(n.dur || '')} sn</span></div>` : `<p class="nt${isMember && !n.auto && ['own', 'meeting'].includes(kindOf(n)) ? ' hand' : ''}">${esc(n.text)}</p>`}
    ${n.source ? `<p class="src"><a href="${esc(n.source)}" target="_blank" rel="noopener">Kaynağa git</a></p>` : ''}
  </li>`;
}
// Ses notları: en çok 30 sn, düşük bit hızıyla kaydedilip not belgesine data URL olarak gömülür (Storage kullanılmıyor).
// 24 kbit/sn ile 30 sn yaklaşık 120 KB eder; Firestore'un 1 MB belge sınırının çok altında.
const VOICE_MAX = 30;
let REC = null;
async function startVoice() {
  if (!S.me || !S.bookId) return toast('Önce kim olduğunu seç.');
  if (REC) return;
  if (!navigator.mediaDevices || !window.MediaRecorder) return toast('Bu tarayıcı ses kaydını desteklemiyor.');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (err) { return toast('Mikrofon izni verilmedi.'); }
  const type = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 24000 });
  const chunks = [];
  const bookId = S.bookId;
  const start = Date.now();
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    clearInterval(REC.tick);
    REC = null;
    render();
    const dur = Math.min(VOICE_MAX, Math.round((Date.now() - start) / 1000));
    if (dur < 1) return toast('Kayıt çok kısa.');
    saveVoice(new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' }), bookId, dur);
  };
  REC = { rec, tick: setInterval(() => {
    const s = Math.floor((Date.now() - start) / 1000);
    const el = document.getElementById('rec-out');
    if (el) el.textContent = `${s} / ${VOICE_MAX} sn`;
    if (s >= VOICE_MAX) stopVoice();
  }, 250) };
  rec.start();
  render();
}
function stopVoice() {
  if (REC && REC.rec.state !== 'inactive') REC.rec.stop();
}
function saveVoice(blob, bookId, dur) {
  const r = new FileReader();
  r.onload = async () => {
    if (r.result.length > 900000) return toast('Ses notu çok büyük oldu, daha kısa kaydet.');
    const b = bookById(bookId);
    const sp = document.getElementById('f-own-sp');
    const data = { kind: 'own', by: S.me, text: `Ses notu (${dur} sn)`, audio: r.result, dur, at: nowISO() };
    if (b) data.pct = myProgress(b);
    if (sp && sp.checked) data.spoiler = true;
    try { await db.add('books/' + bookId + '/notes', data); toast('Ses notu eklendi'); } catch (err) { fail(err); }
  };
  r.readAsDataURL(blob);
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

// Öneriler de kitaplık gibi ayrıntılı tutulur: eklenince kapak, künye ve tanıtım bir kez aranır.
const lookingSugg = new Set();
async function lookupSugg(s) {
  if (lookingSugg.has(s.id) || s.lookupAt || !fs) return;
  lookingSugg.add(s.id);
  try {
    await db.patch('suggestions', s.id, { lookupAt: nowISO() });
    const found = await searchBooks(s.title, s.author);
    if (!found.length) return;
    const best = found.find(x => x.cover && x.from === 'Google Books') || found.find(x => x.cover) || found[0];
    const any = k => (found.find(x => x[k]) || {})[k];
    const patch = {
      info: {
        pages: best.pages || any('pages') || null,
        year: best.year || any('year') || null,
        publisher: best.publisher || any('publisher') || null,
        genre: best.genre || any('genre') || null,
      },
      desc: best.description || any('description') || '',
    };
    if (!s.author && best.author) patch.author = best.author;
    if (!coverSrc(s) && best.cover) patch.coverUrl = best.cover;
    await db.patch('suggestions', s.id, patch);
  } catch (e) { console.error(e); } finally {
    lookingSugg.delete(s.id);
  }
}
function lookupSuggNext() {
  const s = S.sugg.find(x => !x.lookupAt && !x.adoptedBookId && !lookingSugg.has(x.id));
  if (s) lookupSugg(s);
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
      ${illus('cozy', 'login-art')}
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

// Ana sayfa: kapağın renginden beslenen koyu "sahne", altında bento kutular, alıntı şeridi, raf ve zaman çizelgesi
// Editoryal dokunuş: çok kelimeli başlıklarda son kelime italik ve vurgu renginde
const emLast = s => { const w = esc(s || '').split(' '); return w.length > 1 ? w.slice(0, -1).join(' ') + ' <em>' + w[w.length - 1] + '</em>' : w[0]; };
const coverVT = b => `view-transition-name:c-${String(b.id).replace(/[^A-Za-z0-9_-]/g, '')}`;
const ringAvatar = (name, pct) => `<span class="ravatar" style="--p:${pct};--c:${colorOf(name)}" title="${esc(name)}: %${pct}">${avatar(name)}</span>`;
function bigRing(pct, label) {
  return `<div class="bigring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="br-track"/><circle cx="60" cy="60" r="50" class="br-fill" pathLength="100" style="stroke-dashoffset:${100 - pct}"/></svg><div class="br-t"><b><span data-count="${pct}">${pct}</span>%</b><span>${esc(label)}</span></div></div>`;
}
function railItem(b) {
  const a = avgRating(b);
  return `<button type="button" class="rail-item tilt" data-act="open" data-id="${esc(b.id)}">
    <span class="rail-cover" style="${coverVT(b)}">${coverHTML(b)}</span>
    <span class="bc-t">${esc(b.title)}</span>
    <span class="bc-a">${esc(b.author || '—')}</span>
    <span class="bc-m"><span class="pill s-${esc(b.status || 'okunuyor')}">${esc(STATUS[b.status] || 'Okunuyor')}</span>${a ? stars(a) : ''}</span>
  </button>`;
}
function quoteMarquee(b) {
  const club = (S.notes[b.id] || []).filter(n => kindOf(n) === 'quote' && !n.spoiler && !aheadOfMe(n, b)).map(n => [n.text, n.by + ' · ' + b.title]);
  const favs = members().map(n => [((S.profiles || {})[slug(n)] || {}).quote, n + ' · en sevdiği alıntı']).filter(([t]) => t);
  const all = [...club, ...favs].filter(([t]) => t && t.length < 260);
  if (!all.length) return '';
  let items = all;
  while (items.length < 6) items = items.concat(all);
  const html = items.map(([t, who]) => `<figure class="mq-item"><blockquote>“${esc(t)}”</blockquote><figcaption>${esc(who)}</figcaption></figure>`).join('');
  return `<section class="marquee" aria-label="Alıntılar"><div class="mq-track">${html}${html}</div></section>`;
}
function viewHome() {
  const b = currentBook();
  if (!b) return `<div class="page-head"><h1>Bu ay</h1></div><div class="card empty"><h2>Henüz kitap yok</h2><p class="muted">İlk kitabınızı Kitaplık'tan ekleyin.</p><button type="button" class="btn accent" data-act="nav" data-view="kitaplik">Kitaplığa git</button></div>`;
  ensureNotes(b.id);
  ensureProfiles();
  const id = esc(b.id);
  const d = b.meetingDate ? daysUntil(b.meetingDate) : null;
  const ms = members();
  const np = nextPicker();
  const info = b.info || {};
  const meta = [info.year, info.pages ? info.pages + ' sayfa' : '', info.genre].filter(Boolean).map(esc).join(' · ');
  const pct = n => (b.progress || {})[slug(n)] || 0;
  const avgP = Math.round(ms.reduce((s, n) => s + pct(n), 0) / ms.length);
  const top = S.sugg.filter(s => !s.adoptedBookId).sort((x, y) => voteCount(y) - voteCount(x))[0];
  const feed = (S.notes[b.id] || []).filter(n => !n.auto && ['own', 'quote', 'meeting'].includes(kindOf(n))).slice(-5).reverse();
  const others = sortedBooks().filter(x => x.id !== b.id);
  const src = coverSrc(b);
  const bg = src ? `background-image:url('${esc(src)}')` : `background:hsl(${hash(b.title || '') % 360} 35% 35%)`;
  return `
  <section class="stage">
    <div class="stage-bg" style="${bg}"></div>
    <div class="stage-cover tilt" style="${coverVT(b)}">${coverHTML(b, 'lg')}</div>
    <div class="stage-text">
      <p class="eyebrow">${esc(b.month ? monthTR(b.month) : 'Bu ay')} · Şu an okuduğumuz</p>
      <h1 class="display">${emLast(b.title)}</h1>
      <p class="stage-author">${esc(b.author || '')}</p>
      <p class="stage-meta">${b.pickedBy ? `${esc(b.pickedBy)} seçti` : ''}${b.pickedBy && meta ? ' · ' : ''}${meta}</p>
      <div class="stage-readers">${ms.map(n => `<span class="sr-one">${ringAvatar(n, pct(n))}<span><b>${esc(n)}</b><small>%${pct(n)}</small></span></span>`).join('')}</div>
      <div class="actions">
        <button type="button" class="btn" data-act="open" data-id="${id}">Kitabın sayfası</button>
        <button type="button" class="btn glass" data-act="open" data-id="${id}" data-tab="soru">Tartışma soruları</button>
      </div>
    </div>
  </section>
  <div class="bento">
    <section class="tile tile-meet">
      <p class="eyebrow-dark"><span class="idx">01</span>Toplantı</p>
      ${b.meetingDate ? `
        <p class="mega">${d > 0 ? `<span data-count="${d}">${d}</span><small>gün kaldı</small>` : d === 0 ? 'Bugün!' : 'Yapıldı'}</p>
        <p class="tile-line">${esc(dateTR(b.meetingDate, { weekday: 'long', day: 'numeric', month: 'long' }))}${b.meetingTime ? ' · ' + esc(b.meetingTime) : ''}${b.meetingPlace ? ' · ' + esc(b.meetingPlace) : ''}</p>
        ${d >= 0 ? rsvpBlock(b) : ''}
        <div class="actions" style="margin-top:14px"><a class="btn ghost sm" href="${esc(calendarLink(b))}" target="_blank" rel="noopener">${icon('cal')}Takvime ekle</a><button type="button" class="linkbtn" data-act="open" data-id="${id}" data-tab="toplanti">Düzenle</button></div>`
      : `<p class="mega mega-soft">Tarih yok</p><p class="tile-line">Buluşma günü henüz belli değil.</p><div class="actions" style="margin-top:12px"><button type="button" class="btn ghost sm" data-act="open" data-id="${id}" data-tab="toplanti">${icon('plus')}Tarih ve yer ekle</button></div>`}
    </section>
    <section class="tile tile-prog">
      <p class="eyebrow-dark"><span class="idx">02</span>Kulübün ilerlemesi</p>
      ${bigRing(avgP, 'ortalama')}
      <ul class="prog compact">${ms.map(n => progRow(b, n)).join('')}</ul>
    </section>
    <section class="tile tile-next">
      <p class="eyebrow-dark"><span class="idx">03</span>Sıradaki seçen</p>
      <div class="next">${avatar(np, 'lg')}<div><p class="next-name">${esc(np)}</p><p class="small muted">bir sonraki kitabı seçecek</p></div></div>
      <p class="order">${ms.map(n => `<span class="${n === np ? 'on' : ''}">${esc(n)}</span>`).join('<span>→</span>')}</p>
      ${top ? `<button type="button" class="toppick" data-act="nav" data-view="oneriler"><span class="label">En çok oy alan öneri</span><b>${esc(top.title)}</b><span class="small muted">${esc(top.author || '')} · ${voteCount(top)} oy</span></button>` : ''}
    </section>
  </div>
  ${quoteMarquee(b)}
  ${filmStrip()}
  ${others.length ? `<section class="rail-section">
    <div class="rail-head"><h2 class="sec-title"><span class="idx">05</span>Rafımızda</h2><button type="button" class="linkbtn" data-act="nav" data-view="kitaplik">Tüm kitaplık →</button></div>
    <div class="rail">${others.map(railItem).join('')}</div>
  </section>` : ''}
  <section class="timeline-section">
    <h2 class="sec-title"><span class="idx">06</span>Kulüpte son yazılanlar</h2>
    ${feed.length ? `<ol class="timeline">${feed.map(n => {
      const hide = (n.spoiler || aheadOfMe(n, b)) && !S.reveal.has(n.id);
      const k = kindOf(n);
      return `<li style="--c:${colorOf(n.by)}">${avatar(n.by)}<div class="tl-body"><p class="small"><strong>${esc(n.by)}</strong> <span class="muted">${k === 'quote' ? 'bir alıntı ekledi' : k === 'meeting' ? 'toplantı notu yazdı' : n.audio ? 'ses notu bıraktı' : 'not yazdı'} · ${esc(dateTR(n.at, { day: 'numeric', month: 'short' }))}</span></p>
        ${hide ? `<button type="button" class="linkbtn small" data-act="open" data-id="${id}" data-tab="${k === 'quote' ? 'alinti' : k === 'meeting' ? 'toplanti' : 'once'}">Spoiler olabilir, kitabın sayfasında aç</button>` : `<p class="ft${k === 'quote' ? ' q' : ' hand'}">${k === 'quote' ? '“' + esc(n.text) + '”' : esc(n.text)}</p>`}</div></li>`;
    }).join('')}</ol>` : `<p class="muted">Henüz not yok. Okurken aklına geleni <button type="button" class="linkbtn" data-act="open" data-id="${id}" data-tab="once">Toplantı öncesi</button> bölümüne, sevdiğin cümleleri <button type="button" class="linkbtn" data-act="open" data-id="${id}" data-tab="alinti">Alıntılar</button>'a ekle.</p>`}
  </section>`;
}

// Kitaplık: duruma göre yana kayan raflar; her rafın altında ahşap bir pervaz
// Okunan kitap rafa konmaz (hep tek kitap olur); kitaplığın başında geniş, koyu bir spot kartında durur
const SHELVES = [['sirada', 'Sırada bekleyenler'], ['tamamlandi', 'Okuduklarımız'], ['birakildi', 'Yarım bıraktıklarımız']];
// Polaroid: beyaz çerçeve, el yazısı başlık, kitaba göre sabit hafif eğim ve renkli bant
function polaroid(b) {
  const a = avgRating(b);
  const rot = (hash(b.id) % 9) - 4;
  const tape = ['#f7c9b3', '#cfe1d4', '#f2dfa6', '#d6dcf3'][hash(b.title || '') % 4];
  return `<button type="button" class="polaroid" data-act="open" data-id="${esc(b.id)}" style="--rot:${rot}deg;--tape:${tape}">
    <span class="pol-img" style="${coverVT(b)}">${coverHTML(b)}</span>
    <span class="pol-cap">${esc(b.title)}</span>
    ${a ? `<span class="pol-stars">${stars(a)}</span>` : ''}
  </button>`;
}
function spotlight(b) {
  const src = coverSrc(b);
  const bg = src ? `background-image:url('${esc(src)}')` : `background:hsl(${hash(b.title || '') % 360} 35% 32%)`;
  const ms = members();
  const pct = n => (b.progress || {})[slug(n)] || 0;
  const d = b.meetingDate ? daysUntil(b.meetingDate) : null;
  return `<section class="spotlight">
    <div class="stage-bg" style="${bg}"></div>
    <div class="stage-cover tilt" style="${coverVT(b)}">${coverHTML(b, 'lg')}</div>
    <div class="spot-body">
      <p class="eyebrow">Şu an okuduğumuz${b.month ? ' · ' + esc(monthTR(b.month)) : ''}${d !== null && d >= 0 ? ` · toplantıya ${d === 0 ? 'bugün' : d + ' gün'}` : ''}</p>
      <h2 class="spot-title">${emLast(b.title)}</h2>
      <p class="stage-author">${esc(b.author || '')}</p>
      <ul class="spot-readers">${ms.map(n => `<li style="--c:${colorOf(n)}">${avatar(n, 'sm')}<span>${esc(n)}</span><span class="sp-bar"><span style="width:${pct(n)}%"></span></span><b>%${pct(n)}</b></li>`).join('')}</ul>
      <div class="actions"><button type="button" class="btn" data-act="open" data-id="${esc(b.id)}">Kitabın sayfası</button><button type="button" class="btn glass" data-act="open" data-id="${esc(b.id)}" data-tab="once">Notlar</button></div>
    </div>
  </section>`;
}
function viewLibrary() {
  const ms = members();
  const done = S.books.filter(b => b.status === 'tamamlandi');
  const pages = done.reduce((s, b) => s + pagesOf(b), 0);
  const rated = S.books.map(b => [b, avgRating(b)]).filter(([, a]) => a > 0).sort((x, y) => y[1] - x[1]);
  const clubAvg = rated.length ? rated.reduce((s, [, a]) => s + a, 0) / rated.length : 0;
  const rows = SHELVES.map(([k, title]) => {
    const list = sortedBooks().filter(b => (b.status || 'okunuyor') === k);
    const add = k === 'sirada' && !S.showAdd ? `<button type="button" class="addcard rail-add" data-act="toggle-add">${icon('plus')}Kitap ekle</button>` : '';
    if (!list.length && !add) return '';
    const head = `<div class="rail-head"><h2 class="sec-title">${title} <span class="count">${list.length}</span></h2></div>`;
    // Bitirdiklerimiz rafta değil, bantla tutturulmuş polaroidlerden bir kolajda
    if (k === 'tamamlandi') return `<section class="shelf-row">${head}<div class="collage">${list.map(polaroid).join('')}</div></section>`;
    return `<section class="shelf-row">
      ${head}
      <div class="rail shelf-rail">${list.map(railItem).join('')}${add}</div>
    </section>`;
  }).join('');
  return `
  <div class="page-head">
    <div><p class="label">${S.books.length} kitap</p><h1>Kitaplık</h1></div>
    <button type="button" class="btn accent" data-act="toggle-add">${S.showAdd ? 'Kapat' : icon('plus') + 'Yeni kitap'}</button>
  </div>
  ${S.showAdd ? addForm() : ''}
  <div class="numbers">
    <div><b data-count="${done.length}">${done.length}</b><span>bitirilen kitap</span></div>
    <div><b data-count="${pages}">${pages ? pages.toLocaleString('tr-TR') : '0'}</b><span>okunan sayfa</span></div>
    <div><b${clubAvg ? ` data-count="${clubAvg.toFixed(1)}" data-dec="1"` : ''}>${clubAvg ? clubAvg.toFixed(1).replace('.', ',') : '–'}</b><span>kulüp puan ortalaması</span></div>
    <div><b class="t">${rated.length ? esc(rated[0][0].title) : '–'}</b><span>en sevilen</span></div>
  </div>
  <p class="picks">${ms.map(n => `<span>${avatar(n, 'sm')}${esc(n)} <b>${S.books.filter(b => b.pickedBy === n).length}</b> seçim</span>`).join('')}</p>
  ${sortedBooks().filter(b => (b.status || 'okunuyor') === 'okunuyor').map(spotlight).join('')}
  ${rows}`;
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
    const info = s.info || {};
    const meta = [info.year, info.pages ? info.pages + ' sayfa' : '', info.genre, info.publisher].filter(Boolean).map(esc).join(' · ');
    const searching = !s.lookupAt || lookingSugg.has(s.id);
    return `<li class="card sugg sugg-rich">
      <div class="sugg-side">
        ${coverHTML(s)}
        ${s.adoptedBookId ? `<span class="rank">✓</span>` : `<button type="button" class="vote${voted ? ' on' : ''}" data-act="vote" data-id="${esc(s.id)}" aria-pressed="${voted}" aria-label="Oy ver">${icon('heart')}<span>${voteCount(s)}</span></button>`}
      </div>
      <div class="stack">
        ${i === 0 && !s.adoptedBookId && voteCount(s) ? '<span class="label" style="color:var(--accent)">En çok oy alan</span>' : ''}
        <h3>${esc(s.title)}</h3>
        ${s.author ? `<p class="muted">${esc(s.author)}</p>` : ''}
        ${meta ? `<p class="small muted">${meta}</p>` : searching && !s.adoptedBookId ? '<p class="small muted">Kitap bilgileri aranıyor...</p>' : ''}
        ${s.desc ? `<details class="sugg-desc"><summary>${esc(s.desc.slice(0, 180))}${s.desc.length > 180 ? '…' : ''}</summary><p>${esc(s.desc)}</p></details>` : ''}
        ${s.why ? `<p class="nt quote" style="padding-left:12px"><b>Neden:</b> ${esc(s.why)}</p>` : ''}
        <p class="who small">${avatar(s.by, 'sm')}<span>${esc(s.by)} önerdi</span>${voters.length ? `<span class="muted">· Beğenenler: ${voters.map(esc).join(', ')}</span>` : ''}</p>
        ${s.adoptedBookId ? `<div class="actions"><span class="pill s-tamamlandi">Kitaplıkta</span>${bookById(s.adoptedBookId) ? `<button type="button" class="btn ghost sm" data-act="open" data-id="${esc(s.adoptedBookId)}">Kitabı aç</button>` : ''}</div>` : `
        <div class="actions">
          <button type="button" class="btn sm" data-act="adopt" data-id="${esc(s.id)}">${icon('books')}Kitaplığa ekle</button>
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
      <p class="muted small">Okumak istediğin kitapları ekle, beğendiklerinize kalp verin. Kapak, sayfa sayısı ve tanıtım otomatik bulunur. Okumaya karar verince "Kitaplığa ekle" ile bütün bilgileriyle kitaplığa geçer.</p>
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
    <div class="hero-cover tilt" style="${coverVT(b)}">${coverHTML(b, 'lg')}</div>
    <div class="hero-body">
      <div class="hb-text">
        <div class="meta"><span class="pill s-${esc(b.status || 'okunuyor')}">${esc(STATUS[b.status] || 'Okunuyor')}</span>${b.month ? `<span>${esc(monthTR(b.month))}</span>` : ''}</div>
        <h2 class="hero-title">${emLast(b.title)}</h2>
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
      ${readerCard(b, id)}
      ${S.editBook === b.id ? bookEditForm(b, id) : `<section class="card"><div class="actions">
        <button type="button" class="btn ghost sm" data-act="edit" data-id="${id}">Kitabı düzenle</button>
        <button type="button" class="btn ghost sm" data-act="del" data-col="books" data-id="${id}">${S.armed === b.id ? 'Emin misin? Tekrar tıkla' : 'Kitabı sil'}</button>
      </div></section>`}
    </div>
  </div>`;
}

// Kitabın künyesini tek formdan düzenleme (ad, yazar, seçen, ay, durum ve yayın bilgileri)
function bookEditForm(b, id) {
  const info = b.info || {};
  const field = (label, name, value, type = 'text') => `<label>${label}<input id="be-${name}" name="${name}" type="${type}" value="${esc(value || '')}" autocomplete="off"${type === 'number' ? ' min="1" inputmode="numeric"' : ''}></label>`;
  return `
  <form class="card stack" id="book-edit" data-form="bookedit" data-id="${id}">
    <h3>Kitabı düzenle</h3>
    ${field('Kitabın adı', 'title', b.title)}
    <div class="row2">${field('Yazar', 'author', b.author)}${field('Orijinal ad', 'originalTitle', info.originalTitle)}</div>
    <div class="row2">
      <label>Seçen<select id="be-pickedBy" name="pickedBy"><option value="">Seçilmedi</option>${members().map(n => `<option${b.pickedBy === n ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      ${field('Ay', 'month', b.month, 'month')}
    </div>
    <div class="row2">
      <label>Durum<select id="be-status" name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${(b.status || 'okunuyor') === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      ${field('Sayfa sayısı', 'pages', info.pages, 'number')}
    </div>
    <div class="row2">${field('Yayınevi', 'publisher', info.publisher)}${field('İlk yayın yılı', 'year', info.year, 'number')}</div>
    ${field('Tür', 'genre', info.genre)}
    <div class="actions">
      <button class="btn sm" type="submit">Kaydet</button>
      <button type="button" class="btn ghost sm" data-act="edit-cancel">Vazgeç</button>
      <button type="button" class="btn ghost sm" data-act="del" data-col="books" data-id="${id}">${S.armed === b.id ? 'Emin misin? Tekrar tıkla' : 'Kitabı sil'}</button>
    </div>
  </form>`;
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
        <div class="voice">${REC
          ? `<button type="button" class="btn sm rec" data-act="vstop">Kaydı bitir ve ekle</button><span class="small muted" id="rec-out">0 / ${VOICE_MAX} sn</span>`
          : `<button type="button" class="btn ghost sm" data-act="vstart">${icon('mic')}Ses notu kaydet</button><span class="small muted">en çok ${VOICE_MAX} saniye</span>`}</div>
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
  </div>
  ${albumHTML(b)}`;
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
  else view.innerHTML = S.view === 'kitap' ? viewBook() : S.view === 'kitaplik' ? viewLibrary() : S.view === 'oneriler' ? viewSugg() : S.view === 'zamanlayici' ? viewTimer2() : S.view === 'takip' ? viewHabit() : S.view === 'profil' ? viewProfile2() : viewHome();

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
  enhance(view);
}

// Her sayfa geçişi tarayıcı geçmişine yazılır; böylece geri tuşu siteden çıkmak yerine önceki sayfaya döner.
function go(view, extra = {}) {
  Object.assign(S, { view, editBook: null }, extra);
  if (view !== 'zamanlayici' && document.body.classList.contains('focus-mode')) setFocusMode(false);
  const h = '#' + (view === 'kitap' ? 'kitap-' + S.bookId : view);
  try {
    if (location.hash !== h) history.pushState(null, '', h);
  } catch (err) {}
  pageChange(() => { window.scrollTo(0, 0); render(); });
}
function readHash() {
  const h = decodeURIComponent((location.hash || '').slice(1));
  if (h.startsWith('kitap-')) { S.view = 'kitap'; S.bookId = h.slice(6); S.tab = 'genel'; }
  else if (VIEWS.some(([k]) => k === h)) S.view = h;
  else if (!h) S.view = 'buay';
}
readHash();
window.addEventListener('popstate', () => {
  readHash();
  S.editBook = null;
  if (S.view !== 'zamanlayici') document.body.classList.remove('focus-mode');
  pageChange(() => { render(); window.scrollTo(0, 0); });
});

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

async function newBook({ title, author, pickedBy, month }, photo, extra = {}) {
  const data = {
    title, author, pickedBy, month: month || thisMonth(), status: 'okunuyor',
    meetingDate: '', meetingTime: '', meetingPlace: '', host: '',
    ratings: {}, progress: {}, attended: {}, rsvp: {}, at: nowISO(),
    ...extra,
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
    // Önerideki kapak, künye ve tanıtım kitaplığa taşınır; kitap "Sırada" olarak başlar.
    const extra = { status: 'sirada', info: s.info || {}, coverUrl: s.coverUrl || '', coverData: s.coverData || '' };
    if (s.lookupAt) extra.lookupAt = s.lookupAt;
    const ref = await newBook({ title: s.title, author: s.author || '', pickedBy: nextPicker(), month: thisMonth() }, null, extra);
    if (s.desc) await db.add('books/' + ref.id + '/notes', { kind: 'info', by: 'Google Books', auto: true, text: 'Tanıtım: ' + s.desc, at: nowISO() });
    if (s.why) await db.add('books/' + ref.id + '/notes', { kind: 'own', by: s.by, text: 'Neden önerdim: ' + s.why, pct: 0, at: nowISO() });
    await db.patch('suggestions', sid, { adoptedBookId: ref.id });
    toast('Kitaplığa eklendi');
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
    case 'tstart': startTimer2(document.getElementById('timer-book') ? document.getElementById('timer-book').value : ''); break; case 'tstop': stopTimer2(); break; case 'treset': resetTimer2(); break; case 'msave': saveMusic(); break; case 'gsave': saveGoal(); break; case 'generic': addGeneric(id); break;
    case 'edit': {
      S.editBook = id;
      render();
      const form = document.getElementById('book-edit');
      if (form) { form.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.getElementById('be-title').focus({ preventScroll: true }); }
      break;
    }
    case 'edit-cancel': S.editBook = null; render(); break;
    case 'pview': S.profileOf = el.dataset.f; S.editProfile = false; render(); break;
    case 'pedit': S.editProfile = true; render(); { const bio = document.getElementById('pf-bio'); if (bio) bio.focus(); } break;
    case 'pedit-cancel': S.editProfile = false; render(); break;
    case 'photo': openLightbox(el.dataset.book, id); break;
    case 'recapm': S.recapBack = Number(el.dataset.v) || 0; render(); break;
    case 'recapshare': shareRecap().catch(fail); break;
    case 'focusmode': setFocusMode(!document.body.classList.contains('focus-mode')); break;
    case 'vstart': startVoice(); break;
    case 'vstop': stopVoice(); break;
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
    case 'progress': upd(id, { progress: { [slug(S.me)]: Number(el.value) } }); break;
    case 'page': {
      const b = bookById(id);
      const pg = Number(el.value) || 0;
      const pct = pagesOf(b) ? Math.min(100, Math.round(pg / pagesOf(b) * 100)) : 0;
      upd(id, { progress: { [slug(S.me)]: pct }, pageRead: { [slug(S.me)]: pg } });
      break;
    }
    case 'cover': { const f = el.files && el.files[0]; el.value = ''; if (f) uploadFile(id, f); break; }
    case 'nbphoto': { const f = el.files && el.files[0]; el.value = ''; takePhoto(f); break; }
    case 'mphoto': { const files = [...(el.files || [])]; el.value = ''; uploadPhotos(id, files); break; }
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
    if (kind === 'profile') {
      const val = n => f[n].value.trim();
      await db.patch('profiles', slug(S.me), { name: S.me, bio: val('bio'), genres: val('genres'), favBook: val('favBook'), favAuthor: val('favAuthor'), quote: val('quote'), yearGoal: Number(f.yearGoal.value) || 0 });
      S.editProfile = false;
      render();
      toast('Profil kaydedildi');
      return;
    }
    if (kind === 'bookedit') {
      const title = f.title.value.trim();
      if (!title) return toast('Kitabın adı boş olamaz.');
      const num = el => Number(el.value) || null;
      await db.patch('books', form.dataset.id, {
        title, author: f.author.value.trim(), pickedBy: f.pickedBy.value, month: f.month.value, status: f.status.value,
        info: { originalTitle: f.originalTitle.value.trim(), pages: num(f.pages), publisher: f.publisher.value.trim(), year: num(f.year), genre: f.genre.value.trim() },
      });
      S.editBook = null;
      render();
      toast('Kitap güncellendi');
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
  subs.push(db.watch('suggestions', list => { S.sugg = list; render(); lookupSuggNext(); }));
}
function stopData() {
  while (subs.length) { try { subs.pop()(); } catch (e) {} }
  for (const k of Object.keys(noteSubs)) delete noteSubs[k];
  for (const k of Object.keys(photoSubs)) delete photoSubs[k];
  S.photos = {};
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
// Dosyanın sonundaki sabitler (illüstrasyonlar, hareket sistemi) tanımlandıktan sonra başlasın
queueMicrotask(init);

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
// Profil sayfası: müzik bağlantısı ve oturum geçmişi
try { localStorage.removeItem('kulup-timer'); } catch (e) {}
let PROFILE_SUB = false, SESSION_SUB = false;
const fmtSure = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ' sa ' : '') + m + ' dk ' + String(x).padStart(2, '0') + ' sn'; };
function saveMusic() {
if (!S.me) return toast('Önce kim olduğunu seç.');
let v = (document.getElementById('music-url').value || '').trim();
if (v && !/^https?:/.test(v)) v = 'https://' + v;
db.patch('profiles', slug(S.me), { name: S.me, music: v }).then(() => {
toast('Kaydedildi');
const card = document.getElementById('music-card');
if (card) card.innerHTML = musicCard2(v);
}).catch(fail);
}
function ensureSessions() {
if (SESSION_SUB || !fs) return;
SESSION_SUB = true;
onSnapshot(collection(fs, 'sessions'), snap => {
S.sessions = snap.docs.filter(d => d.exists()).map(d => ({ ...d.data(), id: d.id }));
const list = document.getElementById('timer-sessions');
if (S.view === 'profil' || S.view === 'takip') render();
else if (S.view === 'zamanlayici' && list) list.innerHTML = sessionsList2(mySessions2(), 10);
});
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
// Zamanlayıcı: serbest okuma, odak/mola döngüleri ve geri sayım
// T2.mode: 'free' (kronometre), 'cycle' (odak + mola turları), 'count' (geri sayım)
const P_FOCUS = 25 * 60, P_BREAK = 5 * 60;
const MODES2 = [
['serbest', 'Serbest', 'kronometre'],
['p25', 'Pomodoro', '25 / 5 dk'],
['p50', 'Derin odak', '50 / 10 dk'],
['p15', 'Kısa tur', '15 / 3 dk'],
['ozel', 'Özel döngü', 'kendin ayarla'],
['sayac', 'Geri sayım', 'süre seç'],
];
const CYCLES2 = { p25: [25, 5], p50: [50, 10], p15: [15, 3] };
let T2 = null;
try { T2 = JSON.parse(localStorage.getItem('kulup-timer2') || 'null'); } catch (e) { T2 = null; }
// Eski sürümden kalan zamanlayıcı ({ pomo: true/false }) yeni biçime çevrilir
if (T2 && !T2.mode) { T2.mode = T2.pomo ? 'cycle' : 'free'; T2.focus = P_FOCUS; T2.brk = P_BREAK; }
const saveT2 = () => { if (T2) localStorage.setItem('kulup-timer2', JSON.stringify(T2)); else localStorage.removeItem('kulup-timer2'); };
let TPREF = { m: 'p25', f: 30, b: 5, c: 30 };
try { TPREF = { ...TPREF, ...JSON.parse(localStorage.getItem('kulup-tmode') || '{}') }; } catch (e) {}
const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const elapsedT2 = () => Math.floor((Date.now() - T2.start) / 1000);
const phaseLenT2 = () => (T2.phase === 'focus' ? T2.focus : T2.brk);
function tickT2() {
if (!T2 || T2.mode !== 'cycle') return false;
let changed = false;
while (true) {
const len = phaseLenT2();
if ((Date.now() - T2.phaseStart) / 1000 < len) break;
if (T2.phase === 'focus') { T2.focusDone += T2.focus; T2.cycles += 1; T2.phase = 'break'; } else { T2.phase = 'focus'; }
T2.phaseStart += len * 1000;
changed = true;
}
if (changed) saveT2();
return changed;
}
function focusSecs2() {
if (!T2) return 0;
if (T2.mode === 'free') return elapsedT2();
if (T2.mode === 'count') return Math.min(elapsedT2(), T2.target);
return T2.focusDone + (T2.phase === 'focus' ? Math.floor((Date.now() - T2.phaseStart) / 1000) : 0);
}
function ringPct2() {
if (!T2) return 0;
if (T2.mode === 'free') return (elapsedT2() % 3600) / 3600;
if (T2.mode === 'count') return Math.min(1, elapsedT2() / T2.target);
return Math.min(1, (Date.now() - T2.phaseStart) / 1000 / phaseLenT2());
}
function labelT2() {
if (!T2) return '';
if (T2.mode === 'free') return mmss(elapsedT2());
if (T2.mode === 'count') return mmss(Math.max(0, T2.target - elapsedT2()));
return mmss(Math.max(0, phaseLenT2() - Math.floor((Date.now() - T2.phaseStart) / 1000)));
}
function subT2() {
if (!T2) return '';
if (T2.mode === 'free') return 'Serbest okuma';
if (T2.mode === 'count') return 'Geri sayım · ' + Math.round(T2.target / 60) + ' dk';
return (T2.phase === 'focus' ? 'Odak' : 'Mola') + ' · ' + T2.cycles + ' tur bitti';
}
// Faz değişiminde ve süre bitince kısa, yumuşak bir zil
function chime() {
try {
const ac = new (window.AudioContext || window.webkitAudioContext)();
[660, 880].forEach((f, i) => {
const o = ac.createOscillator(), g = ac.createGain();
o.frequency.value = f;
g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.25);
g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + i * 0.25 + 0.02);
g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.25 + 0.6);
o.connect(g).connect(ac.destination);
o.start(ac.currentTime + i * 0.25);
o.stop(ac.currentTime + i * 0.25 + 0.65);
});
} catch (e) {}
}
const RING_R = 54, RING_C = 2 * Math.PI * RING_R;
setInterval(() => {
if (!T2) return;
if (T2.mode === 'count' && elapsedT2() >= T2.target) { chime(); stopTimer2('Süre doldu, oturum kaydedildi'); return; }
if (tickT2()) { chime(); refreshTimer2(); return; }
const el = document.getElementById('timer-out'); if (el) el.textContent = labelT2();
const ring = document.getElementById('timer-ring'); if (ring) ring.setAttribute('stroke-dashoffset', (RING_C * (1 - ringPct2())).toFixed(1));
}, 1000);
// Zamanlayıcı sayfasında yalnızca zamanlayıcı kartı yenilenir; yan taraftaki müzik kesilmesin diye
function refreshTimer2() {
const card = document.getElementById('timer-card');
if (S.view === 'zamanlayici' && card) card.innerHTML = timerBody2();
else render();
}
function startTimer2(bookId) {
if (!S.me || !bookId) return toast('Önce kim olduğunu seç.');
const picked = document.querySelector('input[name="tmode"]:checked');
const m = picked ? picked.value : 'p25';
const num = (id, def, lo, hi) => Math.min(hi, Math.max(lo, Number((document.getElementById(id) || {}).value) || def));
const f = num('t-focus', TPREF.f, 1, 180), b = num('t-break', TPREF.b, 1, 60), c = num('t-count', TPREF.c, 1, 300);
TPREF = { m, f, b, c };
try { localStorage.setItem('kulup-tmode', JSON.stringify(TPREF)); } catch (e) {}
const now = Date.now();
T2 = { bookId, start: now, mode: 'free', phase: 'focus', phaseStart: now, focusDone: 0, cycles: 0 };
if (CYCLES2[m]) { T2.mode = 'cycle'; T2.focus = CYCLES2[m][0] * 60; T2.brk = CYCLES2[m][1] * 60; }
if (m === 'ozel') { T2.mode = 'cycle'; T2.focus = f * 60; T2.brk = b * 60; }
if (m === 'sayac') { T2.mode = 'count'; T2.target = c * 60; }
saveT2();
refreshTimer2();
}
function resetTimer2() {
T2 = null;
saveT2();
toast('Zamanlayıcı sıfırlandı');
refreshTimer2();
}
async function stopTimer2(msg) {
if (!T2) return;
const t = T2;
const secs = focusSecs2();
T2 = null;
saveT2();
refreshTimer2();
if (secs >= 5 && fs) {
await db.add('sessions', { by: slug(S.me), bookId: t.bookId, seconds: secs, at: nowISO() }).catch(fail);
toast(typeof msg === 'string' ? msg : 'Oturum kaydedildi');
}
}
// Profil: kişisel sayfa (hakkımda, favoriler, okudukları, yıllık hedef). Sayısal okuma istatistikleri Takip'te.
// Üyeler birbirinin profilini görebilir; yalnızca kendi profilini düzenleyebilir.
function finishedBy2(b, name) {
return b.status === 'tamamlandi' || ((b.progress || {})[slug(name)] || 0) >= 100;
}
function viewProfile2() {
ensureSessions();
ensureProfiles();
if (!S.me) return `<div class="page-head"><h1>Profilim</h1></div><div class="card empty"><p class="muted">Profilini görmek için önce kim olduğunu seç.</p></div>`;
const who = members().includes(S.profileOf) ? S.profileOf : S.me;
const key = slug(who);
const mineView = who === S.me;
const prof = (S.profiles || {})[key] || {};
const year = String(new Date().getFullYear());
const reading = S.books.filter(b => (b.status || 'okunuyor') === 'okunuyor');
const finished = S.books.filter(b => finishedBy2(b, who) && (b.month || b.at || '').startsWith(year));
const picked = S.books.filter(b => b.pickedBy === who);
const rated = S.books.map(b => [b, (b.ratings || {})[key] || 0]).filter(([, r]) => r > 0).sort((a, b) => b[1] - a[1]);
const genres = String(prof.genres || '').split(',').map(t => t.trim()).filter(Boolean);
const goal = Number(prof.yearGoal) || 0;
const pct = goal ? Math.min(100, Math.round(finished.length / goal * 100)) : 0;
const switcher = `<div class="filters" role="group" aria-label="Üye seç">${members().map(n => `<button type="button" class="${n === who ? 'on' : ''}" data-act="pview" data-f="${esc(n)}">${esc(n)}${n === S.me ? ' (sen)' : ''}</button>`).join('')}</div>`;
const fav = [['En sevdiğim kitap', prof.favBook], ['En sevdiğim yazar', prof.favAuthor]].filter(([, v]) => v);
const bookRow = b => `<li><button type="button" class="linkbtn" data-act="open" data-id="${esc(b.id)}">${esc(b.title)}</button><span class="small muted">${esc(b.author || '')}</span></li>`;
return `
<div class="page-head"><div><p class="label">Profil</p><h1>${mineView ? 'Profilim' : esc(who)}</h1></div>${switcher}</div>
${S.editProfile && mineView ? profileForm2(prof) : `
<section class="card prof-hero" style="--c:${colorOf(who)}">
${avatar(who, 'lg')}
<div class="stack" style="gap:6px;min-width:0">
<h2>${esc(who)}</h2>
${prof.bio ? `<p class="about" style="margin:0">${esc(prof.bio)}</p>` : `<p class="muted">${mineView ? 'Kendinden biraz bahset: ne tür kitaplar seversin, nasıl okursun?' : 'Henüz kendinden bahsetmemiş.'}</p>`}
${genres.length ? `<div class="chips">${genres.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
</div>
${mineView ? '<button type="button" class="btn ghost sm" data-act="pedit">Profili düzenle</button>' : ''}
</section>`}
<div class="grid3">
<section class="card"><h3>Favoriler</h3>
${fav.length ? `<dl class="facts" style="grid-template-columns:1fr">${fav.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
${prof.quote ? `<div class="quote"><blockquote>${esc(prof.quote)}</blockquote></div>` : ''}
${!fav.length && !prof.quote ? '<p class="muted small">Henüz favori eklenmedi.</p>' : ''}
</section>
<section class="card"><h3>${year} hedefi</h3>
<p class="big">${finished.length}<small>${goal ? ' / ' + goal + ' kitap' : ' kitap bitti'}</small></p>
${goal ? `<div class="bar goal"><span style="width:${pct}%"></span></div><p class="small muted">%${pct} tamamlandı</p>` : `<p class="small muted">${mineView ? 'Yıllık kitap hedefini profilini düzenleyerek koyabilirsin.' : 'Yıllık hedef koymamış.'}</p>`}
</section>
<section class="card"><h3>Şu an okuyor</h3>
${reading.length ? `<ul class="prog">${reading.map(b => { const p = (b.progress || {})[key] || 0; return `<li style="--c:${colorOf(who)}"><div class="prow"><button type="button" class="linkbtn" data-act="open" data-id="${esc(b.id)}">${esc(b.title)}</button><span class="pct"><b>%${p}</b></span></div><div class="bar"><span style="width:${p}%"></span></div></li>`; }).join('')}</ul>` : '<p class="muted small">Şu an okunan kitap yok.</p>'}
</section>
</div>
${badgesHTML(who)}
<div class="cols even">
<section class="card"><h3>Kulübe seçtiği kitaplar <span class="count">${picked.length}</span></h3>${picked.length ? `<ul class="feed">${picked.map(bookRow).join('')}</ul>` : '<p class="muted small">Henüz kitap seçmemiş.</p>'}</section>
<section class="card"><h3>Puanladıkları</h3>${rated.length ? `<ul class="feed">${rated.map(([b, r]) => `<li><button type="button" class="linkbtn" data-act="open" data-id="${esc(b.id)}">${esc(b.title)}</button>${stars(r)}</li>`).join('')}</ul>` : '<p class="muted small">Henüz puan vermemiş.</p>'}</section>
</div>
${mineView ? '<div class="actions"><button type="button" class="btn ghost" data-act="nav" data-view="takip">Okuma istatistiklerim →</button></div>' : ''}`;
}
function profileForm2(prof) {
const field = (label, name, ph, type = 'text') => `<label>${label}<input id="pf-${name}" name="${name}" type="${type}" value="${esc(prof[name] || '')}" placeholder="${ph}" autocomplete="off"${type === 'number' ? ' min="0" inputmode="numeric"' : ''}></label>`;
return `<form class="card stack" data-form="profile">
<h3>Profili düzenle</h3>
<label>Hakkımda<textarea id="pf-bio" name="bio" rows="3" placeholder="Ne tür kitaplar seversin, nasıl okursun?">${esc(prof.bio || '')}</textarea></label>
${field('Sevdiğim türler', 'genres', 'Virgülle ayır: roman, bilimkurgu, şiir')}
<div class="row2">${field('En sevdiğim kitap', 'favBook', 'Kitap adı')}${field('En sevdiğim yazar', 'favAuthor', 'Yazar adı')}</div>
<label>Sevdiğim bir alıntı<textarea id="pf-quote" name="quote" rows="2" placeholder="Aklından çıkmayan bir cümle">${esc(prof.quote || '')}</textarea></label>
${field('Bu yılki kitap hedefim', 'yearGoal', 'Ör. 12', 'number')}
<div class="actions"><button class="btn sm" type="submit">Kaydet</button><button type="button" class="btn ghost sm" data-act="pedit-cancel">Vazgeç</button></div>
</form>`;
}
// Gün hesapları ve Okuma köşesi (zamanlayıcı) sayfası
// Gün anahtarları yerel saate göre (Türkiye'de gece yarısından sonraki okumalar doğru güne düşsün)
const dayKey2 = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const sessDay2 = s => (s.at ? dayKey2(new Date(s.at)) : '');
function todaySecs2(mine) {
const k = dayKey2(new Date());
return mine.filter(s => sessDay2(s) === k).reduce((a, s) => a + (s.seconds || 0), 0);
}
function streakDays2(mine) {
const days = new Set(mine.map(sessDay2));
let d = new Date();
if (!days.has(dayKey2(d))) d = new Date(Date.now() - 86400000);
let n = 0;
while (days.has(dayKey2(d))) { n++; d = new Date(d.getTime() - 86400000); }
return n;
}
const mySessions2 = () => (S.sessions || []).filter(s => s.by === slug(S.me)).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
function sessionsList2(mine, n) {
if (!mine.length) return '<p class="muted small">Henüz oturum yok.</p>';
return `<ul class="feed">${mine.slice(0, n).map(s => `<li><span class="ft">${esc((bookById(s.bookId) || {}).title || 'Silinmiş kitap')}</span><span class="small muted">${esc(fmtSure(s.seconds || 0))}</span></li>`).join('')}</ul>`;
}
function musicCard2(url) {
return `<h3>Müzik</h3>
${musicEmbed(url) || '<p class="muted small">Spotify ya da YouTube bağlantını ekle, okurken burada çalsın.</p>'}
<label style="margin-top:14px">Bağlantı<input id="music-url" value="${esc(url || '')}" placeholder="open.spotify.com/... ya da youtube.com/..."></label>
<div class="actions" style="margin-top:12px"><button type="button" class="btn sm" data-act="msave">Kaydet</button>${url ? `<a class="btn ghost sm" href="${esc(url)}" target="_blank" rel="noopener">Uygulamada aç</a>` : ''}</div>`;
}
function timerBody2() {
const running = T2 ? bookById(T2.bookId) : null;
if (T2 && running) {
const phase = T2.mode === 'cycle' && T2.phase === 'break' ? ' is-break' : '';
return `<h3>Oturum</h3>
<div class="ring${phase}"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${RING_R}" fill="none" stroke="var(--line)" stroke-width="6"/><circle id="timer-ring" cx="60" cy="60" r="${RING_R}" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="${(RING_C * (1 - ringPct2())).toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div class="ring-t"><b id="timer-out">${labelT2()}</b><span>${esc(subT2())}</span></div></div>
<p class="small muted" style="text-align:center">${esc(running.title)}</p>
<div class="actions" style="justify-content:center;margin-top:14px"><button type="button" class="btn" data-act="tstop">Bitir ve kaydet</button><button type="button" class="btn ghost" data-act="treset">Sıfırla</button></div>`;
}
const opts = S.books.filter(b => b.status !== 'birakildi').map(b => `<option value="${esc(b.id)}">${esc(b.title)}</option>`).join('');
const modes = MODES2.map(([v, t, d]) => `<label class="mode"><input type="radio" name="tmode" value="${v}"${TPREF.m === v ? ' checked' : ''}><b>${t}</b><span>${d}</span></label>`).join('');
return `<h3>Oturum</h3>
${illus('tea', 'timer-art')}
<div class="tset">
<label>Kitap<select id="timer-book">${opts}</select></label>
<div class="modes" role="radiogroup" aria-label="Zamanlayıcı türü">${modes}</div>
<div class="row2 f-ozel"><label>Odak (dk)<input id="t-focus" type="number" min="1" max="180" value="${TPREF.f}"></label><label>Mola (dk)<input id="t-break" type="number" min="1" max="60" value="${TPREF.b}"></label></div>
<label class="f-sayac">Süre (dk)<input id="t-count" type="number" min="1" max="300" value="${TPREF.c}"></label>
<div class="actions"><button type="button" class="btn" data-act="tstart">Başlat</button></div>
</div>`;
}
function viewTimer2() {
ensureSessions();
ensureProfiles();
if (!S.me) return `<div class="page-head"><h1>Okuma köşesi</h1></div><div class="card empty"><p class="muted">Önce kim olduğunu seç.</p></div>`;
const prof = (S.profiles || {})[slug(S.me)] || {};
return `
<div class="page-head"><div><p class="label">Zamanlayıcı ve müzik</p><h1>Okuma köşesi</h1></div><button type="button" class="btn ghost" data-act="focusmode">Odak modu</button></div>
<button type="button" class="focus-exit btn ghost sm" data-act="focusmode">Odak modundan çık</button>
<div class="cols even timer-page">
<section class="card" id="timer-card">${timerBody2()}</section>
<section class="card" id="music-card">${musicCard2(prof.music)}</section>
</div>
<section class="card sessions-card"><h3>Son oturumlar</h3><div id="timer-sessions">${sessionsList2(mySessions2(), 10)}</div></section>`;
}
function saveGoal() {
if (!S.me) return toast('Önce kim olduğunu seç.');
const v = Math.max(0, Number(document.getElementById('goal-min').value) || 0);
db.patch('profiles', slug(S.me), { name: S.me, goalMin: v }).then(() => toast('Hedef kaydedildi')).catch(fail);
}
// Haftalık dakika hedefi (Takip sayfasında): son 7 günün toplamı hedefle karşılaştırılır
function weekGoalCard2(mine, prof) {
const weekSecs = [...Array(7)].map((_, i) => dayKey2(new Date(Date.now() - i * 86400000))).reduce((a, k) => a + mine.filter(s => sessDay2(s) === k).reduce((x, s) => x + (s.seconds || 0), 0), 0);
const weekMin = Math.round(weekSecs / 60);
const goal = prof.goalMin || 0;
const pct = goal ? Math.min(100, Math.round(weekMin / goal * 100)) : 0;
return `<section class="card"><h3>Haftalık hedef</h3><p class="big">${weekMin}<small> dk</small></p><p class="small muted">${goal ? 'Son 7 gün · hedef ' + goal + ' dk · %' + pct : 'Son 7 gün · henüz hedef yok'}</p><div class="bar goal"><span style="width:${pct}%"></span></div><div class="actions"><input id="goal-min" type="number" min="0" value="${goal || ''}" placeholder="Dakika" style="width:7em"><button type="button" class="btn sm" data-act="gsave">Kaydet</button></div></section>`;
}
// Takip: kişiye özel okuma alışkanlığı, zamanlayıcı oturumlarından hesaplanır
const HEAT_WEEKS = 18;
const WEEKDAYS2 = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEKDAYS_LONG2 = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAYPARTS2 = [['Sabah', 5, 12], ['Öğleden sonra', 12, 17], ['Akşam', 17, 22], ['Gece', 22, 29]];
const dk2 = secs => Math.round(secs / 60) + ' dk';
function barsList2(rows) {
const max = Math.max(1, ...rows.map(r => r[1]));
return `<ul class="moodbars hbars">${rows.map(([label, secs]) => `<li><span>${esc(label)}</span><span class="bar"><span style="width:${Math.round(secs / max * 100)}%"></span></span><span class="pct">${dk2(secs)}</span></li>`).join('')}</ul>`;
}
function longestStreak2(keys) {
let best = 0, run = 0, prev = null;
keys.sort().forEach(k => {
const d = new Date(k + 'T12:00:00');
run = prev && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1;
best = Math.max(best, run);
prev = d;
});
return best;
}
function viewHabit() {
ensureSessions();
ensureProfiles();
if (!S.me) return `<div class="page-head"><h1>Takip</h1></div><div class="card empty"><p class="muted">Önce kim olduğunu seç.</p></div>`;
const mine = mySessions2();
const byDay = {};
mine.forEach(s => { const k = sessDay2(s); if (k) byDay[k] = (byDay[k] || 0) + (s.seconds || 0); });
const today = new Date();
today.setHours(0, 0, 0, 0);
const dayAt = n => { const d = new Date(today); d.setDate(today.getDate() + n); return d; };
// Isı haritası: sütunlar hafta (Pazartesi başlar), satırlar gün
const first = -((today.getDay() + 6) % 7) - 7 * (HEAT_WEEKS - 1);
const cells = [...Array(HEAT_WEEKS * 7)].map((_, i) => {
const d = dayAt(first + i);
if (d > today) return '<i class="f"></i>';
const secs = byDay[dayKey2(d)] || 0;
const m = secs / 60;
const lvl = !secs ? 0 : m < 10 ? 1 : m < 20 ? 2 : m < 40 ? 3 : 4;
return `<i class="l${lvl}" title="${esc(d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }))}: ${dk2(secs)}"></i>`;
}).join('');
const last30 = [...Array(30)].map((_, i) => byDay[dayKey2(dayAt(-i))] || 0);
const active30 = last30.filter(Boolean).length;
const total30 = last30.reduce((a, b) => a + b, 0);
const parts = DAYPARTS2.map(([label, from, to]) => [label, mine.filter(s => { const h = new Date(s.at).getHours(); const x = h < 5 ? h + 24 : h; return x >= from && x < to; }).reduce((a, s) => a + (s.seconds || 0), 0)]);
const week = WEEKDAYS2.map((label, i) => [label, mine.filter(s => (new Date(s.at).getDay() + 6) % 7 === i).reduce((a, s) => a + (s.seconds || 0), 0)]);
const perBook = {};
mine.forEach(s => { perBook[s.bookId] = (perBook[s.bookId] || 0) + (s.seconds || 0); });
const books = Object.entries(perBook).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, secs]) => [(bookById(id) || {}).title || 'Silinmiş kitap', secs]);
const topPart = parts.slice().sort((a, b) => b[1] - a[1])[0];
const topDay = WEEKDAYS_LONG2[week.indexOf(week.slice().sort((a, b) => b[1] - a[1])[0])];
const insight = mine.length ? `En çok <b>${esc(topPart[0].toLocaleLowerCase('tr-TR'))}</b> saatlerinde ve <b>${esc(topDay)}</b> günleri okuyorsun.` : 'Okuma köşesinde zamanlayıcıyla okudukça alışkanlıkların burada belirecek.';
return `
<div class="page-head"><div><p class="label">Takip</p><h1>Okuma alışkanlığım</h1></div></div>
<p class="muted">${insight}</p>
${recapCard2(mine)}
<div class="stats">
<div class="stat"><span>Şu anki seri</span><b>${streakDays2(mine)} gün</b></div>
<div class="stat"><span>En uzun seri</span><b>${longestStreak2(Object.keys(byDay))} gün</b></div>
<div class="stat"><span>Son 30 gün</span><b>${active30} gün</b></div>
<div class="stat"><span>Okunan günlerde ort.</span><b>${active30 ? dk2(total30 / active30) : '–'}</b></div>
</div>
<section class="card chart30"><h3>Son 30 gün</h3>${chart30(byDay)}</section>
<section class="card"><h3>Son ${HEAT_WEEKS} hafta</h3>
<div class="heat-wrap"><div class="heat-days">${WEEKDAYS2.map((d, i) => `<span>${i % 2 ? '' : d}</span>`).join('')}</div><div class="heat">${cells}</div></div>
<div class="heat-legend">Az<i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i>Çok</div>
</section>
<div class="grid3">
<section class="card"><h3>Günün saatleri</h3>${barsList2(parts)}</section>
<section class="card"><h3>Haftanın günleri</h3>${barsList2(week)}</section>
${weekGoalCard2(mine, (S.profiles || {})[slug(S.me)] || {})}
</div>
<section class="card"><h3>Kitaplara göre</h3>${books.length ? barsList2(books) : '<p class="muted small">Henüz oturum yok.</p>'}</section>`;
}

// El çizimi illüstrasyonlar: mürekkep çizgisi + birkaç sıcak renk lekesi (Margins esintisi)
const INK = '#e6dccb';
const ILLUS = {
  // Okuma koltuğu, kıvrılmış kedi, lamba ve kitap yığını
  cozy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
<path d="M8 136 C60 133 150 138 212 134"/>
<path d="M58 118 C53 86 58 60 88 57 C116 55 126 64 126 92 L126 118" fill="#2a2f3e"/>
<path d="M48 104 C66 99 118 99 136 104 C138 113 133 120 126 120 L58 120 C51 120 46 113 48 104Z" fill="#343a4c"/>
<path d="M45 94 C37 94 37 108 44 112 L49 118 M139 94 C147 94 147 108 140 112 L135 118"/>
<path d="M56 120 L53 131 M128 120 L131 131"/>
<path d="M74 102 C73 89 100 86 106 99 C100 103 80 104 74 102Z" fill="#e8b04f"/>
<path d="M98 92 L101 85 L104 93 M92 91 L94 85 L97 91"/>
<path d="M74 101 C66 100 65 93 72 92"/>
<path d="M178 131 L178 54 M168 132 C173 128 183 128 188 132"/>
<path d="M162 54 L194 54 L185 32 L171 32Z" fill="#f2c66d"/>
<path d="M164 64 L156 74 M178 66 L178 78 M192 64 L200 74" stroke-dasharray="2 4"/>
<path d="M14 132 L44 132 L44 123 L14 123Z" fill="#e8b04f"/>
<path d="M18 123 L42 123 L42 115 L18 115Z" fill="#8cc7a0"/>
<path d="M15 115 L39 115 L39 107 L15 107Z" fill="#343a4c"/>
<path d="M32 107 C30 100 36 96 40 99"/>
</svg>`,
  // Buharı tüten çay fincanı ve açık kitap
  tea: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
<path d="M10 134 C70 131 150 136 210 132"/>
<path d="M28 126 C46 116 70 116 88 124 C106 116 130 116 148 126 L148 132 C130 124 106 124 88 132 C70 124 46 124 28 132Z" fill="#d9cfbd"/>
<path d="M88 124 L88 132 M40 122 C52 119 64 119 76 122 M100 122 C112 119 124 119 136 122"/>
<path d="M150 82 L196 82 C196 108 186 118 173 118 C160 118 150 108 150 82Z" fill="#2a2f3e"/>
<path d="M196 90 C206 90 206 104 194 106"/>
<path d="M142 122 C158 127 188 127 204 122"/>
<path d="M164 72 C158 64 170 58 164 48 M178 72 C172 64 184 58 178 48"/>
<path d="M60 40 C62 34 68 34 70 40 C72 34 78 34 80 40 C80 48 70 54 70 54 C70 54 60 48 60 40Z" fill="#e8b04f"/>
</svg>`,
  // Raf, kitaplar ve saksı
  shelf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
<path d="M20 120 C80 118 140 121 200 119 M24 120 L24 132 M196 119 L196 131"/>
<path d="M36 119 L36 66 L50 66 L50 119Z" fill="#e8b04f"/><path d="M52 119 L52 76 L64 76 L64 119Z" fill="#343a4c"/>
<path d="M66 119 L66 60 L80 60 L80 119Z" fill="#8cc7a0"/><path d="M84 119 L96 72 L108 75 L97 120Z" fill="#f2c66d"/>
<path d="M40 76 L46 76 M70 70 L76 70 M70 108 L76 108"/>
<path d="M140 119 L136 96 L164 96 L160 119Z" fill="#e8b04f"/>
<path d="M150 96 C146 80 132 76 128 64 M150 96 C152 78 164 74 170 62 M150 96 C150 84 148 72 150 58"/>
<path d="M126 66 C122 60 130 56 132 62 M168 64 C172 58 178 62 174 66 M148 60 C146 54 154 52 152 58"/>
</svg>`,
};
const illusURL = k => `url("data:image/svg+xml,${encodeURIComponent(ILLUS[k])}")`;
document.documentElement.style.setProperty('--illus-cozy', illusURL('cozy'));
document.documentElement.style.setProperty('--illus-tea', illusURL('tea'));
document.documentElement.style.setProperty('--illus-shelf', illusURL('shelf'));
const illus = (k, cls = '') => `<div class="illus ${cls}" aria-hidden="true">${ILLUS[k]}</div>`;

// Aylık özet (Fable esintisi): seçili ayın okuma özeti, resim olarak paylaşılabilir
function recapData2(mine, back) {
  const now = new Date();
  const m = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const key = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0');
  const list = mine.filter(s => sessDay2(s).startsWith(key));
  const total = list.reduce((a, s) => a + (s.seconds || 0), 0);
  const perBook = {};
  list.forEach(s => { perBook[s.bookId] = (perBook[s.bookId] || 0) + (s.seconds || 0); });
  const top = Object.entries(perBook).sort((a, b) => b[1] - a[1])[0];
  const perDay = [0, 0, 0, 0, 0, 0, 0];
  list.forEach(s => { perDay[(new Date(s.at).getDay() + 6) % 7] += s.seconds || 0; });
  return {
    key,
    label: m.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    total,
    days: new Set(list.map(sessDay2)).size,
    sessions: list.length,
    longest: Math.max(0, ...list.map(s => s.seconds || 0)),
    topBook: top ? (bookById(top[0]) || {}).title || '' : '',
    topDay: total ? WEEKDAYS_LONG2[perDay.indexOf(Math.max(...perDay))] : '',
    finished: S.books.filter(b => b.status === 'tamamlandi' && b.month === key).map(b => b.title),
  };
}
const hoursText = secs => secs >= 3600 ? (secs / 3600).toFixed(1).replace('.', ',') + ' saat' : Math.round(secs / 60) + ' dakika';
function recapCard2(mine) {
  const d = recapData2(mine, S.recapBack || 0);
  const rows = [
    ['Okunan gün', d.days + ' gün'],
    ['Oturum', String(d.sessions)],
    ['En uzun oturum', d.longest ? dk2(d.longest) : '–'],
    ['En sevdiğin gün', d.topDay || '–'],
  ];
  return `<section class="card recap">
    <div class="recap-head">
      <div><p class="label">Aylık özet</p><h2>${esc(d.label)}</h2></div>
      <div class="seg" role="group" aria-label="Ay seç"><button type="button" class="${S.recapBack ? '' : 'on'}" data-act="recapm" data-v="0">Bu ay</button><button type="button" class="${S.recapBack ? 'on' : ''}" data-act="recapm" data-v="1">Geçen ay</button></div>
    </div>
    <div class="recap-body">
      ${illus('cozy', 'recap-art')}
      <div class="recap-main">
        <p class="recap-big">${d.total ? esc(hoursText(d.total)) : 'Henüz okuma yok'}</p>
        <p class="muted">${d.total ? 'okudun' + (d.topBook ? `, en çok <b>${esc(d.topBook)}</b>` : '') : 'Okuma köşesinde zamanlayıcıyla okudukça burası dolacak.'}</p>
        ${d.finished.length ? `<p class="small">Bitirilen: ${d.finished.map(esc).join(', ')}</p>` : ''}
      </div>
    </div>
    <dl class="facts recap-facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <div class="actions"><button type="button" class="btn sm" data-act="recapshare"${d.total ? '' : ' disabled'}>Paylaş</button><span class="muted small">Resim olarak kaydet ya da gönder</span></div>
  </section>`;
}
// Özeti 1080x1350 bir resme çizer; telefonda paylaşım menüsü, bilgisayarda indirme
async function shareRecap() {
  const d = recapData2(mySessions2(), S.recapBack || 0);
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  try { await document.fonts.ready; } catch (e) {}
  g.fillStyle = '#0f1118'; g.fillRect(0, 0, 1080, 1350);
  g.fillStyle = '#171a24';
  g.beginPath(); g.roundRect(60, 60, 960, 1230, 48); g.fill();
  const img = new Image();
  img.src = 'data:image/svg+xml,' + encodeURIComponent(ILLUS.cozy);
  await new Promise(r => { img.onload = r; img.onerror = r; });
  try { g.drawImage(img, 290, 120, 500, 341); } catch (e) {}
  g.textAlign = 'center';
  g.fillStyle = '#e8b04f'; g.font = '600 34px Inter, sans-serif';
  g.fillText('KİTAP KULÜBÜ · ' + d.label.toLocaleUpperCase('tr-TR'), 540, 530);
  g.fillStyle = '#ece4d6'; g.font = '500 128px Lora, Georgia, serif';
  g.fillText(hoursText(d.total), 540, 680);
  g.fillStyle = '#9a958c'; g.font = '400 40px Inter, sans-serif';
  g.fillText(S.me + (S.recapBack ? ' geçen ay okudu' : ' bu ay okudu'), 540, 750);
  const facts = [['Okunan gün', d.days], ['Oturum', d.sessions], ['En uzun', dk2(d.longest)], ['En sevdiği gün', d.topDay || '–']];
  facts.forEach(([k, v], i) => {
    const x = 300 + (i % 2) * 480, y = 880 + Math.floor(i / 2) * 150;
    g.fillStyle = '#9a958c'; g.font = '500 30px Inter, sans-serif'; g.fillText(k, x, y);
    g.fillStyle = '#ece4d6'; g.font = '500 58px Lora, Georgia, serif'; g.fillText(String(v), x, y + 64);
  });
  if (d.topBook) { g.fillStyle = '#e8b04f'; g.font = 'italic 500 40px Lora, Georgia, serif'; g.fillText('En çok: ' + d.topBook.slice(0, 40), 540, 1200); }
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  if (!blob) return toast('Resim hazırlanamadı.');
  const file = new File([blob], `kitap-kulubu-${d.key}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) return await navigator.share({ files: [file], title: 'Aylık okuma özetim' });
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Özet resmi indirildi');
}

// Odak modu (Margins esintisi): menüler gizlenir, yalnızca zamanlayıcı ve müzik kalır.
// Sayfa yeniden çizilmez, sadece sınıf değişir; böylece çalan müzik kesilmez.
function setFocusMode(on) {
  document.body.classList.toggle('focus-mode', on);
  try {
    if (on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch (e) {}
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('focus-mode'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) setFocusMode(false); });

// Hareket sistemi: sayfa geçişi (View Transitions), kaydırınca beliren bölümler, sayarak artan rakamlar, eğilen kapaklar.
// Yalnızca sayfa değişince ya da ilk açılışta oynar; veri güncellenip sayfa yeniden çizilince her şey olduğu yerde kalır.
var ANIM_NEXT = false, FIRST_ANIM_DONE = false, REVEAL_IO = null;
function reduceMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
function pageChange(run) {
  ANIM_NEXT = true;
  // Sekme arka plandaysa ya da tarayıcı desteklemiyorsa geçişsiz çiz; geçiş hata verirse de sayfa yine çizilsin
  if (!document.startViewTransition || reduceMotion() || document.hidden) return run();
  try { document.startViewTransition(run).updateCallbackDone.catch(err => { console.error(err); run(); }); } catch (err) { run(); }
}
const REVEAL_SEL = '.stage-text > *, .spot-body > *, .stage-cover, .tile, .card, .rail-section, .shelf-row, .numbers > div, .timeline li, .stats .stat, .marquee, .page-head, .rozet, .chart30, .polaroid, .film, .filmstrip';
function enhance(root) {
  const first = !FIRST_ANIM_DONE && S.loaded;
  if (!(ANIM_NEXT || first) || reduceMotion()) { ANIM_NEXT = false; return; }
  ANIM_NEXT = false;
  if (first) FIRST_ANIM_DONE = true;
  const counts = new Map();
  const els = [...root.querySelectorAll(REVEAL_SEL)];
  els.forEach(el => {
    const i = counts.get(el.parentElement) || 0;
    counts.set(el.parentElement, i + 1);
    el.classList.add('rv');
    el.style.setProperty('--i', Math.min(i, 8));
  });
  if (!REVEAL_IO && 'IntersectionObserver' in window) {
    REVEAL_IO = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); REVEAL_IO.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
  }
  els.forEach(el => (REVEAL_IO ? REVEAL_IO.observe(el) : el.classList.add('in')));
  root.querySelectorAll('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count);
    if (!isFinite(to)) return;
    const dec = Number(el.dataset.dec || 0);
    const fmt = v => v.toLocaleString('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 1100);
      el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  });
}
if (window.matchMedia && matchMedia('(hover: hover)').matches) {
  let tiltEl = null;
  document.addEventListener('pointermove', e => {
    const el = e.target.closest ? e.target.closest('.tilt') : null;
    if (tiltEl && tiltEl !== el) { tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry'); }
    // Kutuların üzerinde fareyi izleyen yumuşak ışık (CSS'teki --mx/--my)
    const glow = e.target.closest ? e.target.closest('.tile, .card') : null;
    if (glow) {
      const g = glow.getBoundingClientRect();
      glow.style.setProperty('--mx', (e.clientX - g.left).toFixed(0) + 'px');
      glow.style.setProperty('--my', (e.clientY - g.top).toFixed(0) + 'px');
    }
    tiltEl = el;
    if (!el || reduceMotion()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 10).toFixed(2) + 'deg');
  }, { passive: true });
}
// Takip: son 30 günün dakikaları, yumuşak eğri + degrade alan; çizgi ekrana girince çizilerek gelir
function chart30(byDay) {
  const n = 30, W = 640, H = 190, P = 18;
  const days = [...Array(n)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1 - i)); return d; });
  const vals = days.map(d => Math.round((byDay[dayKey2(d)] || 0) / 60));
  const max = Math.max(30, ...vals);
  const pts = vals.map((v, i) => [P + i * (W - 2 * P) / (n - 1), H - P - v / max * (H - 2 * P)]);
  let line = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    line += ` C${c1[0].toFixed(1)},${Math.min(H - P, c1[1]).toFixed(1)} ${c2[0].toFixed(1)},${Math.min(H - P, c2[1]).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${H - P} L${pts[0][0].toFixed(1)},${H - P} Z`;
  const active = vals.filter(Boolean);
  const avg = active.length ? Math.round(active.reduce((a, b) => a + b, 0) / active.length) : 0;
  const avgY = H - P - avg / max * (H - 2 * P);
  const lbl = d => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  return `<svg class="c30" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Son 30 günde günlük okuma dakikaları">
    <defs><linearGradient id="g30" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${avg ? `<line x1="${P}" x2="${W - P}" y1="${avgY.toFixed(1)}" y2="${avgY.toFixed(1)}" class="c30-avg"/>` : ''}
    <path d="${area}" fill="url(#g30)" class="c30-area"/>
    <path d="${line}" class="c30-line" pathLength="1"/>
    ${pts.map((p, i) => `<rect x="${(p[0] - (W - 2 * P) / (n - 1) / 2).toFixed(1)}" y="0" width="${((W - 2 * P) / (n - 1)).toFixed(1)}" height="${H}" fill="transparent"><title>${lbl(days[i])}: ${vals[i]} dk</title></rect>`).join('')}
  </svg>
  <div class="c30-axis"><span>${lbl(days[0])}</span><span>${avg ? 'okuduğun günlerde ortalama ' + avg + ' dk' : ''}</span><span>bugün</span></div>`;
}

// Rozetler: oturum ve kitap verisinden hesaplanır, kazanılmayanlar soluk görünür
function badgesFor(name) {
  const key = slug(name);
  const mine = (S.sessions || []).filter(s => s.by === key);
  const total = mine.reduce((a, s) => a + (s.seconds || 0), 0);
  const hours = s => new Date(s.at).getHours();
  const longest = longestStreak2([...new Set(mine.map(sessDay2))]);
  const finished = S.books.filter(b => finishedBy2(b, name)).length;
  const rated = S.books.filter(b => (b.ratings || {})[key] > 0).length;
  return [
    ['🌱', 'İlk adım', 'İlk okuma oturumu', mine.length >= 1],
    ['🔥', 'Bir hafta', '7 gün üst üste okuma', longest >= 7],
    ['🌕', 'Bir ay', '30 gün üst üste okuma', longest >= 30],
    ['⏳', '10 saat', 'Toplam 10 saat okuma', total >= 36000],
    ['🏔️', '50 saat', 'Toplam 50 saat okuma', total >= 180000],
    ['🎯', 'Derin odak', '25 dakikadan uzun 10 oturum', mine.filter(s => (s.seconds || 0) >= 1500).length >= 10],
    ['🌙', 'Gece kuşu', 'Gece 22.00 ile 04.00 arası 5 oturum', mine.filter(s => hours(s) >= 22 || hours(s) < 4).length >= 5],
    ['☀️', 'Erkenci', 'Sabah 05.00 ile 09.00 arası 5 oturum', mine.filter(s => hours(s) >= 5 && hours(s) < 9).length >= 5],
    ['📚', 'Kitap kurdu', '5 kitap bitirmek', finished >= 5],
    ['🗳️', 'Seçici', 'Kulübe 3 kitap seçmek', S.books.filter(b => b.pickedBy === name).length >= 3],
    ['⭐', 'Eleştirmen', '5 kitaba puan vermek', rated >= 5],
  ];
}
function badgesHTML(name) {
  const list = badgesFor(name);
  const won = list.filter(b => b[3]).length;
  return `<section class="card rozet-card"><h3>Rozetler <span class="count">${won}/${list.length}</span></h3>
    <div class="rozet-grid">${list.map(([e, t, d, ok]) => `<div class="rozet${ok ? ' won' : ''}" title="${esc(d)}"><span class="bd-ic" aria-hidden="true">${e}</span><b>${esc(t)}</b><small>${esc(d)}</small></div>`).join('')}</div>
  </section>`;
}

// Toplantı fotoğraf albümü: her fotoğraf books/{kitap}/photos altında ayrı belge (en fazla ~1200 px, JPEG; Storage yok)
const photoSubs = {};
function ensurePhotos(id) {
  if (!fs || photoSubs[id]) return;
  photoSubs[id] = db.watch('books/' + id + '/photos', list => {
    (S.photos = S.photos || {})[id] = list.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
    if (S.view === 'buay' || (S.view === 'kitap' && S.bookId === id)) render();
  });
  subs.push(photoSubs[id]);
}
async function shrinkPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    let q = 0.82, data = c.toDataURL('image/jpeg', q);
    while (data.length > 850000 && q > 0.4) { q -= 0.1; data = c.toDataURL('image/jpeg', q); }
    return data;
  } finally { URL.revokeObjectURL(url); }
}
async function uploadPhotos(bookId, files) {
  const list = [...files].filter(f => /^image\//.test(f.type));
  if (!list.length) return toast('Resim dosyası seç.');
  for (let i = 0; i < list.length; i++) {
    toast(`Fotoğraf yükleniyor (${i + 1}/${list.length})...`);
    try {
      const data = await shrinkPhoto(list[i]);
      if (data.length > 900000) { toast('Bu fotoğraf çok büyük, atlandı.'); continue; }
      await db.add('books/' + bookId + '/photos', { by: S.me, data, at: nowISO() });
    } catch (err) { fail(err); return; }
  }
  toast(list.length > 1 ? 'Fotoğraflar eklendi' : 'Fotoğraf eklendi');
}
const photoById = (bookId, id) => ((S.photos || {})[bookId] || []).find(p => p.id === id);
function albumHTML(b) {
  ensurePhotos(b.id);
  const list = (S.photos || {})[b.id] || [];
  const col = 'books/' + b.id + '/photos';
  return `<section class="album">
    <div class="rail-head"><h2 class="sec-title">Toplantıdan kareler <span class="count">${list.length}</span></h2>
      <label class="btn sm">${icon('img')}Fotoğraf ekle<input class="sr" type="file" accept="image/*" multiple data-change="mphoto" data-id="${esc(b.id)}"></label></div>
    ${list.length ? `<div class="masonry">${list.map(p => `<figure class="film" style="--rot:${(hash(p.id) % 5) - 2}deg">
      <button type="button" class="film-img" data-act="photo" data-book="${esc(b.id)}" data-id="${esc(p.id)}"><img src="${esc(p.data)}" alt="${esc(p.by)} toplantı fotoğrafı" loading="lazy"></button>
      <figcaption><span class="hand">${esc(p.by)} · ${esc(dateTR(p.at, { day: 'numeric', month: 'short' }))}</span>${delBtn(p, col)}</figcaption>
    </figure>`).join('')}</div>` : `<p class="muted">Buluşmadan bir kare ekleyin: masadaki kitaplar, kahveler, gülüşler. Burada polaroid gibi birikir.</p>`}
  </section>`;
}
// Ana sayfa: bütün kitapların toplantılarından son kareler, film şeridi gibi
function filmStrip() {
  S.books.forEach(x => ensurePhotos(x.id));
  const all = S.books.flatMap(x => ((S.photos || {})[x.id] || []).map(p => ({ ...p, book: x }))).sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 12);
  if (!all.length) return '';
  return `<section class="rail-section">
    <div class="rail-head"><h2 class="sec-title"><span class="idx">04</span>Toplantılardan kareler</h2></div>
    <div class="filmstrip"><div class="fs-track">${all.map(p => `<button type="button" class="fs-item" data-act="photo" data-book="${esc(p.book.id)}" data-id="${esc(p.id)}"><img src="${esc(p.data)}" alt="${esc(p.book.title)} toplantısından" loading="lazy"><span class="hand">${esc(p.book.title)}</span></button>`).join('')}</div></div>
  </section>`;
}
function openLightbox(bookId, id) {
  const p = photoById(bookId, id);
  if (!p) return;
  const b = bookById(bookId) || {};
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.addEventListener('click', () => lb.classList.remove('on'));
    document.body.appendChild(lb);
  }
  lb.innerHTML = `<figure><img src="${esc(p.data)}" alt=""><figcaption class="hand">${esc(b.title || '')} · ${esc(p.by)} · ${esc(dateTR(p.at, { day: 'numeric', month: 'long' }))}</figcaption></figure>`;
  requestAnimationFrame(() => lb.classList.add('on'));
}
document.addEventListener('keydown', e => { const lb = document.getElementById('lightbox'); if (e.key === 'Escape' && lb) lb.classList.remove('on'); });

// İmleç balonu (yalnızca fareyle): kapak ve fotoğrafların üzerinde "Aç" / "Büyüt" yazan yuvarlak balon
if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const bubble = document.createElement('div');
  bubble.className = 'cbubble';
  bubble.setAttribute('aria-hidden', 'true');
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(bubble));
  if (document.body) document.body.appendChild(bubble);
  document.addEventListener('pointermove', e => {
    const t = e.target.closest ? e.target.closest('.rail-item, .polaroid, .film-img, .fs-item') : null;
    if (!t || reduceMotion()) { bubble.classList.remove('on'); return; }
    bubble.textContent = t.matches('.film-img, .fs-item') ? 'Büyüt' : 'Aç';
    bubble.style.left = e.clientX + 'px';
    bubble.style.top = e.clientY + 'px';
    bubble.classList.add('on');
  }, { passive: true });
  document.addEventListener('pointerleave', () => bubble.classList.remove('on'));
}
