import UIKit

/// Everything that makes this iPhone app Spotify.
enum Site {
    static let name = "Ranch Spotify"
    static let home = URL(string: "https://open.spotify.com/")!
    static let urlScheme = "ranchsp"
    static let repo = "KingCreeper531/spotify-desktop"
    static let background = UIColor(red: 0x12 / 255.0, green: 0x12 / 255.0, blue: 0x12 / 255.0, alpha: 1)
    /// Spotify's phone website only plays previews, so ask for the desktop site
    /// (the same as Safari's "Request Desktop Website").
    static let desktopSite = true
    static let userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
    // facebook.com and apple.com are for "Continue with Facebook / Apple"
    static let hosts = ["spotify.com", "scdn.co", "spotifycdn.com", "facebook.com", "apple.com"]

    static func isRedirect(_ url: URL) -> Bool { false }

    /// Links without Spotify's share-tracking code (?si=…).
    static func cleanOutbound(_ url: URL) -> URL {
        guard var c = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return url }
        c.queryItems = c.queryItems?.filter { !["si", "utm_source", "utm_medium", "utm_campaign", "nd", "context", "fbclid"].contains($0.name) }
        if c.queryItems?.isEmpty == true { c.queryItems = nil }
        return c.url ?? url
    }
}
