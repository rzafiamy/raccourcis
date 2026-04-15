# Raccourcis — Changelogs

## v1.5.0 — 2026-04-15
### 🤖 Agentic Chat
- **Conversation-driven automation**: A new **Agentic Chat** view in the Management sidebar lets you describe tasks in plain language (text or voice) — the AI automatically discovers and runs the right shortcut(s).
- **Smart Dispatcher**: The LLM receives a live catalog of all your shortcuts and decides whether to run one, chain multiple, or just answer conversationally.
- **Voice Input**: Click 🎤 to record audio; Whisper transcribes it automatically and feeds the result into the chat dispatcher.
- **Human-in-the-loop via Chat**: When a shortcut needs user input (e.g., email topic, file path), instead of a modal dialog the question appears as a chat bubble — you reply directly in the chat box.
- **Multi-shortcut chaining**: Ask complex tasks like "summarize and translate" and the AI runs both shortcuts in sequence.
- **Suggestion Chips**: Quick-start prompts on the welcome screen help new users discover the feature.
- **Non-invasive**: Manual grid-click runs are completely unaffected — the chat is additive, not a replacement.

---

## v1.4.0 — 2026-04-15
### 🚀 New Features
- **UI/UX Revolution**: 
  - Migrated to a sleek Light Mode theme with **Plus Jakarta Sans** typography.
  - Interactive **Visual Step Connectors** with output type badges for clearer workflow logic.
  - New **Icon Selection Modal** for easier shortcut customization.
  - Built-in **Toast Notifications** for real-time operation feedback.
- **Workflow Engine Upgrades**:
  - Refactored scheduling system to use trigger-based workflow steps with disk persistence.
  - Expanded **Variable Token Support**: Now supports spaces, dots, and hyphens in variable names.
  - Increased run history limit with new "Copy to Clipboard" functionality for action inputs/outputs.
- **New Shortcut Collections**:
  - **Freelancer Life**: Dedicated workflows for development, productivity, and financial management.
  - **AI Content Studio**: Specialized AI shortcuts for Slack/Email replies, tone adjustments, and content creation.
  - **Dev & Admin Toolkit**: Advanced actions for system management, debugging, and code refactoring.
  - **Content Creator Hub**: New tools tailored for YouTubers and audience engagement.

### 🛠️ Improvements & Fixes
- Improved variable regex detection for complex naming schemes.
- Enhanced reliability of cron-to-trigger migration and history persistence.

---

## v1.3.0 — 2026-04-13
### 🚀 New Features
- **Multimedia Automation**: 
  - Audio extraction from video.
  - MP3 metadata tagging and artwork merging.
  - Image compression and format conversion via `mogrify`.
- **Tondro File Sharing**: Integrated Supabase-backed file sharing with password protection and auto-expiration options.
- **Data Visualization**: Native "Plot Chart" action using Chart.js for rendering dynamic graphs from JSON data.
- **Social Media Hub**: Collection of 20+ new automation shortcuts for content creation and trend analysis.
- **Enhanced Formatting**: Added support for Markdown tables in the output renderer.

### 🛠️ Improvements & Fixes
- **URL Processing**: Added `url-encode` and `url-decode` utility actions.
- **Fuel Price Intelligence**: Implemented French government open data integration for real-time fuel price monitoring.

---

## v1.2.0 — 2026-04-12
### 🚀 New Features
- **Traces Execution Logs**: Human-readable history of executed shortcuts with step-by-step inputs, outputs, and durations.
- **Help Center**: Comprehensive in-app documentation covering Concepts, Actions, and Automation guides.
- **System Dashboard**: Real-time monitoring of host stats (CPU, RAM) and usage analytics.
- **Cron Scheduling**: Native support for scheduled task management via `node-cron`.
- **New Workflow Actions**:
  - Image EXIF metadata removal.
  - Image transformation for watermark stripping.
  - "Clean Downloads" utility for automated file organization.

### 🛠️ Improvements & Fixes
- **ES Module Support**: Fixed `__dirname` errors by migrating to `import.meta.url`.
- **Window Controls**: Improved reliability of minimize, maximize, and close buttons on Linux.
- **SMTP Reliability**: Enhanced error handling for custom email server communication.
- **UI/UX Refinements**: Polished glassmorphic theme and improved settings modal layout.

---

## v1.1.0 — 2026-04-12
### 🚀 New Features
- **Dual-Channel Debugging**: Logs are now mirrored to both the browser console and the system terminal.
- **Request/Response Inspection**: A new `Debug Mode` in settings for full JSON payload inspection.
- **Native File Picker**: Native system file picker for image-based shortcuts.

### 🧠 Local AI & Vision Optimizations
- **Client-Side Image Resizing**: Automatic resizing of images to prevent memory errors on local inference servers.
- **Multimodal Streamlining**: Refactored Vision payloads for maximum compatibility with local LLaVA models.
- **Model Synchronization**: Vision tasks now follow primary AI model settings by default.

### 🛠️ Internal Improvements
- **Standardized Endpoints**: Restored full compatibility with OpenAI-standard providers.
- **Improved Reliability**: Added binary data handling and fail-safe fallbacks for image processing.

---

## v1.0.0 — 2026-04-12
### 📝 Initial Release
- **Rename**: Application renamed from **Raccourci** to **Raccourcis**.
- **Services Palette**: Eight new action types (Firecrawl, Google Search, YouTube Search, Wikipedia, Calendar, Gmail, Weather, SMTP).
- **Expanded Settings**: Dedicated sections for cloud and local services.
- **Variable Substitution**: Dynamic interpolation support (`{{result}}`, `{{clipboard}}`, `{{vars.foo}}`) across all actions.
