# Raccourcis — Changelogs

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
