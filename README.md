# DevTab - Developer New Tab Dashboard

A beautiful, minimal new tab Chrome extension for developers. Display your GitHub contributions, use AI-powered search, manage quick links, and track focus time with a built-in Pomodoro timer.

![DevTab Screenshot](screenshots/preview.png)
Webstore link : https://chromewebstore.google.com/detail/devtab-github-contributio/eeonfnhjnijmdocpebaamfpbbdaolfgb

## ✨ Features

### 🎯 Core Features
- **GitHub Contributions Graph** - See your contribution activity with customizable color themes
- **AI-Powered Search** - Quick access to Google, Claude, ChatGPT, and Stack Overflow
- **Pomodoro Timer** - Built-in focus timer with break management (25/5/15 minute cycles)
- **Quick Links** - Customizable shortcuts with auto-fetched website favicons

### 🎨 Customization
- **Dark/Light/System Theme** - Automatic theme switching based on system preference
- **Custom Backgrounds** - Use any image URL with blur and brightness controls
- **Multiple Fonts** - Choose from 6 developer-friendly monospace fonts
- **Graph Themes** - GitHub Green, Teal, Blue, Purple, Pink, Red, Halloween
- **Toggle Sections** - Show/hide Pomodoro timer and Quick Links as needed

### 🔒 Privacy
- All settings stored locally using Chrome's sync storage
- No analytics or tracking
- No data collection
- Only external requests: GitHub chart API and favicon services

## 📦 Installation

### From Chrome Web Store
*(Coming soon)*

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/devtab.git
   ```

2. **Open Chrome Extensions**
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"** and select the cloned folder

5. **Configure** - Click the extension icon or settings gear to set up your GitHub username

## ⚙️ Configuration

### Quick Setup (via Extension Popup)
Click the DevTab icon in your toolbar to:
- Set your GitHub username
- Choose a graph color theme

### Full Settings (via New Tab Page)
Click the gear icon (⚙️) on the new tab page for all options:

| Setting | Description |
|---------|-------------|
| **GitHub Username** | Your GitHub username for the contribution graph |
| **Graph Theme** | Green, Teal, Blue, Purple, Pink, Red, or Halloween |
| **Tab Name** | Customize the name shown in the top-left |
| **Theme** | Dark, Light, or System Default |
| **Font** | JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Space Grotesk, or Inter |
| **Background URL** | Any image URL for the background |
| **Blur** | 0-30px blur effect on background |
| **Brightness** | 0-100% overlay darkness |
| **Clock Format** | 12 or 24 hour display |
| **Show Seconds** | Toggle seconds display |
| **Show Pomodoro** | Toggle Pomodoro timer visibility |
| **Show Quick Links** | Toggle Quick Links visibility |
| **Pomodoro Durations** | Customize focus, break, and long break times |

## 🔗 Quick Links

- **Auto Icons** - Website favicons are automatically fetched
- **Custom Icons** - Optionally provide your own icon URL
- **Easy Management** - Click the edit button or right-click any link to modify

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + K` | Focus search bar |
| `Escape` | Close modals |

## 🛠️ Development

### Project Structure
```
devtab/
├── manifest.json      # Chrome extension manifest
├── newtab.html        # Main new tab page
├── newtab.js          # Main JavaScript logic
├── styles.css         # All styles with theme support
├── popup.html         # Extension popup
├── popup.js           # Popup functionality
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Tech Stack
- Vanilla JavaScript (no frameworks)
- CSS Custom Properties for theming
- Chrome Storage Sync API
- Google Favicon API for quick link icons

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ghchart.rshah.org](https://ghchart.rshah.org/) for the GitHub contribution chart API
- Google Favicon API for quick link icons

---

**Made with ❤️ for developers**
