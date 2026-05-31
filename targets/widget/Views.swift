import WidgetKit
import SwiftUI

// MARK: - Marka renkleri
extension Color {
    static let noorCream = Color(red: 0.949, green: 0.929, blue: 0.894)   // #F2EDE4
    static let noorGold  = Color(red: 0.788, green: 0.588, blue: 0.227)   // #C9963A
    static let noorInk   = Color(red: 0.173, green: 0.141, blue: 0.094)   // #2C2418
    static let noorBody  = Color(red: 0.361, green: 0.310, blue: 0.239)   // #5C4F3D
}

// MARK: - Otomatik içerik seçimi
// .auto: küçük boyutta sıradaki namaz, orta boyutta namaz + ayet birlikte.
func resolvedContent(_ content: WidgetContent, family: WidgetFamily) -> WidgetContent {
    if content != .auto { return content }
    switch family {
    case .systemMedium, .systemLarge: return .prayer
    default: return .prayer
    }
}

// MARK: - Ana giriş görünümü (aile + içerik dağıtımı)

struct NoorWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: NoorEntry

    var body: some View {
        let content = resolvedContent(entry.content, family: family)
        switch family {
        case .accessoryInline:
            AccessoryInlineView(entry: entry, content: content)
        case .accessoryCircular:
            AccessoryCircularView(entry: entry)
        case .accessoryRectangular:
            AccessoryRectangularView(entry: entry, content: content)
        case .systemMedium:
            MediumView(entry: entry, content: content)
        default:
            SmallView(entry: entry, content: content)
        }
    }
}

// MARK: - Yardımcılar

private func nextPrayer(_ entry: NoorEntry) -> PrayerEntryData? {
    entry.data.nextPrayer(after: entry.date)
}

private func countdown(_ entry: NoorEntry) -> String {
    guard let next = nextPrayer(entry), next.epoch > 0 else { return "" }
    let mins = max(0, Int((next.epoch - entry.date.timeIntervalSince1970) / 60))
    let h = mins / 60, m = mins % 60
    return h > 0 ? "\(h)h \(m)m" : "\(m)m"
}

// MARK: - Home screen: Small

struct SmallView: View {
    var entry: NoorEntry
    var content: WidgetContent

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            switch content {
            case .verse:
                Text("VERSE OF THE DAY")
                    .font(.system(size: 9, weight: .bold)).tracking(1)
                    .foregroundColor(.noorGold)
                Text(entry.data.verseTranslation)
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .foregroundColor(.noorInk)
                    .lineLimit(4)
                Spacer(minLength: 0)
                Text(entry.data.verseReference)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.noorBody)
            case .streak:
                Spacer()
                Text("\(entry.data.streakDays)")
                    .font(.system(size: 44, weight: .heavy, design: .rounded))
                    .foregroundColor(.noorGold)
                Text("day streak")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.noorInk)
                Spacer()
            default: // prayer
                HStack(spacing: 4) {
                    Image(systemName: "location.fill").font(.system(size: 9))
                    Text(entry.data.city).font(.system(size: 10, weight: .semibold))
                }
                .foregroundColor(.noorGold)
                Spacer(minLength: 0)
                if let n = nextPrayer(entry) {
                    Text("NEXT PRAYER")
                        .font(.system(size: 9, weight: .bold)).tracking(1)
                        .foregroundColor(.noorBody)
                    Text(n.name)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.noorInk)
                    Text(n.time)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.noorGold)
                    if !countdown(entry).isEmpty {
                        Text("in \(countdown(entry))")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.noorBody)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(Color.noorCream, for: .widget)
    }
}

// MARK: - Home screen: Medium (namaz satırı + sıradaki vurgu)

struct MediumView: View {
    var entry: NoorEntry
    var content: WidgetContent

    var body: some View {
        Group {
            if content == .verse {
                VStack(alignment: .leading, spacing: 8) {
                    Text("VERSE OF THE DAY")
                        .font(.system(size: 10, weight: .bold)).tracking(1.2)
                        .foregroundColor(.noorGold)
                    Text(entry.data.verseTranslation)
                        .font(.system(size: 15, weight: .medium, design: .serif))
                        .foregroundColor(.noorInk)
                        .lineLimit(3)
                    Spacer(minLength: 0)
                    Text(entry.data.verseReference)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.noorBody)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            } else {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("NEXT PRAYER")
                                .font(.system(size: 9, weight: .bold)).tracking(1)
                                .foregroundColor(.noorBody)
                            if let n = nextPrayer(entry) {
                                HStack(spacing: 6) {
                                    Text(n.name).font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.noorInk)
                                    if !countdown(entry).isEmpty {
                                        Text("· in \(countdown(entry))")
                                            .font(.system(size: 12, weight: .medium))
                                            .foregroundColor(.noorGold)
                                    }
                                }
                            }
                        }
                        Spacer()
                        HStack(spacing: 3) {
                            Image(systemName: "location.fill").font(.system(size: 9))
                            Text(entry.data.city).font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundColor(.noorGold)
                    }
                    Spacer(minLength: 0)
                    HStack(spacing: 0) {
                        ForEach(entry.data.prayers, id: \.name) { p in
                            let isNext = nextPrayer(entry)?.name == p.name
                            VStack(spacing: 3) {
                                Text(p.name)
                                    .font(.system(size: 10, weight: isNext ? .bold : .medium))
                                    .foregroundColor(isNext ? .noorGold : .noorBody)
                                Text(p.time)
                                    .font(.system(size: 12, weight: isNext ? .bold : .semibold))
                                    .foregroundColor(isNext ? .noorInk : .noorBody)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
        }
        .containerBackground(Color.noorCream, for: .widget)
    }
}

// MARK: - Lock screen: Inline (kilit ekranı saatin altındaki tek satır)

struct AccessoryInlineView: View {
    var entry: NoorEntry
    var content: WidgetContent

    var body: some View {
        if content == .streak {
            Label("\(entry.data.streakDays) day streak", systemImage: "flame.fill")
        } else if let n = nextPrayer(entry) {
            Label("\(n.name) \(n.time)", systemImage: "moon.stars.fill")
        } else {
            Text(entry.data.verseReference)
        }
    }
}

// MARK: - Lock screen: Circular

struct AccessoryCircularView: View {
    var entry: NoorEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            if let n = nextPrayer(entry) {
                VStack(spacing: 1) {
                    Image(systemName: "moon.stars.fill").font(.system(size: 12))
                    Text(n.name.prefix(4)).font(.system(size: 9, weight: .bold))
                    Text(n.time).font(.system(size: 9, weight: .medium))
                }
            } else {
                Image(systemName: "moon.stars.fill").font(.system(size: 18))
            }
        }
    }
}

// MARK: - Lock screen: Rectangular

struct AccessoryRectangularView: View {
    var entry: NoorEntry
    var content: WidgetContent

    var body: some View {
        if content == .verse {
            VStack(alignment: .leading, spacing: 1) {
                Text("Verse of the Day").font(.system(size: 11, weight: .bold))
                Text(entry.data.verseTranslation)
                    .font(.system(size: 12)).lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: "moon.stars.fill").font(.system(size: 11))
                    Text("Next Prayer").font(.system(size: 11, weight: .bold))
                }
                if let n = nextPrayer(entry) {
                    Text("\(n.name) · \(n.time)")
                        .font(.system(size: 14, weight: .semibold))
                    if !countdown(entry).isEmpty {
                        Text("in \(countdown(entry))").font(.system(size: 11))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
