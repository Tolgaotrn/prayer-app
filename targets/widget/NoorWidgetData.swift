import Foundation

let kAppGroup    = "group.com.tolgaoturan.huda"
let kWidgetKey   = "hudaWidgetData"
let kFeedIdxKey  = "hudaFeedIndex"
let kLikedKey    = "hudaWidgetLiked"
let kDhikrKey    = "hudaDhikr"

// MARK: - Alt modeller

struct PrayerEntryData: Codable, Hashable {
    var name:  String
    var time:  String
    var epoch: Double
}

struct FeedItemData: Codable, Hashable {
    var id:     String
    var kind:   String   // "verse" | "hadith" | "quote"
    var arabic: String
    var text:   String
    var meta:   String   // reference / source / author
}

struct WeatherData: Codable {
    var temp:      String   // "18°"
    var high:      String   // "22°"
    var low:       String   // "12°"
    var condition: String   // "Partly Cloudy"
    var sfSymbol:  String   // SF Symbol adı
}

// MARK: - Dhikr (tesbih sayacı) — app + widget paylaşır

struct DhikrState: Codable {
    var arabic:   String
    var translit: String
    var target:   Int
    var count:    Int    // bu turdaki sayım (0..<target)
    var rounds:   Int    // tamamlanan tur sayısı
    var total:    Int    // toplam çekim (lifetime)

    static var placeholder: DhikrState {
        DhikrState(arabic: "اللهُ أَكْبَر", translit: "Allahu Akbar",
                   target: 33, count: 0, rounds: 0, total: 0)
    }

    static func load() -> DhikrState {
        guard let defaults = UserDefaults(suiteName: kAppGroup) else { return .placeholder }
        if let raw = defaults.string(forKey: kDhikrKey),
           let data = raw.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(DhikrState.self, from: data) {
            return decoded
        }
        if let data = defaults.data(forKey: kDhikrKey),
           let decoded = try? JSONDecoder().decode(DhikrState.self, from: data) {
            return decoded
        }
        return .placeholder
    }

    func save() {
        guard let defaults = UserDefaults(suiteName: kAppGroup),
              let data = try? JSONEncoder().encode(self),
              let raw  = String(data: data, encoding: .utf8) else { return }
        defaults.set(raw, forKey: kDhikrKey)
    }

    /// Bir tesbih çek: hedefe ulaşınca tur tamamla, sayacı sıfırla, döngüye devam et.
    static func increment() {
        var s = load()
        s.total += 1
        s.count += 1
        if s.count >= s.target {
            s.count = 0
            s.rounds += 1
        }
        s.save()
    }

    static func reset() {
        var s = load()
        s.count = 0
        s.rounds = 0
        s.save()
    }

    var progress: Double {
        target > 0 ? min(1.0, Double(count) / Double(target)) : 0
    }
}

// MARK: - Ana model

struct HudaWidgetData: Codable {
    var feedItems:    [FeedItemData]
    var weather:      WeatherData?
    var city:         String
    var prayers:      [PrayerEntryData]
    var tomorrowFajr: PrayerEntryData?
    var streakDays:    Int
    var themeImageURL: String?
    var updatedAt:     Double

    init(
        feedItems: [FeedItemData], weather: WeatherData?, city: String,
        prayers: [PrayerEntryData], tomorrowFajr: PrayerEntryData?,
        streakDays: Int, themeImageURL: String?, updatedAt: Double
    ) {
        self.feedItems = feedItems
        self.weather = weather
        self.city = city
        self.prayers = prayers
        self.tomorrowFajr = tomorrowFajr
        self.streakDays = streakDays
        self.themeImageURL = themeImageURL
        self.updatedAt = updatedAt
    }

