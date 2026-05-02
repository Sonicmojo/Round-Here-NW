# Round Here NW 🗺

> Your local events guide for NW2 · NW6 · NW10 London

A community events website that automatically pulls listings from Eventbrite and displays them with filtering, search, and a live map.

---

## What's in this folder

| File | What it does |
|------|-------------|
| `round-here-nw.html` | The website — open this in a browser |
| `fetch-events.js` | Script that fetches events from Eventbrite and writes `events.json` |
| `.github/workflows/fetch-events.yml` | GitHub Actions config — runs the script automatically every day |

---

## One-time setup (do this once)

### Step 1 — Install Node.js
If you don't have it already:
1. Go to **https://nodejs.org**
2. Download the **LTS** version and install it
3. To check it worked, open Terminal (Mac) or Command Prompt (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.11.0`

---

### Step 2 — Run the events fetcher locally
1. Open Terminal / Command Prompt
2. Navigate to this folder:
   ```
   cd path/to/round-here-nw
   ```
3. Run the script:
   ```
   EVENTBRITE_TOKEN=A2TCYBCQN4RF5LXDRY node fetch-events.js
   ```
   *(On Windows Command Prompt, use:)*
   ```
   set EVENTBRITE_TOKEN=A2TCYBCQN4RF5LXDRY && node fetch-events.js
   ```
4. You'll see output like:
   ```
   🔍 Round Here NW — Fetching events from Eventbrite...
     Fetching NW6... ✓ 12 events found
     Fetching NW10... ✓ 8 events found
     Fetching NW2... ✓ 6 events found
   ✅ Done! 24 events written to events.json
   ```
5. Open `round-here-nw.html` in your browser — real events will appear!

---

### Step 3 — Put it on GitHub
This stores your code safely and enables the daily auto-refresh.

1. Go to **https://github.com** and create a free account (or sign in)
2. Click the **+** button → **New repository**
3. Name it `round-here-nw`
4. Set it to **Public** (required for free Netlify hosting)
5. Click **Create repository**
6. Follow GitHub's instructions to push your local folder to the repo
   *(GitHub will show you the exact commands to copy-paste)*

---

### Step 4 — Add your Eventbrite token as a GitHub Secret
This keeps your token safe — it won't be visible in your code.

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `EVENTBRITE_TOKEN`
4. Value: `A2TCYBCQN4RF5LXDRY`
5. Click **Add secret**

Then open `fetch-events.js` and remove the fallback token line (line ~15):
```js
// DELETE this line:
const TOKEN = process.env.EVENTBRITE_TOKEN || "A2TCYBCQN4RF5LXDRY";

// REPLACE with:
const TOKEN = process.env.EVENTBRITE_TOKEN;
```

---

### Step 5 — Enable GitHub Actions
1. In your repo, click the **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. To test it immediately: click **"Fetch Events Daily"** → **"Run workflow"**
4. After it runs, check your repo — `events.json` should be updated

From now on it runs automatically every morning at 7am London time.

---

### Step 6 — Deploy to Netlify (free hosting)
1. Go to **https://netlify.com** and create a free account
2. Click **"Add new site" → "Import an existing project"**
3. Choose **GitHub** and select your `round-here-nw` repo
4. Leave all settings as default and click **Deploy**
5. Netlify gives you a URL like `https://round-here-nw.netlify.app`
6. Every time GitHub Actions updates `events.json`, Netlify will auto-redeploy

---

## Daily workflow (automatic after setup)

```
Every day at 7am →
  GitHub Actions runs fetch-events.js →
    Pulls latest events from Eventbrite →
      Writes events.json →
        Commits to GitHub →
          Netlify redeploys →
            Site shows fresh events ✅
```

---

## Customising

**Change the search radius** — in `fetch-events.js`, edit:
```js
const RADIUS = "2km"; // try "3km" or "5km" for more events
```

**Add more sources** — future versions can add Ticketmaster, Dice.fm, council calendars. Ask your developer to extend `fetch-events.js`.

**Update the contact email** — in `round-here-nw.html`, search for `hello@roundherenw.co.uk` and replace it.

---

## Questions?

Email: hello@roundherenw.co.uk
