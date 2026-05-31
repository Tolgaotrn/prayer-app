/**
 * i18n — Uygulama arayüzü çevirileri (EN/TR/FR/ID/AR)
 *
 * useT() hook'u: useOnboardingStore'daki `language`'ı okur, t(key, vars) döndürür.
 * Eksik anahtar → İngilizce'ye düşer. Namaz adları da çevrilir (prayer.<key>).
 *
 * Kullanım:
 *   const t = useT();
 *   <Text>{t('home.today')}</Text>
 *   <Text>{t('profile.savedCount', { n: 3 })}</Text>
 */
import { useOnboardingStore } from '../stores/useOnboardingStore';

export type UILang = 'en' | 'tr' | 'fr' | 'id' | 'ar';

export function resolveUILang(stored?: string): UILang {
  switch (stored) {
    case 'Turkish': return 'tr';
    case 'French': return 'fr';
    case 'Indonesian': return 'id';
    case 'Arabic': return 'ar';
    default: return 'en';
  }
}

type Dict = Record<string, string>;

const en: Dict = {
  'common.back': 'Back',
  'common.all': 'All',

  'home.today': 'Today',
  'home.apps': 'Apps',
  'home.nextPrayer': 'NEXT PRAYER',
  'home.away': '{c} away',

  'tile.prayerTimes': 'Prayer Times',  'sub.prayerTimes': 'Daily schedule',
  'tile.qibla': 'Qibla',               'sub.qibla': 'Find direction',
  'tile.tasbih': 'Tasbih',             'sub.tasbih': 'Dhikr counter',
  'tile.reminders': 'Reminders',       'sub.reminders': 'Prayer & verses',
  'tile.homeWidgets': 'Home Widgets',  'sub.homeWidgets': 'Add to screen',
  'tile.lockScreen': 'Lock Screen',    'sub.lockScreen': 'Glance widgets',
  'tile.quran': 'Quran',               'sub.quran': 'Read verses',
  'tile.duas': 'Duas',                 'sub.duas': 'Supplications',

  'prayer.fajr': 'Fajr', 'prayer.sunrise': 'Sunrise', 'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Isha',
  'common.next': 'Next',

  'qibla.title': 'Qibla',
  'qibla.facing': 'Facing the Qibla',
  'qibla.rotate': 'Rotate until 🕋 is at the top',
  'qibla.noCompass': 'Compass not available',
  'qibla.toMakkah': 'to Makkah',
  'qibla.location': 'Location',
  'qibla.heading': 'Heading',
  'qibla.note': 'Compass needs a real device. The angle above is correct for your city — face {d}° from North.',

  'tasbih.title': 'Tasbih',
  'tasbih.of': 'of {n}',
  'tasbih.tap': 'Tap',
  'tasbih.completed': 'Completed sets',
  'tasbih.total': 'Total count',
  'dhikr.subhan': 'Glory be to Allah',
  'dhikr.alhamd': 'All praise to Allah',
  'dhikr.akbar': 'Allah is the Greatest',
  'dhikr.tahlil': 'There is no god but Allah',
  'dhikr.istighfar': 'I seek Allah’s forgiveness',

  'pt.title': 'Prayer Times',
  'pt.in': 'in {c}',
  'pt.calculating': 'calculating…',
  'pt.setReminders': 'Set prayer reminders',

  'rem.title': 'Reminders',
  'rem.prayerTimes': 'Prayer times',
  'rem.turnAllOn': 'Turn all on',
  'rem.turnAllOff': 'Turn all off',
  'rem.daily': 'Daily inspiration',
  'rem.dailyVerse': 'Daily Verse',
  'rem.dailyHadith': 'Daily Hadith',
  'rem.everyMorning': 'Every morning · 08:00',
  'rem.everyEvening': 'Every evening · 20:00',
  'rem.off': 'Notifications are off. Tap to enable.',
  'rem.note': 'Prayer reminders fire at each prayer time for {c}.',
  'rem.webNote': ' Notifications require the mobile app.',

  'profile.title': 'Profile',
  'profile.quickActions': 'Quick actions',
  'profile.savedVerses': 'Saved Verses',
  'profile.reminders': 'Reminders',
  'profile.settings': 'Settings',
  'profile.name': 'Name',
  'profile.language': 'Language',
  'profile.notifications': 'Notifications',
  'profile.darkMode': 'Dark Mode',
  'profile.unlockTitle': 'Unlock everything ✦',
  'profile.unlockSub': 'All quotes, themes, categories & no ads',
  'profile.restore': 'Restore Purchase',
  'profile.privacy': 'Privacy Policy',
  'profile.terms': 'Terms of Use',
  'profile.rateApp': 'Rate Noor',
  'profile.contactUs': 'Contact Us',
  'profile.about': 'About',
  'profile.version': 'Version',
  'profile.font': 'Display Font',
  'profile.appearance': 'Appearance',
  'profile.account': 'Account',
  'profile.support': 'Support',
  'profile.legal': 'Legal',
  'profile.savedCount': '{n} saved',
  'profile.dailyCount': '{n}× daily',
  'profile.dayStreak': 'day streak',
  'profile.member': 'Member',
  'profile.premium': 'Premium',
  'profile.free': 'Free',

  'feed.home': 'Home',
  'feed.premium': 'Premium',
  'feed.notifications': 'Notifications',
  'feed.themes': 'Themes',
  'feed.share': 'Share',
  'feed.like': 'Like',
  'feed.swipeUp': 'Swipe up for next',
  'feed.noSavedTitle': 'No saved verses yet',
  'feed.noSavedBody': 'Tap the heart on any verse to save it here. Or browse other topics to fill your feed.',
  'feed.browseTopics': 'Browse topics',
};

