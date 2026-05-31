import WidgetKit
import SwiftUI

@main
struct NoorWidgetBundle: WidgetBundle {
    var body: some Widget {
        NoorWidget()
    }
}

struct NoorWidget: Widget {
    let kind: String = "NoorWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: NoorConfigIntent.self,
            provider: NoorProvider()
        ) { entry in
            NoorWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Noor")
        .description("Daily prayer times, verse of the day, and your streak.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryInline,
            .accessoryCircular,
            .accessoryRectangular,
        ])
    }
}
