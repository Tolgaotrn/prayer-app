import WidgetKit
import SwiftUI

// MARK: - Renkler

extension Color {
    static let hudaCream  = Color(red: 0.949, green: 0.929, blue: 0.894)
    static let hudaGold   = Color(red: 0.788, green: 0.588, blue: 0.227)
    static let hudaInk    = Color(red: 0.173, green: 0.141, blue: 0.094)
    static let hudaBody   = Color(red: 0.361, green: 0.310, blue: 0.239)
    static let hudaRaised = Color(red: 0.894, green: 0.871, blue: 0.831)
}

// MARK: - Yardımcılar

private func nextPrayer(_ e: HudaEntry) -> PrayerEntryData? {
    e.data.nextPrayer(after: e.date)
}

private func countdown(_ e: HudaEntry) -> String {
    guard let n = nextPrayer(e), n.epoch > 0 else { return "" }
    let mins = max(0, Int((n.epoch - e.date.timeIntervalSince1970) / 60))
    let h = mins / 60, m = mins % 60
    return h > 0 ? "\(h)h \(m)m" : "\(m)m"
}

// MARK: - Tema arka planı (karartma YOK — yazı direkt tema üstünde, sadece gölge)
// fill=true (dikdörtgen/yatay): scaledToFill, yakınlaşma serbest
// fill=false (kare): scaledToFit, ORİJİNAL oran korunur — yakınlaşma/bozulma YOK

@ViewBuilder
private func themeBackground(_ image: UIImage?, fill: Bool = true) -> some View {
    if let img = image {
        if fill {
            Image(uiImage: img)
                .resizable()
                .scaledToFill()
        } else {
            // Kare: tam görsel, oran korunur. Boşluklar bulanık aynı görselle dolar.
            ZStack {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
                    .blur(radius: 18)
                    .opacity(0.55)
                Image(uiImage: img)
                    .resizable()
                    .scaledToFit()
            }
        }
    } else {
        Color.hudaCream
    }
}

// Küçük widget arka planı — DOWNSAMPLE'lı görsel, blur YOK (systemSmall bellek bütçesi).
// Boş/beyaz render bunun (eski blur+çift görsel) bütçeyi aşmasından kaynaklanıyordu.
@ViewBuilder
private func smallBackground(_ image: UIImage?) -> some View {
    if let img = image {
        Image(uiImage: img)
            .resizable()
            .scaledToFill()
    } else {
        LinearGradient(
            colors: [Color.hudaCream, Color.hudaRaised],
            startPoint: .top, endPoint: .bottom
        )
    }
}