const tr: Dict = {
  'common.back': 'Geri',
  'common.all': 'Tümü',

  'home.today': 'Bugün',
  'home.apps': 'Uygulamalar',
  'home.nextPrayer': 'SONRAKİ VAKİT',
  'home.away': '{c} kaldı',

  'tile.prayerTimes': 'Namaz Vakitleri', 'sub.prayerTimes': 'Günlük takvim',
  'tile.qibla': 'Kıble',                 'sub.qibla': 'Yönü bul',
  'tile.tasbih': 'Tesbih',               'sub.tasbih': 'Zikir sayacı',
  'tile.reminders': 'Hatırlatıcılar',    'sub.reminders': 'Namaz & ayet',
  'tile.homeWidgets': 'Ana Ekran',       'sub.homeWidgets': 'Widget ekle',
  'tile.lockScreen': 'Kilit Ekranı',     'sub.lockScreen': 'Hızlı widget',
  'tile.quran': 'Kur\'an',               'sub.quran': 'Ayet oku',
  'tile.duas': 'Dualar',                 'sub.duas': 'Dua & niyaz',

  'prayer.fajr': 'Sabah', 'prayer.sunrise': 'Güneş', 'prayer.dhuhr': 'Öğle',
  'prayer.asr': 'İkindi', 'prayer.maghrib': 'Akşam', 'prayer.isha': 'Yatsı',
  'common.next': 'Sıradaki',

  'qibla.title': 'Kıble',
  'qibla.facing': 'Kıbleye dönüksün',
  'qibla.rotate': '🕋 yukarı gelene dek çevir',
  'qibla.noCompass': 'Pusula kullanılamıyor',
  'qibla.toMakkah': 'Mekke yönü',
  'qibla.location': 'Konum',
  'qibla.heading': 'Yön',
  'qibla.note': 'Pusula gerçek cihaz gerektirir. Yukarıdaki açı şehrin için doğru — Kuzeyden {d}° dön.',

  'tasbih.title': 'Tesbih',
  'tasbih.of': '/ {n}',
  'tasbih.tap': 'Dokun',
  'tasbih.completed': 'Tamamlanan tur',
  'tasbih.total': 'Toplam',
  'dhikr.subhan': 'Allah’ı tesbih ederim',
  'dhikr.alhamd': 'Hamd Allah’a mahsustur',
  'dhikr.akbar': 'Allah en büyüktür',
  'dhikr.tahlil': 'Allah’tan başka ilah yoktur',
  'dhikr.istighfar': 'Allah’tan bağışlanma dilerim',

  'pt.title': 'Namaz Vakitleri',
  'pt.in': '{c} sonra',
  'pt.calculating': 'hesaplanıyor…',
  'pt.setReminders': 'Namaz hatırlatıcıları kur',

  'rem.title': 'Hatırlatıcılar',
  'rem.prayerTimes': 'Namaz vakitleri',
  'rem.turnAllOn': 'Hepsini aç',
  'rem.turnAllOff': 'Hepsini kapat',
  'rem.daily': 'Günlük ilham',
  'rem.dailyVerse': 'Günün Ayeti',
  'rem.dailyHadith': 'Günün Hadisi',
  'rem.everyMorning': 'Her sabah · 08:00',
  'rem.everyEvening': 'Her akşam · 20:00',
  'rem.off': 'Bildirimler kapalı. Açmak için dokun.',
  'rem.note': 'Namaz hatırlatıcıları {c} için her vakitte çalar.',
  'rem.webNote': ' Bildirimler mobil uygulama gerektirir.',

  'profile.title': 'Profil',
  'profile.quickActions': 'Hızlı işlemler',
  'profile.savedVerses': 'Kayıtlı Ayetler',
  'profile.reminders': 'Hatırlatıcılar',
  'profile.settings': 'Ayarlar',
  'profile.name': 'İsim',
  'profile.language': 'Dil',
  'profile.notifications': 'Bildirimler',
  'profile.darkMode': 'Koyu Mod',
  'profile.unlockTitle': 'Her şeyi aç ✦',
  'profile.unlockSub': 'Tüm alıntılar, temalar, kategoriler & reklamsız',
  'profile.restore': 'Satın Alımı Geri Yükle',
  'profile.privacy': 'Gizlilik Politikası',
  'profile.terms': 'Kullanım Koşulları',
  'profile.rateApp': 'Noor\'u Değerlendir',
  'profile.contactUs': 'Bize Ulaş',
  'profile.about': 'Hakkında',
  'profile.version': 'Versiyon',
  'profile.font': 'Görüntüleme Fontu',
  'profile.appearance': 'Görünüm',
  'profile.account': 'Hesap',
  'profile.support': 'Destek',
  'profile.legal': 'Yasal',
  'profile.savedCount': '{n} kayıt',
  'profile.dailyCount': 'Günde {n}×',
  'profile.dayStreak': 'gün serisi',
  'profile.member': 'Üye',
  'profile.premium': 'Premium',
  'profile.free': 'Ücretsiz',

  'feed.home': 'Ana Sayfa',
  'feed.premium': 'Premium',
  'feed.notifications': 'Bildirimler',
  'feed.themes': 'Temalar',
  'feed.share': 'Paylaş',
  'feed.like': 'Beğen',
  'feed.swipeUp': 'Sonraki için yukarı kaydır',
  'feed.noSavedTitle': 'Henüz kayıtlı ayet yok',
  'feed.noSavedBody': 'Herhangi bir ayetteki kalbe dokunarak buraya kaydet. Ya da feed\'ini doldurmak için konulara göz at.',
  'feed.browseTopics': 'Konulara göz at',
};