    // MARK: Dayanıklı decode — tek bir eksik/yanlış alan tüm payload'ı
    // (ve themeImageURL'i) düşürmesin. Aksi halde widget .placeholder'a
    // (themeImageURL: nil) düşer ve arka plan beyaz kalır.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        feedItems     = (try? c.decodeIfPresent([FeedItemData].self, forKey: .feedItems)) ?? []
        weather       = (try? c.decodeIfPresent(WeatherData.self, forKey: .weather)) ?? nil
        city          = (try? c.decodeIfPresent(String.self, forKey: .city)) ?? "Istanbul"
        prayers       = (try? c.decodeIfPresent([PrayerEntryData].self, forKey: .prayers)) ?? []
        tomorrowFajr  = (try? c.decodeIfPresent(PrayerEntryData.self, forKey: .tomorrowFajr)) ?? nil
        streakDays    = (try? c.decodeIfPresent(Int.self, forKey: .streakDays)) ?? 0
        themeImageURL = (try? c.decodeIfPresent(String.self, forKey: .themeImageURL)) ?? nil
        updatedAt     = (try? c.decodeIfPresent(Double.self, forKey: .updatedAt)) ?? 0
    }

    // MARK: Placeholder
    static var placeholder: HudaWidgetData {
        HudaWidgetData(
            feedItems: [
                FeedItemData(
                    id: "p1", kind: "verse",
                    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                    text:   "In the name of Allah, the Most Gracious, the Most Merciful.",
                    meta:   "Al-Fatihah · 1:1"
                ),
                FeedItemData(
                    id: "p2", kind: "hadith",
                    arabic: "",
                    text:   "The best of people are those who are most beneficial to others.",
                    meta:   "Al-Tabarani"
                ),
                FeedItemData(
                    id: "p3", kind: "quote",
                    arabic: "",
                    text:   "Patience is a pillar of faith.",
                    meta:   "Ali ibn Abi Talib"
                ),
            ],
            weather: WeatherData(temp: "18°", high: "22°", low: "12°",
                                 condition: "Partly Cloudy", sfSymbol: "cloud.sun.fill"),
            city:         "Istanbul",
            prayers: [
                PrayerEntryData(name: "Fajr",    time: "05:12", epoch: 0),
                PrayerEntryData(name: "Dhuhr",   time: "13:04", epoch: 0),
                PrayerEntryData(name: "Asr",     time: "16:38", epoch: 0),
                PrayerEntryData(name: "Maghrib", time: "19:45", epoch: 0),
                PrayerEntryData(name: "Isha",    time: "21:10", epoch: 0),
            ],
            tomorrowFajr: nil,
            streakDays:    7,
            themeImageURL: nil,
            updatedAt:     0
        )
    }

    // MARK: UserDefaults yükle — string VEYA data olarak yazılmış olabilir
    static func load() -> HudaWidgetData {
        guard let defaults = UserDefaults(suiteName: kAppGroup) else { return .placeholder }

        // 1) String olarak yazıldıysa (ExtensionStorage.setString → JSON.stringify)
        if let raw = defaults.string(forKey: kWidgetKey),
           let data = raw.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(HudaWidgetData.self, from: data) {
            return decoded
        }

        // 2) Data olarak yazıldıysa (setObject/setArray JSON Data)
        if let data = defaults.data(forKey: kWidgetKey),
           let decoded = try? JSONDecoder().decode(HudaWidgetData.self, from: data) {
            return decoded
        }

        return .placeholder
    }

    // MARK: Şu anki feed öğesi
    static func currentFeedIndex() -> Int {
        let defaults = UserDefaults(suiteName: kAppGroup)
        return defaults?.integer(forKey: kFeedIdxKey) ?? 0
    }

    func currentFeedItem() -> FeedItemData {
        guard !feedItems.isEmpty else { return HudaWidgetData.placeholder.feedItems[0] }
        let idx = HudaWidgetData.currentFeedIndex() % feedItems.count
        return feedItems[idx]
    }

    // Günün ayeti — tarihe bağlı deterministik seçim. Her gün farklı, gün içinde sabit.
    // Kilit ekranı widget'ı bunu kullanır (feedIndex'ten bağımsız, ←→ navigasyonu etkilemez).
    func verseOfTheDay(on date: Date) -> FeedItemData {
        guard !feedItems.isEmpty else { return HudaWidgetData.placeholder.feedItems[0] }
        let day = Calendar.current.ordinality(of: .day, in: .era, for: date) ?? 0
        return feedItems[day % feedItems.count]
    }

    func nextPrayer(after date: Date) -> PrayerEntryData? {
        let now      = date.timeIntervalSince1970
        let upcoming = prayers.filter { $0.epoch > now }.sorted { $0.epoch < $1.epoch }
        return upcoming.first ?? tomorrowFajr
    }

    var prayerDates: [Date] {
        prayers.map { Date(timeIntervalSince1970: $0.epoch) }
               .filter { $0.timeIntervalSince1970 > 0 }
               .sorted()
    }
}
