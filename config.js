// Sitenin ayarları. Firebase kurulunca buradaki boş alanlar doldurulacak.
export const CONFIG = {
// Firebase konsolu > Proje ayarları > Web uygulaması > firebaseConfig
firebase: {
apiKey: 'AIzaSyBvr4NnG2EKZXPJOJ_LbhBkWQqu78LKUng',
authDomain: 'book-club-a5eff.firebaseapp.com',
projectId: 'book-club-a5eff',
storageBucket: 'book-club-a5eff.firebasestorage.app',
messagingSenderId: '982279327349',
appId: '1:982279327349:web:db0290f4ebfd66d132323c',
},
// Kulüp üyeleri, seçim sırasıyla. Siteye yalnızca bu e-postalarla Google'dan girilebilir.
// Aynı liste firestore.rules dosyasında da var; ikisi birlikte güncellenmeli.
members: [
{ name: 'Aslı', email: 'lycaeninaee@gmail.com' },
{ name: 'Ebrar', email: 'elifebrarsariahmet@gmail.com' },
{ name: 'Şebnem', email: 'taskiransebnem@gmail.com' },
],
// İsteğe bağlı: Google Cloud'dan ücretsiz Books API anahtarı. Boşken kapak araması yine çalışır ama Google sık sık reddedebilir.
googleBooksKey: '', viewers: ['asparagas90@gmail.com'],
};
