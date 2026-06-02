import AppIntents
import WidgetKit

// MARK: - Sonraki feed öğesi

struct NextItemIntent: AppIntent {
    static var title: LocalizedStringResource = "Next"
    static var description = IntentDescription("Show next content item.")

    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: kAppGroup) else { return .result() }
        let data    = HudaWidgetData.load()
        let count   = max(1, data.feedItems.count)
        let current = defaults.integer(forKey: kFeedIdxKey)
        defaults.set((current + 1) % count, forKey: kFeedIdxKey)
        return .result()
    }
}

// MARK: - Önceki feed öğesi

struct PrevItemIntent: AppIntent {
    static var title: LocalizedStringResource = "Previous"
    static var description = IntentDescription("Show previous content item.")

    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: kAppGroup) else { return .result() }
        let data    = HudaWidgetData.load()
        let count   = max(1, data.feedItems.count)
        let current = defaults.integer(forKey: kFeedIdxKey)
        defaults.set((current - 1 + count) % count, forKey: kFeedIdxKey)
        return .result()
    }
}

// MARK: - Dhikr çek → sayacı artır, hedefte tur tamamla, döngüye devam

struct DhikrTapIntent: AppIntent {
    static var title: LocalizedStringResource = "Count Dhikr"
    static var description = IntentDescription("Count one dhikr.")

    func perform() async throws -> some IntentResult {
        DhikrState.increment()
        return .result()
    }
}

struct DhikrResetIntent: AppIntent {
    static var title: LocalizedStringResource = "Reset Dhikr"
    static var description = IntentDescription("Reset the current dhikr round.")

    func perform() async throws -> some IntentResult {
        DhikrState.reset()
        return .result()
    }
}

// MARK: - Beğen (❤️) → UserDefaults'a yaz, uygulama açılınca okur

struct LikeItemIntent: AppIntent {
    static var title: LocalizedStringResource = "Like"
    static var description = IntentDescription("Save this content item.")

    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: kAppGroup) else { return .result() }
        let data = HudaWidgetData.load()
        let item = data.currentFeedItem()
        var liked = defaults.stringArray(forKey: kLikedKey) ?? []
        if !liked.contains(item.id) { liked.append(item.id) }
        defaults.set(liked, forKey: kLikedKey)
        return .result()
    }
}
