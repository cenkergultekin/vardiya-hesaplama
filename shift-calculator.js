// Vardiya hesaplama sınıfı
class ShiftCalculator {
    constructor() {
        this.mesaiCarpani = 1.5; // Mesai ücreti normal saatliğin 1.5 katı
        this.normalGunSaati = 8; // Günlük normal çalışma saati
    }

    // Tek vardiya hesaplama
    hesaplaVardiya(girisStr, cikisStr, saatlikUcret) {
        // Saat stringlerini Date objelerine çevir
        const giris = this.parseTime(girisStr);
        const cikis = this.parseTime(cikisStr);

        // Çıkış saati giriş saatinden küçükse ertesi güne geçmiş demektir
        if (cikis <= giris) {
            cikis.setDate(cikis.getDate() + 1);
        }

        // Çalışma süresi (milisaniye cinsinden)
        const calisanSureMs = cikis.getTime() - giris.getTime();
        const calisanSaat = calisanSureMs / (1000 * 60 * 60); // Saate çevir

        // Normal saat ve mesai saati hesabı
        let normalSaat, mesaiSaat;
        if (calisanSaat <= this.normalGunSaati) {
            normalSaat = calisanSaat;
            mesaiSaat = 0;
        } else {
            normalSaat = this.normalGunSaati;
            mesaiSaat = calisanSaat - this.normalGunSaati;
        }

        // Ücret hesabı
        const normalUcret = normalSaat * saatlikUcret;
        const mesaiUcret = mesaiSaat * saatlikUcret * this.mesaiCarpani;
        const vardiyaToplam = normalUcret + mesaiUcret;

        return {
            calisanSaat: parseFloat(calisanSaat.toFixed(2)),
            normalSaat: parseFloat(normalSaat.toFixed(2)),
            mesaiSaat: parseFloat(mesaiSaat.toFixed(2)),
            normalUcret: parseFloat(normalUcret.toFixed(2)),
            mesaiUcret: parseFloat(mesaiUcret.toFixed(2)),
            vardiyaToplam: parseFloat(vardiyaToplam.toFixed(2))
        };
    }

    // Birden fazla vardiya hesaplama
    hesaplaVardiyalar(vardiyalar) {
        let toplamNormalSaat = 0;
        let toplamMesaiSaat = 0;
        let toplamUcret = 0;
        const vardiyaDetaylari = [];

        vardiyalar.forEach((vardiya, index) => {
            const hesaplama = this.hesaplaVardiya(
                vardiya.giris,
                vardiya.cikis,
                vardiya.saatlikUcret
            );

            toplamNormalSaat += hesaplama.normalSaat;
            toplamMesaiSaat += hesaplama.mesaiSaat;
            toplamUcret += hesaplama.vardiyaToplam;

            vardiyaDetaylari.push({
                ...vardiya,
                ...hesaplama,
                vardiyaNo: index + 1
            });
        });

        const toplamCalisanSaat = toplamNormalSaat + toplamMesaiSaat;
        const toplamNormalUcret = vardiyalar.length > 0 
            ? toplamNormalSaat * vardiyalar[0].saatlikUcret 
            : 0;
        const toplamMesaiUcret = vardiyalar.length > 0 
            ? toplamMesaiSaat * vardiyalar[0].saatlikUcret * this.mesaiCarpani 
            : 0;

        return {
            vardiyaDetaylari,
            ozet: {
                toplamVardiya: vardiyalar.length,
                toplamCalisanSaat: parseFloat(toplamCalisanSaat.toFixed(2)),
                toplamNormalSaat: parseFloat(toplamNormalSaat.toFixed(2)),
                toplamMesaiSaat: parseFloat(toplamMesaiSaat.toFixed(2)),
                toplamNormalUcret: parseFloat(toplamNormalUcret.toFixed(2)),
                toplamMesaiUcret: parseFloat(toplamMesaiUcret.toFixed(2)),
                toplamKazanc: parseFloat(toplamUcret.toFixed(2))
            }
        };
    }

    // Saat stringini Date objesi olarak parse et
    parseTime(timeStr) {
        const [saat, dakika] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(saat, dakika, 0, 0);
        return date;
    }

    // Tarih formatı yardımcı fonksiyonları
    formatTarih(tarih) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return new Date(tarih).toLocaleDateString('tr-TR', options);
    }

    formatSaat(saat) {
        // Saatleri saat ve dakika cinsinden göster
        const tamSaat = Math.floor(saat);
        const dakika = Math.round((saat - tamSaat) * 60);
        
        // Eğer dakika 60'a eşit veya büyükse saate ekle
        const finalSaat = tamSaat + Math.floor(dakika / 60);
        const finalDakika = dakika % 60;
        
        // Format oluştur
        let result = '';
        
        if (finalSaat > 0) {
            result += `${finalSaat} saat`;
        }
        
        if (finalDakika > 0) {
            if (result) result += ' ';
            result += `${finalDakika} dakika`;
        }
        
        // Eğer hem saat hem dakika 0 ise
        if (!result) {
            result = '0 dakika';
        }
        
        return result;
    }

    formatUcret(ucret) {
        // Türk Lirası formatı: 1.234,56 ₺
        return ucret.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ₺';
    }

    formatGecErkenfark(toplamVardiya, toplamNormalSaat) {
        // (vardiya günü x 8) - Normal Saat hesaplama
        const beklenenSaat = toplamVardiya * 8;
        const fark = beklenenSaat - toplamNormalSaat;
        
        if (fark > 0) {
            // Eksiği var - geç giriş/erken çıkış
            return this.formatSaat(fark) + ' eksik';
        } else if (fark < 0) {
            // Fazlası var - zaten mesai olarak hesaplanır
            return 'Yeterli';
        } else {
            // Tam olarak hedef saat
            return 'Yeterli';
        }
    }

    // Ay bazında filtreleme
    aylikFiltrele(vardiyalar, yil, ay) {
        return vardiyalar.filter(vardiya => {
            const vardiyaTarih = new Date(vardiya.tarih);
            return vardiyaTarih.getFullYear() === yil && vardiyaTarih.getMonth() === ay;
        });
    }

    // Benzersiz ay listesi oluştur
    getAyListesi(vardiyalar) {
        const aylar = new Set();
        vardiyalar.forEach(vardiya => {
            const tarih = new Date(vardiya.tarih);
            const ayStr = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
            aylar.add(ayStr);
        });
        return Array.from(aylar).sort().reverse(); // En yeni ay ilk sırada
    }

    // Ay ismini Türkçe olarak al
    getAyIsmi(yil, ay) {
        const tarih = new Date(yil, ay - 1, 1);
        return tarih.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
    }
}

// Global instance
const shiftCalculator = new ShiftCalculator(); 