# Mesa 🍽️
### Real-time captions + translation for every dinner table

**Mesa** listens to everyone in a room, auto-detects their language, translates everything into your chosen language, and displays it in large, high-contrast text — so deaf, hard-of-hearing, and non-English-speaking family members can follow along in real time.

Built in one morning for my 97-year-old deaf, native spanish speaking, grandmother, after her hearing aid broke in half! Works for anyone.

👉 **[Try it live →](https://franarchila.github.io/Mesa)**

---

## Who it's for

- Elderly family members who are deaf or hard of hearing
- Multilingual households where not everyone shares a language
- Deaf and HoH individuals in group settings
- Anyone who gets left out of conversation

---

## Features

- 🎙️ **Continuous listening** — no push-to-talk, just ambient audio
- 🌍 **Auto language detection** — handles English, Spanish, French, and 10+ more
- ⚡ **Real-time translation** — powered by Google Cloud Translation API
- 👵 **Abuela Mode** — full-screen, giant text only, zero distractions
- 🎨 **Speaker labels** — each person gets a color (tap to rename: "Dad", "Tía Rosa")
- 🔵 **Bluetooth mic support** — participants can wear their own mics
- 📱 **iPad-optimized** — works in Chrome on iPad, bookmarkable as a home screen app
- 🔒 **No login, no account, no data stored**

---

## Quick start (use the hosted version)

1. Open **[franarchila.github.io/Mesa](https://franarchila.github.io/Mesa)** in Chrome on your iPad
2. Select the language to display captions in (default: Spanish)
3. Choose how many people are at the table
4. Tap **Start Listening**
5. Talk — captions appear in real time

---

## How it works

```
iPad (Chrome)
    ↓  Web Speech API — transcribes speech in real time
    ↓  
Proxy Server (Railway)
    ↓  Forwards translation requests with hidden API key
    ↓  
Google Cloud Translation API
    ↓  
Captions displayed in your chosen language
```

The API key is never stored in the frontend code — it lives only as an environment variable on the proxy server. Safe to open source. ✅

---

## Deploy your own

### What you need
- A [Google Cloud account](https://console.cloud.google.com) (free tier)
- A [GitHub account](https://github.com) (free)
- A [Railway account](https://railway.app) (~$5/month) or [Render account](https://render.com) (free with limitations)

### Step 1 — Get a Google Translate API key
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable **Cloud Translation API**
3. Go to Credentials → **Create API Key**
4. Restrict it to Cloud Translation API only (recommended)

### Step 2 — Deploy the proxy server
1. Fork the [mesa-proxy repo](https://github.com/franarchila/mesa-proxy)
2. Deploy to Railway or Render:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
3. Add environment variable: `GOOGLE_API_KEY` = your key from Step 1
4. Copy your proxy URL (e.g. `https://mesa-proxy-production.up.railway.app`)

### Step 3 — Deploy the frontend
1. Fork this repo
2. Open `index.html` and update line 3:
   ```javascript
   const PROXY_URL = 'https://your-proxy-url.up.railway.app';
   ```
3. Go to repo **Settings → Pages → Branch: main → Save**
4. Your app is live at `https://[yourusername].github.io/Mesa`

**⚠️ Never paste your API key directly into index.html** — it will be publicly visible and GitHub will flag it immediately.

---

## Roadmap

- [ ] **Whisper backend** — better accuracy in noisy rooms with overlapping voices
- [ ] **Real speaker diarization** — know who's actually talking, not just rotate by pause
- [ ] **PWA / offline mode** — works without internet
- [ ] **Persistent settings** — font size and language saved between sessions
- [ ] **Multi-device sync** — multiple iPads at large tables
- [ ] **Custom domain** — mesacaptions.com

---

## Tech stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Vanilla HTML/CSS/JS | Free |
| Transcription | Web Speech API (Chrome built-in) | Free |
| Hosting | GitHub Pages | Free forever |
| Proxy server | Node.js + Express on Railway | ~$5/month |
| Translation | Google Cloud Translation API v2 | Free up to 500k chars/mo |

---

## Contributing

PRs welcome! Please open an issue first to discuss what you'd like to change.

Areas where help is especially appreciated:
- Whisper/AssemblyAI backend integration for better accuracy
- Better language detection heuristics for Latin-script languages
- Accessibility improvements (always more to do)
- Testing on Android / browsers other than Chrome
- PWA / offline support

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

*Built by [Fran Archila](https://github.com/franarchila) · [@ai.wayswithfran](https://tiktok.com/@ai.wayswithfran)*  
*Started as a gift for a 97-year-old grandmother. Built for everyone.*
