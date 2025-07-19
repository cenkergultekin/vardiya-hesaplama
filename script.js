// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyAyg62witCjc39Qt-F4j8UOR4uDx4MkOYc",
    authDomain: "popeyes-2acab.firebaseapp.com",
    projectId: "popeyes-2acab",
    storageBucket: "popeyes-2acab.firebasestorage.app",
    messagingSenderId: "405781580357",
    appId: "1:405781580357:web:9a278c5ff9cbc5e23df12c",
    measurementId: "G-XDXZE1V4R6"
  };

// Firebase'i başlat (her şeyden önce ve sadece bir kez!)
firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();
const COLLECTION_NAME = 'vardiyalar';

// Veri durumu
let shifts = [];
let filteredShifts = [];
let deleteShiftId = null;
const deleteModal = document.getElementById('delete-modal');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');

// DOM elementleri
const elements = {
    form: document.getElementById('shift-form'),
    tarih: document.getElementById('tarih'),
    giris: document.getElementById('giris'),
    cikis: document.getElementById('cikis'),
    shiftsList: document.getElementById('shifts-list'),
    ayFilter: document.getElementById('ay-filter'),
    clearAllBtn: document.getElementById('clear-all'),
    monthlyGrid: document.getElementById('monthly-grid'),
    
    // Stats
    aylikVardiya: document.getElementById('aylik-vardiya'),
    toplamSaat: document.getElementById('toplam-saat'),
    toplamKazanc: document.getElementById('toplam-kazanc'),
    
    // Özet
    ozetVardiya: document.getElementById('ozet-vardiya'),
    ozetToplamSaat: document.getElementById('ozet-toplam-saat'),
    ozetNormalSaat: document.getElementById('ozet-normal-saat'),
    ozetMesaiSaat: document.getElementById('ozet-mesai-saat'),
    ozetNormalUcret: document.getElementById('ozet-normal-ucret'),
    ozetMesaiUcret: document.getElementById('ozet-mesai-ucret'),
    ozetToplamKazanc: document.getElementById('ozet-toplam-kazanc')
};

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', async () => {
    // Bugünkü tarihi varsayılan olarak ayarla
    elements.tarih.value = new Date().toISOString().split('T')[0];
    
    // Firebase'i başlat (eğer config varsa)
    try {
        if (firebaseConfig.apiKey !== "your-api-key") {
            // db ve auth işlemleri zaten firebase.initializeApp içinde yapıldı
            await loadShifts();
        } else {
            console.log('Firebase config bulunamadı, yerel depolama kullanılıyor');
            loadShiftsFromLocal();
        }
    } catch (error) {
        console.error('Firebase bağlantı hatası:', error);
        loadShiftsFromLocal();
    }
    
    // Event listener'ları ekle
    setupEventListeners();
    
    // Delete modal'ını setup et
    setupDeleteModal();
    
    // İlk güncelleme
    updateDisplay();
});

// Event listener'ları ayarla
function setupEventListeners() {
    elements.form.addEventListener('submit', handleAddShift);
    elements.clearAllBtn.addEventListener('click', handleClearAll);
    elements.ayFilter.addEventListener('change', handleMonthFilter);
    
    // Saat input validation
    elements.giris.addEventListener('input', formatTimeInput);
    elements.cikis.addEventListener('input', formatTimeInput);
    elements.giris.addEventListener('blur', validateTimeInput);
    elements.cikis.addEventListener('blur', validateTimeInput);
}

// Saat formatını düzenle
function formatTimeInput(e) {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (value.length >= 3) {
        value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }
    e.target.value = value;
}

// Saat validasyonu
function validateTimeInput(e) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(e.target.value) && e.target.value !== '') {
        e.target.style.borderColor = 'var(--danger-500)';
        e.target.style.backgroundColor = 'var(--danger-50)';
    } else {
        e.target.style.borderColor = 'var(--gray-200)';
        e.target.style.backgroundColor = 'white';
    }
}