const fr: Dict = {
  'common.back': 'Retour',
  'common.all': 'Tout',
  'home.today': 'Aujourd’hui',
  'home.apps': 'Applications',
  'home.nextPrayer': 'PROCHAINE PRIÈRE',
  'home.away': 'dans {c}',
  'tile.prayerTimes': 'Horaires', 'sub.prayerTimes': 'Programme du jour',
  'tile.qibla': 'Qibla', 'sub.qibla': 'Trouver la direction',
  'tile.tasbih': 'Tasbih', 'sub.tasbih': 'Compteur de dhikr',
  'tile.reminders': 'Rappels', 'sub.reminders': 'Prière & versets',
  'tile.homeWidgets': 'Widgets', 'sub.homeWidgets': 'Écran d’accueil',
  'tile.lockScreen': 'Écran verr.', 'sub.lockScreen': 'Widgets rapides',
  'tile.quran': 'Coran', 'sub.quran': 'Lire les versets',
  'tile.duas': 'Douas', 'sub.duas': 'Invocations',
  'prayer.fajr': 'Fajr', 'prayer.sunrise': 'Lever', 'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Isha',
  'common.next': 'Suivant',
  'qibla.title': 'Qibla',
  'qibla.facing': 'Vous faites face à la Qibla',
  'qibla.rotate': 'Tournez jusqu’à 🕋 en haut',
  'qibla.noCompass': 'Boussole indisponible',
  'qibla.toMakkah': 'vers La Mecque',
  'qibla.location': 'Position', 'qibla.heading': 'Cap',
  'qibla.note': 'La boussole nécessite un appareil réel. L’angle ci-dessus est correct — orientez-vous à {d}° du Nord.',
  'tasbih.title': 'Tasbih', 'tasbih.of': 'sur {n}', 'tasbih.tap': 'Toucher',
  'tasbih.completed': 'Séries terminées', 'tasbih.total': 'Total',
  'dhikr.subhan': 'Gloire à Allah', 'dhikr.alhamd': 'Louange à Allah',
  'dhikr.akbar': 'Allah est le plus grand', 'dhikr.tahlil': 'Nul dieu sauf Allah',
  'dhikr.istighfar': 'Je demande pardon à Allah',
  'pt.title': 'Horaires de prière', 'pt.in': 'dans {c}', 'pt.calculating': 'calcul…',
  'pt.setReminders': 'Configurer les rappels',
  'rem.title': 'Rappels', 'rem.prayerTimes': 'Heures de prière',
  'rem.turnAllOn': 'Tout activer', 'rem.turnAllOff': 'Tout désactiver',
  'rem.daily': 'Inspiration quotidienne', 'rem.dailyVerse': 'Verset du jour',
  'rem.dailyHadith': 'Hadith du jour', 'rem.everyMorning': 'Chaque matin · 08:00',
  'rem.everyEvening': 'Chaque soir · 20:00',
  'rem.off': 'Notifications désactivées. Touchez pour activer.',
  'rem.note': 'Les rappels sonnent à chaque prière pour {c}.',
  'rem.webNote': ' Les notifications nécessitent l’application mobile.',
  'profile.title': 'Profil', 'profile.quickActions': 'Actions rapides',
  'profile.savedVerses': 'Versets enregistrés', 'profile.reminders': 'Rappels',
  'profile.settings': 'Paramètres', 'profile.name': 'Nom', 'profile.language': 'Langue',
  'profile.notifications': 'Notifications', 'profile.darkMode': 'Mode sombre',
  'profile.unlockTitle': 'Tout débloquer ✦', 'profile.unlockSub': 'Citations, thèmes & sans pub',
  'profile.restore': 'Restaurer l’achat', 'profile.privacy': 'Confidentialité', 'profile.terms': 'Conditions',
  'profile.savedCount': '{n} enregistrés', 'profile.dailyCount': '{n}×/jour',
  'feed.home': 'Accueil', 'feed.premium': 'Premium', 'feed.notifications': 'Notifications',
  'feed.themes': 'Thèmes', 'feed.share': 'Partager', 'feed.like': 'J’aime',
  'feed.swipeUp': 'Glissez vers le haut', 'feed.noSavedTitle': 'Aucun verset enregistré',
  'feed.noSavedBody': 'Touchez le cœur sur un verset pour l’enregistrer ici.',
  'feed.browseTopics': 'Parcourir les sujets',
};

