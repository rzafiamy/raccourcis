# Raccourcis — Release Notes

## v1.0.0 — 2026-04-12

### Rename
- Application renamed from **Raccourci** to **Raccourcis**.

### New Service Actions

Eight new action types are now available in the workflow editor under the **Services** palette group:

| Action | Description |
|---|---|
| **Firecrawl Scrape** | Scrape any URL and return clean Markdown via the Firecrawl API |
| **Google Search** | Query Google Custom Search API and return ranked results with URLs |
| **YouTube Search** | Search YouTube Data API v3 and return video titles and links |
| **Wikipedia Search** | Fetch article summaries from the Wikipedia REST API (no key required) |
| **List Calendar Events** | Pull upcoming events from Google Calendar via OAuth token |
| **Send Gmail** | Send an email through the Gmail API via OAuth token |
| **Get Weather** | Fetch current weather conditions from OpenWeatherMap |
| **Send SMTP Email** | Send email via any custom SMTP server (delegated to Electron main process) |

### Settings

The Settings modal has been expanded with dedicated sections for every new service:

- **AI Provider** — base URL, API key, model (unchanged)
- **Firecrawl** — API key + optional self-hosted base URL
- **Google Custom Search** — API key + CSE ID (cx)
- **YouTube Data API** — API key (shared with or separate from Google)
- **Google Calendar** — OAuth 2.0 Bearer token (calendar.readonly scope)
- **Gmail** — OAuth 2.0 Bearer token (gmail.send scope)
- **OpenWeatherMap** — API key
- **SMTP** — host, port, TLS toggle, username, password, optional from address

All settings are persisted to `localStorage` and never exported in plaintext.

### Variable Substitution

All new service actions support the standard `{{result}}`, `{{clipboard}}`, and `{{vars.foo}}` interpolation in their configurable fields, making it easy to chain them after other steps.
