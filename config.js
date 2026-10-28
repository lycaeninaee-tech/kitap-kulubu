// Sitenin ayarları. Firebase kurulunca buradaki boş alanlar doldurulacak.
export const CONFIG = {
  // Firebase konsolu > Proje ayarları > Web uygulaması > firebaseConfig
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },

  // Kulüp üyeleri, seçim sırasıyla. Siteye yalnızca bu e-postalarla Google'dan girilebilir.
  // Aynı liste firestore.rules dosyasında da var; ikisi birlikte güncellenmeli.
  members: [
    { name: 'Aslı', email: '' },
    { name: 'Ebrar', email: '' },
    { name: 'Şebnem', email: '' },
  ],

  // İsteğe bağlı: Google Cloud'dan ücretsiz Books API anahtarı. Boşken kapak araması yine çalışır ama Google sık sık reddedebilir.
  googleBooksKey: '',
};
