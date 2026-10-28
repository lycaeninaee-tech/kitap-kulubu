# Kitap Kulübü

Aslı, Ebrar ve Şebnem'in kitap kulübü sitesi: bu ayın kitabı, toplantı, okuma ilerlemesi, notlar, alıntılar, tartışma soruları ve öneriler.

- Barındırma: GitHub Pages (bu depo, `main` dalı)
- Giriş ve veritabanı: Firebase (Google ile giriş + Firestore)
- Kapak ve kitap bilgileri: Google Books ve Open Library, tarayıcıdan

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Sayfanın iskeleti |
| `app.js` | Uygulamanın kendisi |
| `style.css` | Tasarım |
| `config.js` | Firebase ayarları, üyelerin adları ve e-postaları |
| `firestore.rules` | Veritabanı güvenlik kuralları (yalnızca üyeler okuyup yazabilir) |

## Kurulum adımları

1. GitHub Pages'i aç: Settings > Pages > Source: **Deploy from a branch**, Branch: **main**, klasör **/(root)**.
2. Firebase projesi oluştur, Authentication'da **Google** girişini aç, Firestore veritabanı oluştur.
3. `config.js` içine Firebase web ayarlarını ve üç üyenin e-postalarını yaz.
4. `firestore.rules` içindeki e-postaları aynı şekilde güncelle ve Firebase konsolunda Firestore > Rules'a yapıştırıp yayınla.
5. Firebase > Authentication > Settings > Authorized domains listesine `lycaeninaee-tech.github.io` ekle.

## Eski Claude sayfasından taşıma

Kayıtlar `tasima.json` dosyasına aktarılır. Kitaplık boşken siteye giriş yapıp tarayıcı konsolunda `kulupImport()` çalıştırılır.
