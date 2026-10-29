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
- `sw.js`: ağ öncelikli önbellek. Kabuk dosyaları değişince `CACHE` sürümünü artır (şu an `kulup-v5`), yoksa telefonlar eski sürümde kalabilir.
- `manifest.webmanifest`, `icon.svg`: PWA olarak ana ekrana eklenebilir.
- `tasima.json`: eski Claude artifact'ından taşınan veri. Bir kez içe aktarıldı, artık gerekmiyor.

## Firestore koleksiyonları

- `books` (+ alt koleksiyon `books/{id}/notes`): kitaplar. Durum değerleri: `sirada`, `okunuyor`, `tamamlandi`, `birakildi`.
- `suggestions`: kitap önerileri ve oylar. Eklenince `lookupSugg` kapak (`coverUrl`), `info` ve tanıtım (`desc`) bulur. "Kitaplığa ekle" (`adopt`) bunları "Sırada" durumundaki yeni kitaba taşır.
- `sessions`: okuma oturumları `{ by: üye-slug, bookId, seconds, at: ISO tarih }`.
- `profiles/{üye-slug}`: `{ name, music, goalMin }` (müzik bağlantısı ve haftalık dakika hedefi).

## Sayfalar (`VIEWS`)

Bu ay, Kitaplık, Öneriler, Profilim (`viewProfile2`), Zamanlayıcı (`viewTimer2`), Takip (`viewHabit`).

- Takip: kişiye özel alışkanlık sayfası. `sessions` verisinden son 18 haftanın ısı haritası, seriler, günün saatleri, haftanın günleri, aylık karşılaştırma ve kitap başına süre hesaplanır.
- Sayfa geçişleri `go()` ile `history.pushState` kullanır; tarayıcının geri tuşu `popstate` ile önceki sayfaya döner.
- Kitap sayfasındaki "Kitabı düzenle" formu (`bookEditForm`, `data-form="bookedit"`) ad, yazar, seçen, ay, durum ve künyeyi tek seferde günceller.
- Gün anahtarları yerel saate göredir (`dayKey2`, `sessDay2`), UTC değil.
- Ses notları: kitabın "Okumadan önce / okurken" sekmesinde, en çok 30 sn. `MediaRecorder` ile 24 kbit/sn kaydedilir ve not belgesine `audio` (data URL) + `dur` alanlarıyla `kind: 'own'` olarak eklenir.

- Zamanlayıcı modları: Serbest, Pomodoro 25/5, Derin odak 50/10, Kısa tur 15/3, Özel döngü, Geri sayım (`MODES2`). Çalışan zamanlayıcı `localStorage` `kulup-timer2` içinde tutulur.
- Müzik kartı zamanlayıcının yanında. Spotify/YouTube embed'i kesilmesin diye zamanlayıcı sayfasında `render()` yerine `refreshTimer2()` yalnızca zamanlayıcı kartını yeniler.
- Profilim: toplam süre, bugün ve seri, haftalık hedef, son 7 gün grafiği, bırakılan kitaplar.

## Tasarım

Sıcak lofi teması: krem zemin `#f6efe6`, terrakota vurgu `#c2683f`, adaçayı `#7f9a7a` (mola rengi), yuvarlak kartlar, hap biçimli düğmeler. Yeni renkleri doğrudan yazmak yerine `:root` değişkenlerini kullan.

## Çalışma şekli

- Değişiklikler ayrı bir dalda yapılır ve PR açılır. Kullanıcı açıkça onay vermeden `main`'e birleştirilmez.
- Birleştirmeden sonra Pages birkaç dakika içinde yayınlar. Kontrol için önbelleği aşan bir sorgu ekle (`app.js?v=...`). `raw.githubusercontent.com/.../main/...` eski içerik gösterebilir; commit SHA'lı adres kullan.
- Profil, zamanlayıcı ve takip fonksiyonlarının adı `...2` ile biter (eski sürümleri silindi).

## Bekleyen fikirler

- Narsis ve Goldmund'un sayfa sayısı (321) şüpheli; kullanıcı kendisi düzeltecek.