// Yazı gölgesi — açık temalarda da koyu temalarda da okunur kılar
private extension View {
    func readableShadow(_ active: Bool) -> some View {
        self
            .shadow(color: active ? .black.opacity(0.55) : .clear, radius: 4, x: 0, y: 1)
            .shadow(color: active ? .black.opacity(0.35) : .clear, radius: 8, x: 0, y: 0)
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 1: Feed Small  (referans YOK, ❤️ var)
// ─────────────────────────────────────────────────────────────────

struct FeedSmallView: View {
    var entry: HudaEntry

    var body: some View {
        let item = entry.data.currentFeedItem()
        let img  = entry.themeImageSmall != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaGold
        let icon: Color  = img ? .white : .hudaBody

        VStack(alignment: .leading, spacing: 0) {
            Image(systemName: "book.fill")
                .font(.system(size: 13))
                .foregroundColor(muted)
                .readableShadow(img)

            Spacer(minLength: 4)

            Text(item.text)
                .font(.system(size: 14, weight: .bold, design: .serif))
                .foregroundColor(txt)
                .multilineTextAlignment(.leading)
                .lineLimit(5)
                .minimumScaleFactor(0.65)
                .readableShadow(img)

            Spacer(minLength: 4)

            HStack {
                Text(item.meta)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(muted)
                    .lineLimit(1)
                    .readableShadow(img)
                Spacer()
                if #available(iOS 17.0, *) {
                    Button(intent: LikeItemIntent()) {
                        Image(systemName: "heart")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(icon)
                            .readableShadow(img)
                    }
                    .buttonStyle(.plain)
                } else {
                    Image(systemName: "heart")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(icon)
                        .readableShadow(img)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(for: .widget) { smallBackground(entry.themeImageSmall) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 2: Feed Medium  (← → gezinme, referans YOK)
// ─────────────────────────────────────────────────────────────────

struct FeedMediumView: View {
    var entry: HudaEntry

    var body: some View {
        let item  = entry.data.currentFeedItem()
        let count = entry.data.feedItems.count
        let idx   = HudaWidgetData.currentFeedIndex() % max(1, count)
        let img   = entry.themeImage != nil
        let txt: Color  = img ? .white : .hudaInk
        let icon: Color = img ? .white : .hudaBody
        let dotOn: Color  = img ? .white : .hudaGold
        let dotOff: Color = img ? .white.opacity(0.4) : .hudaRaised

        VStack(spacing: 0) {
            // Dots
            if count > 1 {
                HStack(spacing: 5) {
                    ForEach(0..<min(count, 7), id: \.self) { i in
                        Circle()
                            .fill(i == idx % min(count, 7) ? dotOn : dotOff)
                            .frame(width: 5, height: 5)
                    }
                }
                .readableShadow(img)
            }

            Spacer(minLength: 0)

            HStack(alignment: .center, spacing: 0) {
                if #available(iOS 17.0, *) {
                    Button(intent: PrevItemIntent()) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(icon)
                            .frame(width: 30)
                            .readableShadow(img)
                    }
                    .buttonStyle(.plain)
                } else {
                    Spacer().frame(width: 30)
                }

                VStack(spacing: 6) {
                    if !item.arabic.isEmpty && item.kind == "verse" {
                        Text(item.arabic)
                            .font(.system(size: 14))
                            .environment(\.layoutDirection, .rightToLeft)
                            .foregroundColor(txt.opacity(0.9))
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .readableShadow(img)
                    }
                    Text(item.text)
                        .font(.system(size: 15, weight: .bold, design: .serif))
                        .foregroundColor(txt)
                        .multilineTextAlignment(.center)
                        .lineLimit(4)
                        .minimumScaleFactor(0.75)
                        .readableShadow(img)
                }
                .frame(maxWidth: .infinity)

                if #available(iOS 17.0, *) {
                    Button(intent: NextItemIntent()) {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(icon)
                            .frame(width: 30)
                            .readableShadow(img)
                    }
                    .buttonStyle(.plain)
                } else {
                    Spacer().frame(width: 30)
                }
            }

            Spacer(minLength: 0)

            HStack(spacing: 28) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(icon)
                    .readableShadow(img)
                if #available(iOS 17.0, *) {
                    Button(intent: LikeItemIntent()) {
                        Image(systemName: "heart")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(icon)
                            .readableShadow(img)
                    }
                    .buttonStyle(.plain)
                } else {
                    Image(systemName: "heart")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(icon)
                        .readableShadow(img)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
        .containerBackground(for: .widget) { themeBackground(entry.themeImage) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 3: Feed Large  (temiz okuma — referans VAR)
// ─────────────────────────────────────────────────────────────────

struct FeedLargeView: View {
    var entry: HudaEntry

    var body: some View {
        let item = entry.data.currentFeedItem()
        let img  = entry.themeImage != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.8) : .hudaBody
        let icon: Color  = img ? .white : .hudaBody
        let line: Color  = img ? .white.opacity(0.4) : .hudaRaised

        VStack(alignment: .center, spacing: 0) {
            Spacer(minLength: 0)

            if !item.arabic.isEmpty && item.kind == "verse" {
                Text(item.arabic)
                    .font(.system(size: 22))
                    .environment(\.layoutDirection, .rightToLeft)
                    .foregroundColor(txt.opacity(0.92))
                    .multilineTextAlignment(.center)
                    .lineLimit(3)
                    .readableShadow(img)
                    .padding(.bottom, 12)
            }

            Rectangle()
                .fill(line)
                .frame(width: 40, height: 1.5)
                .padding(.bottom, 12)

            Text(item.text)
                .font(.system(size: 18, weight: .bold, design: .serif))
                .foregroundColor(txt)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.8)
                .readableShadow(img)

            // Referans — sadece bu widget'ta
            Text(item.meta)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(muted)
                .multilineTextAlignment(.center)
                .readableShadow(img)
                .padding(.top, 8)

            Spacer(minLength: 0)

            HStack(spacing: 32) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(icon)
                    .readableShadow(img)
                if #available(iOS 17.0, *) {
                    Button(intent: LikeItemIntent()) {
                        Image(systemName: "heart")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(icon)
                            .readableShadow(img)
                    }
                    .buttonStyle(.plain)
                } else {
                    Image(systemName: "heart")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(icon)
                        .readableShadow(img)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(.horizontal, 6)
        .containerBackground(for: .widget) { themeBackground(entry.themeImage) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 4: Next Prayer Small
// ─────────────────────────────────────────────────────────────────

struct NextPrayerSmallView: View {
    var entry: HudaEntry

    var body: some View {
        let img = entry.themeImageSmall != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaBody
        let gold: Color  = img ? Color(red: 0.97, green: 0.85, blue: 0.55) : .hudaGold

        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 3) {
                Image(systemName: "location.fill").font(.system(size: 8))
                Text(entry.data.city).font(.system(size: 9, weight: .semibold)).lineLimit(1)
            }
            .foregroundColor(gold)
            .readableShadow(img)

            Spacer(minLength: 0)

            Text("NEXT PRAYER")
                .font(.system(size: 9, weight: .bold)).tracking(1.1)
                .foregroundColor(muted)
                .readableShadow(img)

            if let n = nextPrayer(entry) {
                Text(n.name)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(txt)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .readableShadow(img)
                Text(n.time)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(gold)
                    .readableShadow(img)
                if !countdown(entry).isEmpty {
                    Text("in \(countdown(entry))")
                        .font(.system(size: 11))
                        .foregroundColor(muted)
                        .readableShadow(img)
                }
            } else {
                Text("—")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(txt)
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(for: .widget) { smallBackground(entry.themeImageSmall) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 5: Next Prayer Medium
// ─────────────────────────────────────────────────────────────────

struct NextPrayerMediumView: View {
    var entry: HudaEntry

    var body: some View {
        let img = entry.themeImage != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaBody
        let gold: Color  = img ? Color(red: 0.97, green: 0.85, blue: 0.55) : .hudaGold
        let rowBg: Color = img ? .white.opacity(0.18) : .hudaGold.opacity(0.12)

        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("NEXT PRAYER")
                        .font(.system(size: 9, weight: .bold)).tracking(1)
                        .foregroundColor(muted)
                        .readableShadow(img)
                    if let n = nextPrayer(entry) {
                        HStack(alignment: .lastTextBaseline, spacing: 8) {
                            Text(n.name)
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(txt)
                                .readableShadow(img)
                            Text(n.time)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(gold)
                                .readableShadow(img)
                            if !countdown(entry).isEmpty {
                                Text("· in \(countdown(entry))")
                                    .font(.system(size: 11))
                                    .foregroundColor(muted)
                                    .readableShadow(img)
                            }
                        }
                    }
                }
                Spacer()
                HStack(spacing: 3) {
                    Image(systemName: "location.fill").font(.system(size: 9))
                    Text(entry.data.city).font(.system(size: 11, weight: .semibold))
                }
                .foregroundColor(gold)
                .readableShadow(img)
            }

            Spacer(minLength: 0)

            HStack(spacing: 0) {
                ForEach(entry.data.prayers, id: \.name) { p in
                    let isNext = nextPrayer(entry)?.name == p.name
                    VStack(spacing: 3) {
                        Text(String(p.name.prefix(3)))
                            .font(.system(size: 9, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? gold : muted)
                        Text(p.time)
                            .font(.system(size: 11, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? txt : muted)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
                    .background(isNext ? rowBg : Color.clear)
                    .cornerRadius(6)
                    .readableShadow(img)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(for: .widget) { themeBackground(entry.themeImage) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 6: Prayer Times Large
// ─────────────────────────────────────────────────────────────────

struct PrayerTimesLargeView: View {
    var entry: HudaEntry

    var body: some View {
        let img = entry.themeImage != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaBody
        let gold: Color  = img ? Color(red: 0.97, green: 0.85, blue: 0.55) : .hudaGold
        let rowBg: Color = img ? .white.opacity(0.18) : .hudaGold.opacity(0.10)
        let line: Color  = img ? .white.opacity(0.3) : .hudaRaised

        VStack(alignment: .leading, spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("PRAYER TIMES")
                        .font(.system(size: 10, weight: .bold)).tracking(1.2)
                        .foregroundColor(gold)
                        .readableShadow(img)
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill").font(.system(size: 10))
                        Text(entry.data.city)
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundColor(txt)
                    .readableShadow(img)
                }
                Spacer()
                if let n = nextPrayer(entry) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text("NEXT")
                            .font(.system(size: 8, weight: .bold)).tracking(1)
                            .foregroundColor(muted)
                        Text(n.name)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(gold)
                        if !countdown(entry).isEmpty {
                            Text("in \(countdown(entry))")
                                .font(.system(size: 11))
                                .foregroundColor(muted)
                        }
                    }
                    .readableShadow(img)
                }
            }
            .padding(.bottom, 10)

            Rectangle().fill(line).frame(height: 1).padding(.bottom, 8)

            VStack(spacing: 4) {
                ForEach(entry.data.prayers, id: \.name) { p in
                    let isNext = nextPrayer(entry)?.name == p.name
                    HStack {
                        Circle()
                            .fill(isNext ? gold : muted.opacity(0.5))
                            .frame(width: 7, height: 7)
                        Text(p.name)
                            .font(.system(size: 16, weight: isNext ? .bold : .regular))
                            .foregroundColor(isNext ? txt : muted)
                        Spacer()
                        Text(p.time)
                            .font(.system(size: 16, weight: isNext ? .bold : .semibold))
                            .foregroundColor(isNext ? gold : muted)
                    }
                    .padding(.horizontal, 8).padding(.vertical, 7)
                    .background(isNext ? rowBg : Color.clear)
                    .cornerRadius(8)
                    .readableShadow(img)
                }
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(for: .widget) { themeBackground(entry.themeImage) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 7: Weather + Prayer Medium
// ─────────────────────────────────────────────────────────────────

struct WeatherPrayerMediumView: View {
    var entry: HudaEntry

    var body: some View {
        let img = entry.themeImage != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaBody
        let gold: Color  = img ? Color(red: 0.97, green: 0.85, blue: 0.55) : .hudaGold
        let line: Color  = img ? .white.opacity(0.3) : .hudaRaised

        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                if let w = entry.data.weather {
                    Image(systemName: w.sfSymbol)
                        .font(.system(size: 28))
                        .foregroundColor(gold)
                        .readableShadow(img)
                    Text(w.temp)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(txt)
                        .readableShadow(img)
                    Text(w.condition)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(muted)
                        .lineLimit(1)
                        .readableShadow(img)
                    Spacer(minLength: 0)
                    HStack(spacing: 6) {
                        Text("H \(w.high)")
                        Text("L \(w.low)")
                    }
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(muted)
                    .readableShadow(img)
                } else {
                    Image(systemName: "thermometer.medium")
                        .font(.system(size: 22))
                        .foregroundColor(muted.opacity(0.7))
                    Text("Weather\nunavailable")
                        .font(.system(size: 11))
                        .foregroundColor(muted.opacity(0.7))
                        .lineLimit(2)
                        .readableShadow(img)
                }
                HStack(spacing: 3) {
                    Image(systemName: "location.fill").font(.system(size: 8))
                    Text(entry.data.city).font(.system(size: 9, weight: .semibold))
                }
                .foregroundColor(gold.opacity(0.95))
                .readableShadow(img)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

            Rectangle().fill(line).frame(width: 1).padding(.vertical, 4)

            VStack(alignment: .leading, spacing: 6) {
                Text("PRAYERS")
                    .font(.system(size: 9, weight: .bold)).tracking(1)
                    .foregroundColor(muted)
                    .padding(.leading, 10)
                    .readableShadow(img)

                ForEach(entry.data.prayers, id: \.name) { p in
                    let isNext = nextPrayer(entry)?.name == p.name
                    HStack(spacing: 6) {
                        Circle()
                            .fill(isNext ? gold : muted.opacity(0.4))
                            .frame(width: 5, height: 5)
                        Text(String(p.name.prefix(3)))
                            .font(.system(size: 10, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? txt : muted)
                        Spacer()
                        Text(p.time)
                            .font(.system(size: 10, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? gold : muted)
                    }
                    .padding(.horizontal, 10)
                    .readableShadow(img)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(for: .widget) { themeBackground(entry.themeImage) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 8: Streak Small  (sol üstte hilal+yıldız ikonu)
// ─────────────────────────────────────────────────────────────────

struct StreakSmallView: View {
    var entry: HudaEntry

    var body: some View {
        let img = entry.themeImageSmall != nil
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaBody
        let gold: Color  = img ? Color(red: 0.97, green: 0.85, blue: 0.55) : .hudaGold

        VStack(alignment: .leading, spacing: 0) {
            // Sol üst: İslami ikon (hilal + yıldız)
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 18))
                .foregroundColor(gold)
                .readableShadow(img)

            Spacer(minLength: 0)

            Text("\(entry.data.streakDays)")
                .font(.system(size: 46, weight: .heavy, design: .rounded))
                .foregroundColor(gold)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .readableShadow(img)
            Text("day streak")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(txt)
                .readableShadow(img)

            Spacer(minLength: 0)

            Text("Keep it going")
                .font(.system(size: 10))
                .foregroundColor(muted)
                .readableShadow(img)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(for: .widget) { smallBackground(entry.themeImageSmall) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Widget 9: Dhikr Counter Small  (tıkla → say, hedefte döngü)
// ─────────────────────────────────────────────────────────────────

struct DhikrSmallView: View {
    var entry: HudaEntry

    var body: some View {
        let img = entry.themeImageSmall != nil
        let d   = DhikrState.load()
        let txt: Color   = img ? .white : .hudaInk
        let muted: Color = img ? .white.opacity(0.85) : .hudaBody
        let gold: Color  = img ? Color(red: 0.97, green: 0.85, blue: 0.55) : .hudaGold
        let track: Color = img ? .white.opacity(0.25) : .hudaRaised

        let content = VStack(spacing: 4) {
            HStack {
                Text(d.translit.uppercased())
                    .font(.system(size: 9, weight: .bold)).tracking(0.8)
                    .foregroundColor(gold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .readableShadow(img)
                Spacer()
                if d.rounds > 0 {
                    Text("\(d.rounds)×")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(muted)
                        .readableShadow(img)
                }
            }

            Spacer(minLength: 0)

            ZStack {
                Circle()
                    .stroke(track, lineWidth: 6)
                Circle()
                    .trim(from: 0, to: CGFloat(d.progress))
                    .stroke(gold, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(d.count)")
                        .font(.system(size: 34, weight: .heavy, design: .rounded))
                        .foregroundColor(txt)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                    Text("/ \(d.target)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(muted)
                }
                .readableShadow(img)
            }
            .frame(width: 96, height: 96)

            Spacer(minLength: 0)

            Text("Tap to count · Total \(d.total)")
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(muted)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .readableShadow(img)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)

        // iOS 17+: tüm kart bir "say" butonu. Eski sürümde dokununca app açılır.
        Group {
            if #available(iOS 17.0, *) {
                Button(intent: DhikrTapIntent()) { content }
                    .buttonStyle(.plain)
            } else {
                content
            }
        }
        .containerBackground(for: .widget) { smallBackground(entry.themeImageSmall) }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK: - Lock Screen accessories
// ─────────────────────────────────────────────────────────────────

struct AccessoryPrayerInline: View {
    var entry: HudaEntry
    var body: some View {
        if let n = nextPrayer(entry) {
            Label("\(n.name)  \(n.time)  · \(countdown(entry))", systemImage: "moon.stars.fill")
        } else {
            Label(entry.data.city, systemImage: "moon.stars.fill")
        }
    }
}

struct AccessoryPrayerCircular: View {
    var entry: HudaEntry
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            if let n = nextPrayer(entry) {
                VStack(spacing: 1) {
                    Image(systemName: "moon.stars.fill").font(.system(size: 11))
                    Text(String(n.name.prefix(3))).font(.system(size: 9, weight: .bold))
                    Text(n.time).font(.system(size: 9))
                }
            } else {
                Image(systemName: "moon.stars.fill").font(.system(size: 18))
            }
        }
    }
}

struct AccessoryPrayerRectangular: View {
    var entry: HudaEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: "moon.stars.fill").font(.system(size: 10))
                Text("Next Prayer").font(.system(size: 11, weight: .bold))
            }
            if let n = nextPrayer(entry) {
                Text("\(n.name)  ·  \(n.time)")
                    .font(.system(size: 14, weight: .semibold))
                if !countdown(entry).isEmpty {
                    Text("in \(countdown(entry))").font(.system(size: 11))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// ── Günün ayeti (kilit ekranı, arka plansız) ─────────────────────

struct AccessoryVerseRectangular: View {
    var entry: HudaEntry
    var body: some View {
        let item = entry.data.verseOfTheDay(on: entry.date)
        // Sadece sözün kendisi — ikon yok, başlık yok, referans yok.
        Text(item.text)
            .font(.system(size: 14, weight: .medium))
            .lineLimit(4)
            .minimumScaleFactor(0.6)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct AccessoryVerseInline: View {
    var entry: HudaEntry
    var body: some View {
        let item = entry.data.verseOfTheDay(on: entry.date)
        // Inline: sadece metin, ikon yok.
        Text(item.text)
            .lineLimit(1)
    }
}

struct VerseLockView: View {
    @Environment(\.widgetFamily) private var family
    var entry: HudaEntry
    var body: some View {
        switch family {
        case .accessoryInline:
            AccessoryVerseInline(entry: entry)
        default:
            AccessoryVerseRectangular(entry: entry)
        }
    }
}
