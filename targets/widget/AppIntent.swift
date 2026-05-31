import WidgetKit
import AppIntents

// MARK: - Widget içerik tipi (kullanıcı widget'a uzun basıp "Edit" ile seçer)

enum WidgetContent: String, AppEnum {
    case auto
    case prayer
    case verse
    case streak

    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        "Widget Content"
    }

    static var caseDisplayRepresentations: [WidgetContent: DisplayRepresentation] {
        [
            .auto: DisplayRepresentation(title: "Smart (Prayer + Verse)"),
            .prayer: DisplayRepresentation(title: "Prayer Times"),
            .verse: DisplayRepresentation(title: "Verse of the Day"),
            .streak: DisplayRepresentation(title: "Streak"),
        ]
    }
}

struct NoorConfigIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Noor Widget"
    static var description = IntentDescription("Choose what this widget shows.")

    @Parameter(title: "Show", default: .auto)
    var content: WidgetContent
}
