# Productivity Dashboard

A full-featured productivity dashboard built with React — combining a weekly calendar synced with Google Calendar, daily to-do lists, an embedded AI assistant (Claude, GPT, or Gemini), quick notes, and live weather — all in a sleek dark interface.

**Live Demo:** [my-dashboard-eta-silk.vercel.app](https://my-dashboard-eta-silk.vercel.app/)

---

## Features

**Weekly Calendar + Google Calendar Sync** — View your week at a glance with events pulled directly from Google Calendar via OAuth 2.0. Add local events alongside synced ones. Navigate between weeks seamlessly.

**Daily To-Do Lists** — Each day of the week has its own task column. Add, complete, and remove tasks with persistent local storage. Track weekly completion progress at a glance.

**AI Assistant** — Built-in chat panel with multi-provider support. Connect Claude (Anthropic), GPT (OpenAI), or Gemini (Google) with your own API key. Conversations persist across sessions. Keys are stored locally and never touch a server.

**Quick Notes** — Compact notepad for capturing ideas on the fly. Notes persist across sessions with one-click delete.

**Live Weather** — Real-time weather data via the Open-Meteo API with current temperature, daily high/low, wind speed, and conditions — no API key required.

---

## Tech Stack

- **Frontend:** React 18, Vite
- **APIs:** Google Calendar API (OAuth 2.0), Open-Meteo Weather API, Anthropic Messages API, OpenAI Chat Completions API, Google Gemini API
- **Auth:** Google Identity Services (GIS) for OAuth token flow
- **Storage:** Browser localStorage for persistent todos, events, notes, chat history, and API keys
- **Deployment:** Vercel
- **Design:** Custom dark theme with earthy brown, warm white, and light blue accents — Times New Roman typography

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud project with Calendar API enabled (for Google Calendar sync)
- An API key from Anthropic, OpenAI, or Google AI Studio (for the AI assistant)

### Install & Run

```bash
git clone https://github.com/caseyoak12-prog/my-dashboard.git
cd my-dashboard
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Google Calendar Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project and enable the **Google Calendar API**
3. Create an **OAuth 2.0 Client ID** (Web application type)
4. Add `http://localhost:5173` (and your production URL) to **Authorized JavaScript Origins**
5. Add yourself as a **Test User** under the OAuth consent screen
6. Click **Connect** in the dashboard and paste your Client ID

### AI Assistant Setup

1. Click the **Key** button on the AI chat panel
2. Choose your provider (Claude, GPT, or Gemini)
3. Paste your API key — it's stored locally in your browser only

---

## Deployment

This project deploys instantly on Vercel:

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Deploy — Vercel auto-detects Vite and handles the rest

After deploying, add your Vercel URL to your Google Cloud OAuth client's Authorized JavaScript Origins.

---

## Architecture Decisions

- **No backend** — All API calls are made directly from the browser. API keys are stored in localStorage and sent only to their respective provider endpoints.
- **Multi-provider AI** — The chat panel abstracts away provider differences, supporting Anthropic's Messages API, OpenAI's Chat Completions API, and Google's Gemini API through a unified interface.
- **OAuth token flow** — Uses Google Identity Services implicit token flow for calendar access. Tokens are stored locally and automatically cleared on sign-out or expiry.
- **Zero dependencies beyond React** — No UI frameworks, CSS libraries, or state management libraries. All styling is inline. All icons are inline SVGs.

---

## License

MIT