// Yeni vardiya ekleme
async function handleAddShift(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) {
        showMessage('Giriş yapmadan vardiya ekleyemezsiniz!', 'error');
        return;
    }
    const shiftData = {
        id: Date.now().toString(),
        tarih: elements.tarih.value,
        giris: elements.giris.value,
        cikis: elements.cikis.value,
        saatlikUcret: 92.1, // Sabit saatlik ücret
        aciklama: '', // Açıklama kaldırıldı
        olusturmaTarihi: new Date().toISOString(),
        userId: user.uid // Kullanıcıya özel
    };
    try {
        // Firebase'e kaydet
        if (db) {
            await db.collection(COLLECTION_NAME).doc(shiftData.id).set(shiftData);
        } else {
            // Yerel depolamaya kaydet
            const localShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
            localShifts.push(shiftData);
            localStorage.setItem('shifts', JSON.stringify(localShifts));
        }
        shifts.push(shiftData);
        elements.form.reset();
        elements.tarih.value = new Date().toISOString().split('T')[0];
        updateDisplay();
        showMessage('Vardiya başarıyla eklendi!', 'success');
    } catch (error) {
        console.error('Vardiya ekleme hatası:', error);
        showMessage('Vardiya eklenirken hata oluştu!', 'error');
    }
}

// Vardiya silme
// (ESKI FONKSIYON KALDIRILDI)

