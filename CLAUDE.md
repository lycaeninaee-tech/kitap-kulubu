# Kitap Kulübü — proje notları

Üç kişilik özel kitap kulübü için Türkçe web uygulaması. Arayüz metinleri Türkçe kalmalı.

- Canlı site: https://lycaeninaee-tech.github.io/kitap-kulubu/ (GitHub Pages, `main` dalından yayınlanır)
- Firebase projesi: `book-club-a5eff` (Auth + Firestore). Storage ve Blaze plan kullanılmıyor.
- Derleme adımı yok: düz HTML/CSS/JS, Firebase Web SDK 10.12.2 gstatic'ten modül olarak yüklenir.

## Kimler girebilir

- Üyeler `config.js` içindeki `members` listesinde (Aslı, Ebrar, Şebnem). Google ile giriş yapıp okur ve yazarlar.
- `viewers` listesindeki hesap yalnızca okuyabilir; üye olarak eklenmemeli (kullanıcının açık isteği).
- Aynı e-posta listeleri `firestore.rules` içinde de var. Listeler değişirse ikisi birlikte güncellenmeli ve kurallar Firebase konsolundaki Rules sekmesinde de yayımlanmalı.

## Dosyalar

- `index.html`: kabuk (yan menü, üst çubuk, mobil alt menü), Fraunces + Inter yazı tipleri, service worker kaydı.
- `app.js`: tüm uygulama. `render()` `S.view` değerine göre sayfayı çizer. Tıklamalar tek bir `data-act` dinleyicisinden geçer.
- `style.css`: tema değişkenleri `:root` içinde. Dosyanın sonunda lofi dokunuşları, zamanlayıcı ve profil grafiği stilleri var.
- `config.js`: Firebase ayarları, üyeler, izleyiciler, isteğe bağlı Google Books anahtarı.
- `kitap-bilgi.json`: kitap sayfasındaki Bilgi ve Yazar sekmeleri için elle yazılmış bilgiler. Anahtar, Firestore'daki kitap id'si.
- `sw.js`: ağ öncelikli önbellek. İstekler `cache: 'no-cache'` ile gider, yani GitHub Pages'in 10 dakikalık önbelleğine takılmadan her açılışta sunucuya sorulur; çevrimdışıyken kayıtlı kopya kullanılır. Yeni service worker devreye girince `index.html` sayfayı bir kez yeniler. Kabuk dosyaları değişince yine de `CACHE` sürümünü artır (şu an `kulup-v12`).
- `manifest.webmanifest`, `icon.svg`: PWA olarak ana ekrana eklenebilir.
- `tasima.json`: eski Claude artifact'ından taşınan veri. Bir kez içe aktarıldı, artık gerekmiyor.

## Firestore koleksiyonları

- `books` (+ alt koleksiyon `books/{id}/notes`): kitaplar. Durum değerleri: `sirada`, `okunuyor`, `tamamlandi`, `birakildi`.
- `books/{id}/photos`: toplantı fotoğrafları `{ by, data (JPEG data URL, en çok ~1200 px), at }`; kitabın Toplantı sekmesinde polaroid duvarı (`albumHTML`), ana sayfada film şeridi (`filmStrip`), tıklayınca büyük görünüm (`openLightbox`).
- `suggestions`: kitap önerileri ve oylar. Eklenince `lookupSugg` kapak (`coverUrl`), `info` ve tanıtım (`desc`) bulur. "Kitaplığa ekle" (`adopt`) bunları "Sırada" durumundaki yeni kitaba taşır.
- `sessions`: okuma oturumları `{ by: üye-slug, bookId, seconds, at: ISO tarih }`.
- `profiles/{üye-slug}`: `{ name, music, goalMin, bio, genres, favBook, favAuthor, quote, yearGoal }` (müzik, haftalık dakika hedefi ve kişisel profil bilgileri).

## Sayfalar (`VIEWS`)

Bu ay, Kitaplık, Öneriler, Profilim (`viewProfile2`), Okuma köşesi (`viewTimer2`, adres `#zamanlayici`), Takip (`viewHabit`).

