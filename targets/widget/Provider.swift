import WidgetKit
import SwiftUI

// MARK: - Timeline entry

struct NoorEntry: TimelineEntry {
    let date: Date
    let data: NoorWidgetData
    let content: WidgetContent
}

// MARK: - Timeline provider (configurable, iOS 17+)

struct NoorProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> NoorEntry {
        NoorEntry(date: Date(), data: .placeholder, content: .auto)
    }

    func snapshot(for configuration: NoorConfigIntent, in context: Context) async -> NoorEntry {
        NoorEntry(date: Date(), data: .load(), content: configuration.content)
    }

    func timeline(for configuration: NoorConfigIntent, in context: Context) async -> Timeline<NoorEntry> {
        let data = NoorWidgetData.load()
        let now = Date()

        // Bugünkü kalan namaz vakitlerinde + her saat başı yeni entry üret →
        // "next prayer" ve geri sayım uygulama açılmadan da otomatik döner.
        var dates: [Date] = [now]
        dates.append(contentsOf: data.prayerDates.filter { $0 > now })

        // Sonraki ~6 saat için saatlik tazeleme noktaları (geri sayım yumuşaklığı)
        for i in 1...6 {
            if let d = Calendar.current.date(byAdding: .hour, value: i, to: now) {
                dates.append(d)
            }
        }
        dates = Array(Set(dates)).sorted()

        let entries = dates.map { NoorEntry(date: $0, data: data, content: configuration.content) }

        // En geç 6 saat sonra ya da bir sonraki vakitte yeniden hesapla
        let refresh = dates.last ?? now.addingTimeInterval(3600)
        return Timeline(entries: entries, policy: .after(refresh))
    }
}
