/**
 * cities — Manuel konum seçimi için hazır şehir listesi.
 * Koordinatlar gömülü → internet/izin gerektirmez, namaz vakti hesabı offline çalışır.
 */

export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const CITIES: City[] = [
  // ── Türkiye ──
  { name: 'Istanbul',   country: 'Türkiye',        latitude: 41.0082, longitude: 28.9784 },
  { name: 'Ankara',     country: 'Türkiye',        latitude: 39.9334, longitude: 32.8597 },
  { name: 'Izmir',      country: 'Türkiye',        latitude: 38.4237, longitude: 27.1428 },
  { name: 'Bursa',      country: 'Türkiye',        latitude: 40.1828, longitude: 29.0665 },
  { name: 'Antalya',    country: 'Türkiye',        latitude: 36.8969, longitude: 30.7133 },
  { name: 'Konya',      country: 'Türkiye',        latitude: 37.8746, longitude: 32.4932 },
  { name: 'Adana',      country: 'Türkiye',        latitude: 37.0000, longitude: 35.3213 },
  { name: 'Gaziantep',  country: 'Türkiye',        latitude: 37.0662, longitude: 37.3833 },

  // ── Haremeyn & Körfez ──
  { name: 'Makkah',     country: 'Saudi Arabia',   latitude: 21.3891, longitude: 39.8579 },
  { name: 'Madinah',    country: 'Saudi Arabia',   latitude: 24.5247, longitude: 39.5692 },
  { name: 'Riyadh',     country: 'Saudi Arabia',   latitude: 24.7136, longitude: 46.6753 },
  { name: 'Jeddah',     country: 'Saudi Arabia',   latitude: 21.4858, longitude: 39.1925 },
  { name: 'Dubai',      country: 'UAE',            latitude: 25.2048, longitude: 55.2708 },
  { name: 'Abu Dhabi',  country: 'UAE',            latitude: 24.4539, longitude: 54.3773 },
  { name: 'Doha',       country: 'Qatar',          latitude: 25.2854, longitude: 51.5310 },
  { name: 'Kuwait City',country: 'Kuwait',         latitude: 29.3759, longitude: 47.9774 },
  { name: 'Manama',     country: 'Bahrain',        latitude: 26.2285, longitude: 50.5860 },
  { name: 'Muscat',     country: 'Oman',           latitude: 23.5880, longitude: 58.3829 },

  // ── Orta Doğu & Kuzey Afrika ──
  { name: 'Cairo',      country: 'Egypt',          latitude: 30.0444, longitude: 31.2357 },
  { name: 'Amman',      country: 'Jordan',         latitude: 31.9454, longitude: 35.9284 },
  { name: 'Jerusalem',  country: 'Palestine',      latitude: 31.7683, longitude: 35.2137 },
  { name: 'Baghdad',    country: 'Iraq',           latitude: 33.3152, longitude: 44.3661 },
  { name: 'Beirut',     country: 'Lebanon',        latitude: 33.8938, longitude: 35.5018 },
  { name: 'Damascus',   country: 'Syria',          latitude: 33.5138, longitude: 36.2765 },
  { name: 'Tehran',     country: 'Iran',           latitude: 35.6892, longitude: 51.3890 },
  { name: 'Casablanca', country: 'Morocco',        latitude: 33.5731, longitude: -7.5898 },
  { name: 'Tunis',      country: 'Tunisia',        latitude: 36.8065, longitude: 10.1815 },
  { name: 'Algiers',    country: 'Algeria',        latitude: 36.7538, longitude: 3.0588 },

  // ── Güney & Güneydoğu Asya ──
  { name: 'Karachi',    country: 'Pakistan',       latitude: 24.8607, longitude: 67.0011 },
  { name: 'Lahore',     country: 'Pakistan',       latitude: 31.5204, longitude: 74.3587 },
  { name: 'Islamabad',  country: 'Pakistan',       latitude: 33.6844, longitude: 73.0479 },
  { name: 'Dhaka',      country: 'Bangladesh',     latitude: 23.8103, longitude: 90.4125 },
  { name: 'Delhi',      country: 'India',          latitude: 28.7041, longitude: 77.1025 },
  { name: 'Mumbai',     country: 'India',          latitude: 19.0760, longitude: 72.8777 },
  { name: 'Jakarta',    country: 'Indonesia',      latitude: -6.2088, longitude: 106.8456 },
  { name: 'Surabaya',   country: 'Indonesia',      latitude: -7.2575, longitude: 112.7521 },
  { name: 'Kuala Lumpur',country: 'Malaysia',      latitude: 3.1390,  longitude: 101.6869 },

  // ── Avrupa ──
  { name: 'London',     country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Birmingham', country: 'United Kingdom', latitude: 52.4862, longitude: -1.8904 },
  { name: 'Paris',      country: 'France',         latitude: 48.8566, longitude: 2.3522 },
  { name: 'Berlin',     country: 'Germany',        latitude: 52.5200, longitude: 13.4050 },
  { name: 'Cologne',    country: 'Germany',        latitude: 50.9375, longitude: 6.9603 },
  { name: 'Amsterdam',  country: 'Netherlands',    latitude: 52.3676, longitude: 4.9041 },
  { name: 'Brussels',   country: 'Belgium',        latitude: 50.8503, longitude: 4.3517 },
  { name: 'Vienna',     country: 'Austria',        latitude: 48.2082, longitude: 16.3738 },
  { name: 'Stockholm',  country: 'Sweden',         latitude: 59.3293, longitude: 18.0686 },

  // ── Amerika ──
  { name: 'New York',   country: 'USA',            latitude: 40.7128, longitude: -74.0060 },
  { name: 'Chicago',    country: 'USA',            latitude: 41.8781, longitude: -87.6298 },
  { name: 'Los Angeles',country: 'USA',            latitude: 34.0522, longitude: -118.2437 },
  { name: 'Toronto',    country: 'Canada',         latitude: 43.6532, longitude: -79.3832 },

  // ── Afrika (Sahra altı) ──
  { name: 'Lagos',      country: 'Nigeria',        latitude: 6.5244,  longitude: 3.3792 },
  { name: 'Nairobi',    country: 'Kenya',          latitude: -1.2864, longitude: 36.8172 },
];