- Profilim: kişisel sayfa. Hakkımda, sevilen türler, favoriler, yıllık kitap hedefi, şu an okunanlar, seçilen ve puanlanan kitaplar. Üyeler birbirinin profilini görür (`S.profileOf`), sadece kendininkini düzenler (`profileForm2`). Sayısal istatistik burada yok, Takip'te.
- Takip: kişiye özel alışkanlık sayfası. `sessions` verisinden aylık özet, seriler, son 18 haftanın ısı haritası, günün saatleri, haftanın günleri, haftalık dakika hedefi (`weekGoalCard2`) ve kitap başına süre hesaplanır.
- Sayfa geçişleri `go()` ile `history.pushState` kullanır; tarayıcının geri tuşu `popstate` ile önceki sayfaya döner.
- Kitap sayfasındaki "Kitabı düzenle" formu (`bookEditForm`, `data-form="bookedit"`) ad, yazar, seçen, ay, durum ve künyeyi tek seferde günceller.
- Takip sayfasının başında aylık özet kartı (`recapCard2`) var; "Paylaş" (`shareRecap`) özeti 1080x1350 PNG olarak çizip paylaşır ya da indirir.
- Zamanlayıcıda odak modu (`setFocusMode`) yalnızca `body.focus-mode` sınıfını değiştirir, yeniden çizmez; müzik kesilmez.
- El çizimi illüstrasyonlar `ILLUS` (cozy, tea, shelf) içinde satır içi SVG. Boş sayfalar `--illus-shelf` CSS değişkenini kullanır.
- Tasarım sistemi (style.css sonundaki "Seviye 2" bölümü): ana sayfa koyu "sahne" (bulanık kapak arka planı, 3B kapak, dev başlık), bento kutular, kayan alıntı şeridi (`.marquee`), yana kayan raflar (`.rail`, `.ledge`), zaman çizelgesi, büyük rakam şeridi (`.numbers`).
- Hareket: sayfa geçişleri `pageChange()` ile View Transitions kullanır; kapaklar `view-transition-name: c-<kitapId>` ile sayfalar arasında akar. `enhance()` yalnızca sayfa değişince bölümleri sırayla belirtir (`.rv`/`.in`) ve `data-count` rakamlarını sayarak artırır. "Hareketi azalt" açıksa hiçbiri çalışmaz.
- Takip'te `chart30` (30 günlük alan grafiği), profilde `badgesHTML` (rozetler; sınıf adı `rozet`, çünkü `.badge` notlardaki etiketlerde kullanılıyor).
- `init()` `queueMicrotask` ile başlar; dosyanın sonundaki sabitler tanımlanmadan render çalışmasın diye.
- Gün anahtarları yerel saate göredir (`dayKey2`, `sessDay2`), UTC değil.
- Ses notları: kitabın "Okumadan önce / okurken" sekmesinde, en çok 30 sn. `MediaRecorder` ile 24 kbit/sn kaydedilir ve not belgesine `audio` (data URL) + `dur` alanlarıyla `kind: 'own'` olarak eklenir.

- Zamanlayıcı modları: Serbest, Pomodoro 25/5, Derin odak 50/10, Kısa tur 15/3, Özel döngü, Geri sayım (`MODES2`). Çalışan zamanlayıcı `localStorage` `kulup-timer2` içinde tutulur.
- Müzik kartı zamanlayıcının yanında. Spotify/YouTube embed'i kesilmesin diye zamanlayıcı sayfasında `render()` yerine `refreshTimer2()` yalnızca zamanlayıcı kartını yeniler.
- Profilim: toplam süre, bugün ve seri, haftalık hedef, son 7 gün grafiği, bırakılan kitaplar.

## Tasarım

Gece okuması teması (kullanıcı seçti; önceki açık temaları "ucuz" buldu): derin lacivert-siyah zemin `#0f1118`, yüzeyler `#171a24` / `#1f2330`, krem yazı `#ece4d6`, tek vurgu lamba sarısı `#e8b04f` (ana düğmeler koyu yazılı sarı), saç teli kenarlıklar. Başka renk ekleme; sadelik ucuz görünmemenin anahtarı. Yazı tipleri: başlıklar Lora (500), arayüz Inter. style.css'in sonundaki "Gece okuması" bölümü önceki katmanların açık renklerini ezer. Çok kelimeli kitap başlıklarında son kelime italik ve vurgu renginde (`emLast`). Bölüm başlıklarında numaralı etiket (`.idx`). Koyu bölümlerde film greni (`--grain`). Yeni renkleri doğrudan yazmak yerine `:root` değişkenlerini kullan.

- Kitaplık: okunan kitap rafta değil, başta koyu `spotlight` kartında; raflar Sırada / Yarım bıraktıklarımız; Okuduklarımız bantla tutturulmuş polaroid kolajı (`polaroid`).
- El yapımı katman: üyelerin notları Caveat el yazısıyla mavi mürekkepte (`.hand`), menüde seçili sayfa ve başlıkların altında mürekkep karalaması (`--scribble`), bilgisayarda kitap kartları ve fotoğrafların üstünde "Aç/Büyüt" imleç balonu (`.cbubble`).

## Çalışma şekli

- Değişiklikler ayrı bir dalda yapılır ve PR açılır. Kullanıcı açıkça onay vermeden `main`'e birleştirilmez.
- Birleştirmeden sonra Pages birkaç dakika içinde yayınlar. Kontrol için önbelleği aşan bir sorgu ekle (`app.js?v=...`). `raw.githubusercontent.com/.../main/...` eski içerik gösterebilir; commit SHA'lı adres kullan.
- Profil, zamanlayıcı ve takip fonksiyonlarının adı `...2` ile biter (eski sürümleri silindi).

## Bekleyen fikirler

- Narsis ve Goldmund'un sayfa sayısı (321) şüpheli; kullanıcı kendisi düzeltecek.