const id: Dict = {
  'common.back': 'Kembali', 'common.all': 'Semua',
  'home.today': 'Hari ini', 'home.apps': 'Aplikasi',
  'home.nextPrayer': 'SHALAT BERIKUTNYA', 'home.away': '{c} lagi',
  'tile.prayerTimes': 'Jadwal Shalat', 'sub.prayerTimes': 'Jadwal harian',
  'tile.qibla': 'Kiblat', 'sub.qibla': 'Cari arah',
  'tile.tasbih': 'Tasbih', 'sub.tasbih': 'Penghitung dzikir',
  'tile.reminders': 'Pengingat', 'sub.reminders': 'Shalat & ayat',
  'tile.homeWidgets': 'Widget', 'sub.homeWidgets': 'Layar utama',
  'tile.lockScreen': 'Layar Kunci', 'sub.lockScreen': 'Widget cepat',
  'tile.quran': 'Quran', 'sub.quran': 'Baca ayat',
  'tile.duas': 'Doa', 'sub.duas': 'Permohonan',
  'prayer.fajr': 'Subuh', 'prayer.sunrise': 'Terbit', 'prayer.dhuhr': 'Zuhur',
  'prayer.asr': 'Asar', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Isya',
  'common.next': 'Berikutnya',
  'qibla.title': 'Kiblat', 'qibla.facing': 'Menghadap Kiblat',
  'qibla.rotate': 'Putar hingga 🕋 di atas', 'qibla.noCompass': 'Kompas tidak tersedia',
  'qibla.toMakkah': 'ke Makkah', 'qibla.location': 'Lokasi', 'qibla.heading': 'Arah',
  'qibla.note': 'Kompas perlu perangkat asli. Sudut di atas benar — hadap {d}° dari Utara.',
  'tasbih.title': 'Tasbih', 'tasbih.of': 'dari {n}', 'tasbih.tap': 'Ketuk',
  'tasbih.completed': 'Set selesai', 'tasbih.total': 'Total',
  'dhikr.subhan': 'Maha Suci Allah', 'dhikr.alhamd': 'Segala puji bagi Allah',
  'dhikr.akbar': 'Allah Maha Besar', 'dhikr.tahlil': 'Tiada tuhan selain Allah',
  'dhikr.istighfar': 'Aku memohon ampun kepada Allah',
  'pt.title': 'Jadwal Shalat', 'pt.in': '{c} lagi', 'pt.calculating': 'menghitung…',
  'pt.setReminders': 'Atur pengingat shalat',
  'rem.title': 'Pengingat', 'rem.prayerTimes': 'Waktu shalat',
  'rem.turnAllOn': 'Aktifkan semua', 'rem.turnAllOff': 'Matikan semua',
  'rem.daily': 'Inspirasi harian', 'rem.dailyVerse': 'Ayat Harian',
  'rem.dailyHadith': 'Hadis Harian', 'rem.everyMorning': 'Setiap pagi · 08:00',
  'rem.everyEvening': 'Setiap malam · 20:00',
  'rem.off': 'Notifikasi mati. Ketuk untuk mengaktifkan.',
  'rem.note': 'Pengingat shalat berbunyi tiap waktu untuk {c}.',
  'rem.webNote': ' Notifikasi memerlukan aplikasi seluler.',
  'profile.title': 'Profil', 'profile.quickActions': 'Aksi cepat',
  'profile.savedVerses': 'Ayat Tersimpan', 'profile.reminders': 'Pengingat',
  'profile.settings': 'Pengaturan', 'profile.name': 'Nama', 'profile.language': 'Bahasa',
  'profile.notifications': 'Notifikasi', 'profile.darkMode': 'Mode Gelap',
  'profile.unlockTitle': 'Buka semua ✦', 'profile.unlockSub': 'Kutipan, tema & tanpa iklan',
  'profile.restore': 'Pulihkan Pembelian', 'profile.privacy': 'Privasi', 'profile.terms': 'Ketentuan',
  'profile.savedCount': '{n} tersimpan', 'profile.dailyCount': '{n}×/hari',
  'feed.home': 'Beranda', 'feed.premium': 'Premium', 'feed.notifications': 'Notifikasi',
  'feed.themes': 'Tema', 'feed.share': 'Bagikan', 'feed.like': 'Suka',
  'feed.swipeUp': 'Geser ke atas', 'feed.noSavedTitle': 'Belum ada ayat tersimpan',
  'feed.noSavedBody': 'Ketuk hati pada ayat untuk menyimpannya di sini.',
  'feed.browseTopics': 'Jelajahi topik',
};

