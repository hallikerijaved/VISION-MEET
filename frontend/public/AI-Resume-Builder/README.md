# ✦ AI Resume Builder

A fully responsive, browser-based resume builder powered by **Google Gemini AI**. No backend, no installation — just open `index.html` and start building.

---

## 🚀 Features

- **AI-Powered Content** — Generate professional summaries, suggest skills, and enhance job descriptions using Gemini AI
- **4 Resume Templates** — Classic, Modern, Minimal, Creative
- **8 Accent Colors** — Fully customizable color themes
- **Live Preview** — See changes instantly as you type
- **Export to PDF** — Download a high-quality PDF resume with one click
- **Fully Responsive** — Works on desktop, tablet, and mobile
- **No Backend Required** — Runs entirely in the browser

---

## 📁 Project Structure

```
aiii/
├── index.html          ← Main entry point (open this in browser)
├── css/
│   └── style.css       ← All styles, responsive layout, resume templates
└── js/
    ├── app.js          ← State management, UI logic, tabs, skills, experience
    ├── templates.js    ← 4 resume template renderers
    ├── ai.js           ← Gemini AI integration + local fallback generator
    └── pdf.js          ← PDF export logic (html2pdf.js)
```

---

## 🛠️ How to Use

1. **Open** `index.html` in any modern browser
2. Fill in your details in the **Info** tab
3. Add work experience and education in the **Experience** tab
4. Choose a template and accent color in the **Design** tab
5. Click **⬇ Export PDF** to download your resume

---

## 🤖 AI Features

All AI buttons work **without an API key** using a smart local generator.

For real Gemini AI responses, the key is configured in `js/ai.js`:

```js
const GEMINI_API_KEY = 'your-key-here';
```

### Get a free Gemini API key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the `AIza...` key and paste it in `js/ai.js`

### AI Buttons
| Button | What it does |
|--------|-------------|
| ✦ Generate Summary with AI | Writes a 3-sentence professional summary |
| ✦ Suggest Skills with AI | Suggests 8 relevant skills for your role |
| ✦ Enhance with AI | Rewrites job description with strong action verbs |

---

## 🎨 Templates

| Template | Style |
|----------|-------|
| **Classic** | Traditional serif, centered header, timeless look |
| **Modern** | Dark sidebar, skill bars, two-column layout |
| **Minimal** | Clean, whitespace-heavy, ultra-modern |
| **Creative** | Gradient header, bold typography, skill bars |

---

## 📄 PDF Export

Click **⬇ Export PDF** in the top-right corner. The PDF is generated using [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) at 2x resolution for crisp quality. The file is named automatically based on your name (e.g. `Jane_Doe_resume.pdf`).

---

## 📱 Responsive Design

| Screen | Behavior |
|--------|----------|
| Desktop (>900px) | Sidebar + preview side by side |
| Tablet / Mobile (≤900px) | Full-screen preview, sidebar slides in via ☰ button |

---

## 🔒 Privacy

- No data is sent to any server (except Gemini API calls if a key is configured)
- No cookies, no tracking, no sign-up required
- Everything runs locally in your browser

---

## 🧰 Tech Stack

- **Vanilla HTML, CSS, JavaScript** — zero dependencies, zero build tools
- **Google Gemini API** — `gemini-2.0-flash` model for AI generation
- **html2pdf.js** — client-side PDF generation
- **Inter font** — via Google Fonts

---

## ⚠️ Security Note

Never commit your API key to a public repository. If you share your key accidentally, revoke it immediately at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and generate a new one.
