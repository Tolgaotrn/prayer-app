import Foundation

// MARK: - Paylaşılan veri modeli
// React Native tarafı (lib/widgetSync.ts) App Group UserDefaults'a "noorWidgetData"
// anahtarıyla JSON string yazar. Burada onu okuyup parse ederiz.

let kAppGroup = "group.com.noor.app"
let kWidgetDataKey = "noorWidgetData"

struct PrayerEntryData: Codable, Hashable {
    var name: String
    var time: String      // "HH:MM" — gösterim
    var epoch: Double      // bugünkü vaktin epoch saniyesi (timeline için)
}

struct NoorWidgetData: Codable {
    var verseArabic: String
    var verseTranslation: String
    var verseReference: String
    var city: String
    var prayers: [PrayerEntryData]
    var tomorrowFajr: PrayerEntryData?
    var streakDays: Int
    var updatedAt: Double

    static var placeholder: NoorWidgetData {
        NoorWidgetData(
            verseArabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            verseTranslation: "In the name of Allah, the Most Gracious, the Most Merciful.",
            verseReference: "Al-Fatihah 1:1",
            city: "Istanbul",
            prayers: [
                PrayerEntryData(name: "Fajr", time: "05:12", epoch: 0),
                PrayerEntryData(name: "Dhuhr", time: "13:04", epoch: 0),
                PrayerEntryData(name: "Asr", time: "16:38", epoch: 0),
                PrayerEntryData(name: "Maghrib", time: "19:45", epoch: 0),
                PrayerEntryData(name: "Isha", time: "21:10", epoch: 0),
            ],
            tomorrowFajr: nil,
            streakDays: 0,
            updatedAt: 0
        )
    }

    static func load() -> NoorWidgetData {
        guard
            let defaults = UserDefaults(suiteName: kAppGroup),
            let raw = defaults.string(forKey: kWidgetDataKey),
            let data = raw.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(NoorWidgetData.self, from: data)
        else {
            return .placeholder
        }
        return decoded
    }

    /// entryDate'ten sonraki ilk namaz vakti (bugün bitmişse yarın Fajr).
    func nextPrayer(after date: Date) -> PrayerEntryData? {
        let now = date.timeIntervalSince1970
        let upcoming = prayers
            .filter { $0.epoch > now }
            .sorted { $0.epoch < $1.epoch }
        if let first = upcoming.first { return first }
        return tomorrowFajr
    }

    /// Timeline'ı yenilemek için bugünkü tüm vakitlerin tarihleri.
    var prayerDates: [Date] {
        prayers
            .map { Date(timeIntervalSince1970: $0.epoch) }
            .filter { $0.timeIntervalSince1970 > 0 }
            .sorted()
    }
}