const ar: Dict = {
  'common.back': 'رجوع', 'common.all': 'الكل',
  'home.today': 'اليوم', 'home.apps': 'التطبيقات',
  'home.nextPrayer': 'الصلاة القادمة', 'home.away': 'بعد {c}',
  'tile.prayerTimes': 'مواقيت الصلاة', 'sub.prayerTimes': 'جدول اليوم',
  'tile.qibla': 'القبلة', 'sub.qibla': 'حدّد الاتجاه',
  'tile.tasbih': 'التسبيح', 'sub.tasbih': 'عدّاد الذكر',
  'tile.reminders': 'التذكيرات', 'sub.reminders': 'الصلاة والآيات',
  'tile.homeWidgets': 'الأدوات', 'sub.homeWidgets': 'الشاشة الرئيسية',
  'tile.lockScreen': 'شاشة القفل', 'sub.lockScreen': 'أدوات سريعة',
  'tile.quran': 'القرآن', 'sub.quran': 'اقرأ الآيات',
  'tile.duas': 'الأدعية', 'sub.duas': 'أدعية',
  'prayer.fajr': 'الفجر', 'prayer.sunrise': 'الشروق', 'prayer.dhuhr': 'الظهر',
  'prayer.asr': 'العصر', 'prayer.maghrib': 'المغرب', 'prayer.isha': 'العشاء',
  'common.next': 'التالي',
  'qibla.title': 'القبلة', 'qibla.facing': 'أنت تواجه القبلة',
  'qibla.rotate': 'أدر حتى 🕋 في الأعلى', 'qibla.noCompass': 'البوصلة غير متاحة',
  'qibla.toMakkah': 'نحو مكة', 'qibla.location': 'الموقع', 'qibla.heading': 'الاتجاه',
  'qibla.note': 'تحتاج البوصلة لجهاز حقيقي. الزاوية أعلاه صحيحة — اتجه {d}° من الشمال.',
  'tasbih.title': 'التسبيح', 'tasbih.of': 'من {n}', 'tasbih.tap': 'انقر',
  'tasbih.completed': 'الجولات المكتملة', 'tasbih.total': 'الإجمالي',
  'dhikr.subhan': 'سبحان الله', 'dhikr.alhamd': 'الحمد لله',
  'dhikr.akbar': 'الله أكبر', 'dhikr.tahlil': 'لا إله إلا الله',
  'dhikr.istighfar': 'أستغفر الله',
  'pt.title': 'مواقيت الصلاة', 'pt.in': 'بعد {c}', 'pt.calculating': 'جارٍ الحساب…',
  'pt.setReminders': 'ضبط تذكيرات الصلاة',
  'rem.title': 'التذكيرات', 'rem.prayerTimes': 'أوقات الصلاة',
  'rem.turnAllOn': 'تشغيل الكل', 'rem.turnAllOff': 'إيقاف الكل',
  'rem.daily': 'إلهام يومي', 'rem.dailyVerse': 'آية اليوم',
  'rem.dailyHadith': 'حديث اليوم', 'rem.everyMorning': 'كل صباح · 08:00',
  'rem.everyEvening': 'كل مساء · 20:00',
  'rem.off': 'الإشعارات متوقفة. انقر للتفعيل.',
  'rem.note': 'تنطلق التذكيرات عند كل صلاة لـ {c}.',
  'rem.webNote': ' تتطلب الإشعارات تطبيق الهاتف.',
  'profile.title': 'الملف الشخصي', 'profile.quickActions': 'إجراءات سريعة',
  'profile.savedVerses': 'الآيات المحفوظة', 'profile.reminders': 'التذكيرات',
  'profile.settings': 'الإعدادات', 'profile.name': 'الاسم', 'profile.language': 'اللغة',
  'profile.notifications': 'الإشعارات', 'profile.darkMode': 'الوضع الداكن',
  'profile.unlockTitle': 'افتح كل شيء ✦', 'profile.unlockSub': 'كل الاقتباسات والثيمات وبدون إعلانات',
  'profile.restore': 'استعادة الشراء', 'profile.privacy': 'الخصوصية', 'profile.terms': 'الشروط',
  'profile.savedCount': '{n} محفوظة', 'profile.dailyCount': '{n}× يوميًا',
  'feed.home': 'الرئيسية', 'feed.premium': 'بريميوم', 'feed.notifications': 'الإشعارات',
  'feed.themes': 'الثيمات', 'feed.share': 'مشاركة', 'feed.like': 'إعجاب',
  'feed.swipeUp': 'اسحب للأعلى للتالي', 'feed.noSavedTitle': 'لا آيات محفوظة بعد',
  'feed.noSavedBody': 'انقر القلب على أي آية لحفظها هنا.',
  'feed.browseTopics': 'تصفّح المواضيع',
};

const DICTS: Record<UILang, Dict> = { en, tr, fr, id, ar };

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

export function translate(lang: UILang, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  }
  return s;
}

export function useT(): TFunc {
  const stored = useOnboardingStore((s) => s.language);
  const lang = resolveUILang(stored);
  return (key, vars) => translate(lang, key, vars);
}

const LOCALE_TAGS: Record<UILang, string> = {
  en: 'en-US', tr: 'tr-TR', fr: 'fr-FR', id: 'id-ID', ar: 'ar',
};

/** toLocaleDateString için dil etiketi (tarihler de yerelleşsin). */
export function useLocaleTag(): string {
  const stored = useOnboardingStore((s) => s.language);
  return LOCALE_TAGS[resolveUILang(stored)];
}
