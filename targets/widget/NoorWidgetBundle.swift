import WidgetKit
import SwiftUI

// MARK: - Bundle

@main
struct HudaWidgetBundle: WidgetBundle {
    var body: some Widget {
        HudaFeedSmallWidget()
        HudaFeedMediumWidget()
        HudaFeedLargeWidget()
        HudaNextPrayerWidget()
        HudaNextPrayerMediumWidget()
        HudaPrayerTimesWidget()
        HudaWeatherWidget()
        HudaStreakWidget()
        HudaDhikrWidget()
    }
}

// ─────────────────────────────────────────────────────────────────
// 1 · Feed Small — tek kart + ❤️
// ─────────────────────────────────────────────────────────────────

struct HudaFeedSmallWidget: Widget {
    let kind = "HudaFeedSmall"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            FeedSmallView(entry: entry)
        }
        .configurationDisplayName("Daily Card")
        .supportedFamilies([.systemSmall])
    }
}

// ─────────────────────────────────────────────────────────────────
// 2 · Feed Medium — ← → butonlu gezinme
// ─────────────────────────────────────────────────────────────────

struct HudaFeedMediumWidget: Widget {
    let kind = "HudaFeedMedium"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            FeedMediumView(entry: entry)
        }
        .configurationDisplayName("Content Feed")
        .supportedFamilies([.systemMedium])
    }
}

// ─────────────────────────────────────────────────────────────────
// 3 · Feed Large — temiz okuma modu
// ─────────────────────────────────────────────────────────────────

struct HudaFeedLargeWidget: Widget {
    let kind = "HudaFeedLarge"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            FeedLargeView(entry: entry)
        }
        .configurationDisplayName("Reading Card")
        .supportedFamilies([.systemLarge])
    }
}

// ─────────────────────────────────────────────────────────────────
// 4 · Next Prayer Small
// ─────────────────────────────────────────────────────────────────

struct HudaNextPrayerWidget: Widget {
    let kind = "HudaNextPrayer"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            NextPrayerSmallView(entry: entry)
        }
        .configurationDisplayName("Next Prayer")
        .supportedFamilies([.systemSmall, .accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

// ─────────────────────────────────────────────────────────────────
// 5 · Next Prayer Medium — next vurgu + tüm vakitler
// ─────────────────────────────────────────────────────────────────

struct HudaNextPrayerMediumWidget: Widget {
    let kind = "HudaNextPrayerMedium"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            NextPrayerMediumView(entry: entry)
        }
        .configurationDisplayName("Prayer Countdown")
        .supportedFamilies([.systemMedium])
    }
}

// ─────────────────────────────────────────────────────────────────
// 6 · Prayer Times Large — tam takvim + altta ayet
// ─────────────────────────────────────────────────────────────────

struct HudaPrayerTimesWidget: Widget {
    let kind = "HudaPrayerTimes"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            PrayerTimesLargeView(entry: entry)
        }
        .configurationDisplayName("Prayer Times")
        .supportedFamilies([.systemLarge])
    }
}

// ─────────────────────────────────────────────────────────────────
// 7 · Weather + Prayer Medium
// ─────────────────────────────────────────────────────────────────

struct HudaWeatherWidget: Widget {
    let kind = "HudaWeather"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            WeatherPrayerMediumView(entry: entry)
        }
        .configurationDisplayName("Weather & Prayer")
        .supportedFamilies([.systemMedium])
    }
}

// ─────────────────────────────────────────────────────────────────
// 8 · Streak Small
// ─────────────────────────────────────────────────────────────────

struct HudaStreakWidget: Widget {
    let kind = "HudaStreak"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            StreakSmallView(entry: entry)
        }
        .configurationDisplayName("My Streak")
        .supportedFamilies([.systemSmall])
    }
}

// ─────────────────────────────────────────────────────────────────
// 9 · Dhikr Counter Small — tıkla → say, hedefte döngü
// ─────────────────────────────────────────────────────────────────

struct HudaDhikrWidget: Widget {
    let kind = "HudaDhikr"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HudaProvider()) { entry in
            DhikrSmallView(entry: entry)
        }
        .configurationDisplayName("Dhikr Counter")
        .supportedFamilies([.systemSmall])
    }
}
