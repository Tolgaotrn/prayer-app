import WidgetKit
import SwiftUI
import ImageIO

// MARK: - Entry

struct HudaEntry: TimelineEntry {
    let date: Date
    let data: HudaWidgetData
    let themeImage: UIImage?        // full-res — medium/large için
    let themeImageSmall: UIImage?   // downsample — systemSmall bellek bütçesi için
}

// MARK: - Ortak provider (tüm widget tipleri paylaşır)
//
// ÖNEMLİ: Timeline ASLA network beklemez. Veri (namaz/streak/feed) anında
// gösterilir. Tema görseli SADECE cache'den senkron okunur; cache yoksa
// arka planda indirilip kaydedilir ve bir sonraki reload'da görünür.

struct HudaProvider: TimelineProvider {

    func placeholder(in context: Context) -> HudaEntry {
        HudaEntry(date: Date(), data: .placeholder, themeImage: nil, themeImageSmall: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (HudaEntry) -> Void) {
        let data  = HudaWidgetData.load()
        let image = ThemeImageCache.cached(urlString: data.themeImageURL)
        let small = ThemeImageCache.cached(urlString: data.themeImageURL, maxPixel: 360)
        completion(HudaEntry(date: Date(), data: data, themeImage: image, themeImageSmall: small))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HudaEntry>) -> Void) {
        let data  = HudaWidgetData.load()
        let now   = Date()
        let image = ThemeImageCache.cached(urlString: data.themeImageURL)  // SENKRON, network YOK
        let small = ThemeImageCache.cached(urlString: data.themeImageURL, maxPixel: 360)

        var dates: [Date] = [now]
        dates.append(contentsOf: data.prayerDates.filter { $0 > now })
        for i in 1...6 {
            if let d = Calendar.current.date(byAdding: .hour, value: i, to: now) {
                dates.append(d)
            }
        }
        dates = Array(Set(dates)).sorted()

        let entries  = dates.map { HudaEntry(date: $0, data: data, themeImage: image, themeImageSmall: small) }
        let refresh  = Calendar.current.date(byAdding: .hour, value: 1, to: now)
                       ?? now.addingTimeInterval(3600)
        let timeline = Timeline(entries: entries, policy: .after(refresh))

        // Timeline'ı HEMEN tamamla — bloke etme
        completion(timeline)

        // Görsel cache'de yoksa arka planda indir, kaydet, reload tetikle
        if image == nil {
            ThemeImageCache.prefetch(urlString: data.themeImageURL)
        }
    }
}

// MARK: - Tema görseli cache (App Group container'da dosya)

enum ThemeImageCache {

    private static func fileURL(for urlString: String?) -> URL? {
        guard
            let urlString = urlString, !urlString.isEmpty,
            let url = URL(string: urlString),
            let container = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: kAppGroup
            )
        else { return nil }
        return container.appendingPathComponent("theme_\(url.lastPathComponent)")
    }

    /// SENKRON: yalnızca diskten okur, network yok.
    /// maxPixel verilirse ImageIO ile bellek-dostu downsample yapar (systemSmall için).
    static func cached(urlString: String?, maxPixel: CGFloat? = nil) -> UIImage? {
        guard let file = fileURL(for: urlString) else { return nil }

        if let maxPixel = maxPixel {
            let srcOpts: [CFString: Any] = [kCGImageSourceShouldCache: false]
            guard let src = CGImageSourceCreateWithURL(file as CFURL, srcOpts as CFDictionary) else { return nil }
            let opts: [CFString: Any] = [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceShouldCacheImmediately: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: maxPixel,
            ]
            if let cg = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) {
                return UIImage(cgImage: cg)
            }
            // Thumbnail üretilemezse (bazı PNG'lerde olur) tam görsele düş —
            // küçük widget en azından arka planı göstersin, beyaz kalmasın.
        }

        guard let data = try? Data(contentsOf: file) else { return nil }
        return UIImage(data: data)
    }

    /// Arka planda indir → App Group'a kaydet → widget'ları yenile.
    static func prefetch(urlString: String?) {
        guard
            let urlString = urlString, !urlString.isEmpty,
            let url  = URL(string: urlString),
            let file = fileURL(for: urlString)
        else { return }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data, UIImage(data: data) != nil else { return }
            try? data.write(to: file)
            WidgetCenter.shared.reloadAllTimelines()
        }.resume()
    }
}
