🕒 Vardiya Hesaplama Sistemi
Part-time işim için vardiyalarımı, mesailerimi ve kazancımı kolayca takip etmemi sağlayan, kullanıcı dostu ve modern bir uygulama. Çalışma saatlerimi girerek otomatik hesaplamalar yapıyor, aylık özetimi anında görüyorum.

✨ Öne Çıkan Özellikler
Vardiya Yönetimi: Hızlı vardiya ekleme, düzenleme ve tek/toplu silme imkanı.

Akıllı Hesaplama: Normal saatler ve 8 saat üzeri 1.5x mesai ücreti otomatik hesaplama. Gece vardiyalarını da akıllıca yönetir.

Aylık Özet: Ay bazında filtreleme ve anlık istatistikler (çalışılan saat, kazanılan miktar vb.).

Veri Senkronizasyonu: Firebase Firestore ile güvenli bulut depolama ve LocalStorage ile çevrimdışı çalışma.

Modern Tasarım: Responsive (mobil ve masaüstü uyumlu) arayüz, Glassmorphism efektleri, takvim widget'ı ve kullanıcı dostu bildirimler.

Kullanıcı Kimlik Doğrulama: Güvenli giriş/kayıt sistemi (@vardiya.com uzantılı kullanıcı adları).

🚀 Hızlı Başlangıç
Dosyaları İndir:

Bash

git clone <repository-url>
cd shift-up-hesaplama
Tarayıcıda Aç: index.html dosyasını açarak uygulamayı kullanmaya başla.

Firebase (İsteğe Bağlı): Verilerini bulutta saklamak istersen, Firebase Console'dan proje oluşturup çıkan bilgileri script.js dosyasına yapıştır. Unutma: Başlangıç için Firestore güvenlik kurallarını test modunda açman gerekebilir.

🔧 Teknik Detaylar (Meraklısı İçin)
Frontend: HTML5, CSS3, JavaScript (ES6+).

Veritabanı: Firebase Firestore.

Kimlik Doğrulama: Firebase Auth.

Ek Özellikler: Custom modal ve toast bildirim sistemleri, özel takvim widget'ı, Font Awesome ikonları.

🎨 Özelleştirme
Uygulamanın ayarlarını kolayca değiştirebilirsin:

Saatlik Ücret: script.js içindeki varsayılan değeri değiştir.

Mesai Çarpanı / Normal Çalışma Saati: shift-calculator.js dosyasında this.mesaiCarpani ve this.normalGunSaati değerlerini ayarla.

Renk Teması: style.css dosyasındaki :root bölümündeki renk değişkenlerini kişiselleştir.

Admin Bilgileri: Kayıt için gerekli ADMIN_USERNAME ve ADMIN_PASSWORD değerleri script.js dosyasındadır.

🔒 Güvenlik Notu
Firebase entegrasyonu yaparken, hassas API anahtarlarını gizlemeyi ve Firestore güvenlik kurallarını üretim ortamı için sıkılaştırmayı unutma.

📝 Lisans & Katkı
Bu proje MIT Lisansı altındadır. Katkıda bulunmak istersen, lütfen bir "Pull Request" gönder!