// Tüm vardiyaları temizle
async function handleClearAll() {
    if (!confirm('Tüm vardiyaları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        return;
    }
    
    try {
        if (db) {
            // Firebase'den tümünü sil
            const batch = db.batch();
            shifts.forEach(shift => {
                const docRef = db.collection(COLLECTION_NAME).doc(shift.id);
                batch.delete(docRef);
            });
            await batch.commit();
        } else {
            // Yerel depolamayı temizle
            localStorage.removeItem('shifts');
        }
        
        // Ana shifts dizisini temizle
        shifts = [];
        
        // Filtrelenmiş listeyi de temizle
        filteredShifts = [];
        
        updateDisplay();
        
        showMessage('Tüm vardiyalar silindi!', 'success');
        
    } catch (error) {
        console.error('Vardiyalar silinirken hata oluştu:', error);
        showMessage('Vardiyalar silinirken hata oluştu!', 'error');
    }
}

// Vardiyaları Firebase'den yükle
async function loadShifts() {
    const user = firebase.auth().currentUser;
    if (!user) {
        shifts = [];
        updateDisplay();
        return;
    }
    try {
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('userId', '==', user.uid)
            .orderBy('tarih', 'desc')
            .get();
        shifts = [];
        snapshot.forEach(doc => {
            shifts.push({ id: doc.id, ...doc.data() });
        });
        updateDisplay();
    } catch (error) {
        console.error('Vardiyalar yüklenirken hata oluştu:', error);
        loadShiftsFromLocal();
    }
}

// Vardiyaları yerel depolamadan yükle
function loadShiftsFromLocal() {
    const localShifts = localStorage.getItem('shifts');
    shifts = localShifts ? JSON.parse(localShifts) : [];
    // Tarihe göre sırala (en yeni ilk)
    shifts.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    console.log('Vardiyalar yerel depolamadan yüklendi:', shifts.length);
}

// Ay filtresi
function handleMonthFilter() {
    const selectedMonth = elements.ayFilter.value;
    
    if (selectedMonth === '') {
        filteredShifts = [...shifts];
    } else {
        const [year, month] = selectedMonth.split('-').map(Number);
        filteredShifts = shiftCalculator.aylikFiltrele(shifts, year, month - 1);
    }
    
    updateShiftsList();
    updateSummary();
}

// Gösterimi güncelle
function updateDisplay() {
    // Mevcut filtreyi koru, eğer hiç filtre yoksa tüm vardiyaları göster
    if (filteredShifts.length === 0 || filteredShifts.length === shifts.length) {
        filteredShifts = [...shifts];
    } else {
        // Mevcut filtrelenmiş listeden silinen vardiyaları çıkar
        filteredShifts = filteredShifts.filter(shift => 
            shifts.some(s => s.id === shift.id)
        );
    }
    
    updateMonthFilter();
    updateStats();
    updateMonthlyReports();
    updateShiftsList();
    updateSummary();
}

// Ay filtresi dropdown'unu güncelle
function updateMonthFilter() {
    const months = shiftCalculator.getAyListesi(shifts);
    
    elements.ayFilter.innerHTML = '<option value="">Tüm Aylar</option>';
    
    months.forEach(monthStr => {
        const [year, month] = monthStr.split('-').map(Number);
        const monthName = shiftCalculator.getAyIsmi(year, month);
        const option = document.createElement('option');
        option.value = monthStr;
        option.textContent = monthName;
        elements.ayFilter.appendChild(option);
    });
}

// İstatistikleri güncelle (bu ayın verileri)
function updateStats() {
    const now = new Date();
    const thisMonthShifts = shiftCalculator.aylikFiltrele(shifts, now.getFullYear(), now.getMonth());
    
    if (thisMonthShifts.length > 0) {
        const calculation = shiftCalculator.hesaplaVardiyalar(thisMonthShifts);
        
        elements.aylikVardiya.textContent = `${calculation.ozet.toplamVardiya} Vardiya`;
        elements.toplamSaat.textContent = shiftCalculator.formatSaat(calculation.ozet.toplamCalisanSaat);
        elements.toplamKazanc.textContent = shiftCalculator.formatUcret(calculation.ozet.toplamKazanc);
    } else {
        elements.aylikVardiya.textContent = '0 Vardiya';
        elements.toplamSaat.textContent = '0.00 saat';
        elements.toplamKazanc.textContent = '0.00 TL';
    }
}

// Aylık raporları güncelle
function updateMonthlyReports() {
    if (shifts.length === 0) {
        elements.monthlyGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #a0aec0;">
                <i class="fas fa-calendar-times" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
                <p>Henüz vardiya eklenmemiş</p>
            </div>
        `;
        return;
    }

    // Aylık verileri grupla
    const monthlyData = {};
    
    shifts.forEach(shift => {
        const shiftDate = new Date(shift.tarih);
        const monthKey = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = [];
        }
        
        monthlyData[monthKey].push(shift);
    });

    // Ay listesini tarihe göre sırala (en yeni ilk)
    const sortedMonths = Object.keys(monthlyData).sort().reverse();

    if (sortedMonths.length === 0) {
        elements.monthlyGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #a0aec0;">
                <p>Aylık veri bulunamadı</p>
            </div>
        `;
        return;
    }

    // Aylık listesini oluştur
    elements.monthlyGrid.innerHTML = sortedMonths.map(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthShifts = monthlyData[monthKey];
        const calculation = shiftCalculator.hesaplaVardiyalar(monthShifts);
        const monthName = shiftCalculator.getAyIsmi(year, month);

        return `
            <div class="month-item">
                <div class="month-header">
                    <h3 class="month-name">${monthName}</h3>
                    <div class="month-earning">${shiftCalculator.formatUcret(calculation.ozet.toplamKazanc)}</div>
                </div>
                <div class="month-details">
                    <div class="month-detail">
                        <span class="label">Vardiya:</span>
                        <span class="value">${calculation.ozet.toplamVardiya}</span>
                    </div>
                    <div class="month-detail">
                        <span class="label">Toplam Saat:</span>
                        <span class="value">${shiftCalculator.formatSaat(calculation.ozet.toplamCalisanSaat)}</span>
                    </div>
                    <div class="month-detail">
                        <span class="label">Normal Saat:</span>
                        <span class="value">${shiftCalculator.formatSaat(calculation.ozet.toplamNormalSaat)}</span>
                    </div>
                    <div class="month-detail">
                        <span class="label">Mesai:</span>
                        <span class="value">${shiftCalculator.formatSaat(calculation.ozet.toplamMesaiSaat)}</span>
                    </div>
                    <div class="month-detail">
                        <span class="label">Geç Giriş/Erken Çıkış:</span>
                        <span class="value">${shiftCalculator.formatGecErkenfark(calculation.ozet.toplamVardiya, calculation.ozet.toplamNormalSaat)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Vardiya listesini güncelle
function updateShiftsList() {
    // Filtrelenmiş vardiyaları tarihe göre sırala (en yeni ilk)
    filteredShifts.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    if (filteredShifts.length === 0) {
        elements.shiftsList.innerHTML = `
            <div class="no-shifts">
                <i class="fas fa-calendar-times"></i>
                <p>Henüz vardiya eklenmemiş</p>
            </div>
        `;
        return;
    }
    
    const calculation = shiftCalculator.hesaplaVardiyalar(filteredShifts);
    
    elements.shiftsList.innerHTML = calculation.vardiyaDetaylari.map(shift => `
        <div class="shift-item">
            <div class="shift-header">
                <span class="shift-date">${shiftCalculator.formatTarih(shift.tarih)}</span>
                <button class="shift-delete" onclick="showDeleteModal('${shift.id}')">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
            <div class="shift-details">
                <div class="shift-detail shift-time-highlight">
                    <span class="label">Giriş - Çıkış</span>
                    <span class="value">${shift.giris} - ${shift.cikis}</span>
                </div>
                <div class="shift-detail">
                    <span class="label">Çalışma Süresi</span>
                    <span class="value">${shiftCalculator.formatSaat(shift.calisanSaat)}</span>
                </div>
                <div class="shift-detail">
                    <span class="label">Mesai Saati</span>
                    <span class="value">${shiftCalculator.formatSaat(shift.mesaiSaat)}</span>
                </div>
                <div class="shift-detail">
                    <span class="label">Mesai Ücreti</span>
                    <span class="value">${shiftCalculator.formatUcret(shift.mesaiUcret)}</span>
                </div>
                <div class="shift-detail shift-earning-highlight">
                    <span class="label">💰 Toplam Kazanç</span>
                    <span class="value">${shiftCalculator.formatUcret(shift.vardiyaToplam)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Özet hesaplamayı güncelle
function updateSummary() {
    if (filteredShifts.length === 0) {
        elements.ozetVardiya.textContent = '0';
        elements.ozetToplamSaat.textContent = '0.00 saat';
        elements.ozetNormalSaat.textContent = '0.00 saat';
        elements.ozetMesaiSaat.textContent = '0.00 saat';
        elements.ozetNormalUcret.textContent = '0.00 TL';
        elements.ozetMesaiUcret.textContent = '0.00 TL';
        elements.ozetToplamKazanc.textContent = '0.00 TL';
        return;
    }
    
    const calculation = shiftCalculator.hesaplaVardiyalar(filteredShifts);
    const ozet = calculation.ozet;
    
    elements.ozetVardiya.textContent = ozet.toplamVardiya.toString();
    elements.ozetToplamSaat.textContent = shiftCalculator.formatSaat(ozet.toplamCalisanSaat);
    elements.ozetNormalSaat.textContent = shiftCalculator.formatSaat(ozet.toplamNormalSaat);
    elements.ozetMesaiSaat.textContent = shiftCalculator.formatSaat(ozet.toplamMesaiSaat);
    elements.ozetNormalUcret.textContent = shiftCalculator.formatUcret(ozet.toplamNormalUcret);
    elements.ozetMesaiUcret.textContent = shiftCalculator.formatUcret(ozet.toplamMesaiUcret);
    elements.ozetToplamKazanc.textContent = shiftCalculator.formatUcret(ozet.toplamKazanc);
}

// Modern Toast Notification Sistemi
function showMessage(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    
    // Toast ID oluştur
    const toastId = 'toast-' + Date.now();
    
    // Icon seçimi
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    // Toast HTML oluştur
    const toastHTML = `
        <div id="${toastId}" class="toast ${type}">
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="${icons[type] || icons.info}"></i>
                </div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="hideToast('${toastId}')">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress">
                <div class="toast-progress-bar" style="width: 100%; animation: progressbar ${duration}ms linear;"></div>
            </div>
        </div>
    `;
    
    // Toast'ı container'a ekle
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Toast elementini al
    const toastElement = document.getElementById(toastId);
    
    // Animasyonu başlat
    setTimeout(() => {
        toastElement.classList.add('show');
    }, 10);
    
    // Otomatik gizleme
    setTimeout(() => {
        hideToast(toastId);
    }, duration);
}

// Toast gizleme fonksiyonu
function hideToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        toastElement.classList.add('hide');
        
        // Animasyon tamamlandıktan sonra DOM'dan kaldır
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    }
}

// CSS animasyonu için keyframes ekle
if (!document.querySelector('#toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
        @keyframes progressbar {
            from { width: 100%; }
            to { width: 0%; }
        }
    `;
    document.head.appendChild(style);
}

// Global fonksiyonlar (HTML'den çağrılabilir) - DÜZELTİLMİŞ
window.showDeleteModal = function(shiftId) {
    deleteShiftId = shiftId;
    deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// Modal event listener'larını düzenli bir şekilde tanımla
function setupDeleteModal() {
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    const deleteModal = document.getElementById('delete-modal');
    
    // Onayla butonu
    deleteConfirmBtn.onclick = async function() {
        if (!deleteShiftId) return;
        
        try {
            // Firebase'den sil
            if (db) {
                await db.collection(COLLECTION_NAME).doc(deleteShiftId).delete();
            } else {
                // Yerel depolamadan sil
                const localShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
                const updatedShifts = localShifts.filter(shift => shift.id !== deleteShiftId);
                localStorage.setItem('shifts', JSON.stringify(updatedShifts));
            }
            
            // Ana shifts dizisinden sil
            shifts = shifts.filter(shift => shift.id !== deleteShiftId);
            
            // Filtrelenmiş listeden de sil
            filteredShifts = filteredShifts.filter(shift => shift.id !== deleteShiftId);
            
            // Görünümü güncelle
            updateDisplay();
            showMessage('Vardiya başarıyla silindi!', 'success');
            
        } catch (error) {
            console.error('Vardiya silme hatası:', error);
            showMessage('Vardiya silinirken hata oluştu!', 'error');
        }
        
        // Modal'ı kapat ve değişkeni temizle
        closeDeleteModal();
    };

    // İptal butonu
    deleteCancelBtn.onclick = function() {
        closeDeleteModal();
    };
    
    // Modal dışına tıklama ile kapat
    deleteModal.onclick = function(event) {
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    };
    
    // ESC tuşu ile kapat
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && deleteModal.style.display === 'block') {
            closeDeleteModal();
        }
    });
}

// Modal kapatma fonksiyonu
function closeDeleteModal() {
    deleteShiftId = null;
    deleteModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Modern Calendar Widget
class CalendarWidget {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.monthNames = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.render();
        
        // Bugünkü tarihi varsayılan olarak ayarla
        this.selectToday();
    }
    
    bindEvents() {
        const calendarInput = document.getElementById('tarih');
        const calendarModalOverlay = document.getElementById('calendar-modal-overlay');
        const calendarDropdown = document.getElementById('calendar-dropdown');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        const todayBtn = document.getElementById('calendar-today');
        const clearBtn = document.getElementById('calendar-clear');
        
        // Input tıklaması
        calendarInput.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showModal();
        });
        
        // Ay navigasyonu
        prevMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
        
        // Bugün butonu
        todayBtn.addEventListener('click', () => {
            this.selectToday();
        });
        
        // Temizle butonu
        clearBtn.addEventListener('click', () => {
            this.clearSelection();
        });
        
        // Modal overlay tıklaması (dışarı tıklama ile kapat)
        calendarModalOverlay.addEventListener('click', (e) => {
            if (e.target === calendarModalOverlay) {
                this.hideModal();
            }
        });
        
        // Dropdown içindeki tıklamaları durdur
        calendarDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // ESC tuşu ile kapat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }
    
    showModal() {
        const modalOverlay = document.getElementById('calendar-modal-overlay');
        modalOverlay.classList.add('show');
        // Focus management için
        document.body.style.overflow = 'hidden';
    }
    
    hideModal() {
        const modalOverlay = document.getElementById('calendar-modal-overlay');
        modalOverlay.classList.remove('show');
        // Focus management için
        document.body.style.overflow = '';
    }
    
    render() {
        this.renderHeader();
        this.renderDays();
    }
    
    renderHeader() {
        const monthYearElement = document.getElementById('month-year');
        const month = this.monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        monthYearElement.textContent = `${month} ${year}`;
    }
    
    renderDays() {
        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Bu ayın 1. günü
        const firstDay = new Date(year, month, 1);
        // Pazartesi = 0 olacak şekilde ayarla (JS'de Pazar = 0)
        const startDay = (firstDay.getDay() + 6) % 7;
        
        // Bu ayın son günü
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        // Önceki ayın son günleri
        for (let i = startDay - 1; i >= 0; i--) {
            const prevDate = new Date(year, month, -i);
            this.createDayElement(prevDate, true);
        }
        
        // Bu ayın günleri
        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day);
            this.createDayElement(date, false);
        }
        
        // Sonraki ayın ilk günleri (6 hafta tamamlamak için)
        const totalCells = daysContainer.children.length;
        const remainingCells = 42 - totalCells; // 6 hafta × 7 gün
        
        for (let i = 1; i <= remainingCells; i++) {
            const nextDate = new Date(year, month + 1, i);
            this.createDayElement(nextDate, true);
        }
    }
    
    createDayElement(date, isOtherMonth) {
        const daysContainer = document.getElementById('calendar-days');
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Bugün mü?
        const today = new Date();
        if (this.isSameDay(date, today)) {
            dayElement.classList.add('today');
        }
        
        // Seçili mi?
        if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
            dayElement.classList.add('selected');
        }
        
        // Tıklama olayı
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
        });
        
        daysContainer.appendChild(dayElement);
    }
    
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.updateInput();
        this.render();
        this.hideModal();
    }
    
    selectToday() {
        const today = new Date();
        this.selectedDate = new Date(today);
        this.currentDate = new Date(today);
        this.updateInput();
        this.render();
    }
    
    clearSelection() {
        this.selectedDate = null;
        this.updateInput();
        this.render();
    }
    
    updateInput() {
        const input = document.getElementById('tarih');
        if (this.selectedDate) {
            // YYYY-MM-DD formatında
            const year = this.selectedDate.getFullYear();
            const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.selectedDate.getDate()).padStart(2, '0');
            
            input.value = `${year}-${month}-${day}`;
            
            // Görünen metni güncelle
            const displayText = `${day}/${month}/${year}`;
            input.setAttribute('placeholder', displayText);
        } else {
            input.value = '';
            input.setAttribute('placeholder', 'Tarih seçin...');
        }
    }
    
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
}

// Calendar widget'ını başlat
document.addEventListener('DOMContentLoaded', () => {
    // Diğer initializationlar biraz bekledikten sonra calendar'ı başlat
    setTimeout(() => {
        new CalendarWidget();
    }, 100);
});

// Admin kontrolü için sabitler
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'cenker123.';

// Modal ve auth butonları
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const closeLogin = document.getElementById('close-login');
const closeRegister = document.getElementById('close-register');
const mainContent = document.getElementById('main-content');
const currentUserSpan = document.getElementById('current-user');
const authPanel = document.getElementById('auth-panel');
const userPanel = document.getElementById('user-panel');
const currentUserName = document.getElementById('current-user-name');

// Modal aç/kapat fonksiyonları
function openModal(modal) { modal.style.display = 'block'; }
function closeModal(modal) { modal.style.display = 'none'; }

// Sayfa ilk yüklendiğinde her şeyi gizle, sadece auth-panel göster
mainContent.style.display = 'none';
authPanel.style.display = '';
userPanel.style.display = 'none';
loginModal.style.display = 'none';
registerModal.style.display = 'none';

loginBtn.onclick = () => {
    mainContent.style.display = 'none';
    userPanel.style.display = 'none';
    registerModal.style.display = 'none'; // Kayıt modalı kapansın
    loginModal.style.display = 'block';
};
registerBtn.onclick = () => {
    mainContent.style.display = 'none';
    userPanel.style.display = 'none';
    loginModal.style.display = 'none'; // Giriş modalı kapansın
    registerModal.style.display = 'block';
};
closeLogin.onclick = () => {
    loginModal.style.display = 'none';
    if (!firebase.auth().currentUser) {
        authPanel.style.display = '';
    }
};
closeRegister.onclick = () => {
    registerModal.style.display = 'none';
    if (!firebase.auth().currentUser) {
        authPanel.style.display = '';
    }
};
window.onclick = function(event) {
    if (event.target === loginModal) closeModal(loginModal);
    if (event.target === registerModal) closeModal(registerModal);
};

// Kayıt işlemi
const registerForm = document.getElementById('register-form');
registerForm.onsubmit = async function(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const adminUsername = document.getElementById('admin-username').value.trim();
    const adminPassword = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('register-error');
    errorDiv.textContent = '';
    if (adminUsername !== ADMIN_USERNAME || adminPassword !== ADMIN_PASSWORD) {
        errorDiv.textContent = 'Admin bilgileri yanlış!';
        return;
    }
    try {
        // Firebase Auth ile e-posta olarak username kullan
        await firebase.auth().createUserWithEmailAndPassword(username + '@vardiya.com', password);
        closeModal(registerModal);
        showMessage('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
    } catch (err) {
        errorDiv.textContent = err.message;
    }
};

// Giriş işlemi
const loginForm = document.getElementById('login-form');
loginForm.onsubmit = async function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '';
    try {
        // Admin dahil tüm kullanıcılar için girişe izin ver
        await firebase.auth().signInWithEmailAndPassword(username + '@vardiya.com', password);
        closeModal(loginModal);
        showMessage('Giriş başarılı!', 'success');
    } catch (err) {
        errorDiv.textContent = 'Kullanıcı adı veya şifre yanlış!';
    }
};

// Oturum yönetimi
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        mainContent.style.display = 'block';
        authPanel.style.display = 'none';
        userPanel.style.display = '';
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
        currentUserName.textContent = user.email.replace('@vardiya.com', '');
        loadShifts();
    } else {
        mainContent.style.display = 'none';
        authPanel.style.display = '';
        userPanel.style.display = 'none';
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
        shifts = [];
        updateDisplay();
    }
});

logoutBtn.onclick = function() {
    firebase.auth().signOut();
};