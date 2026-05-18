# meal-planner

A weekly meal-planner that adapts to whatever cooking equipment you actually have. Pure HTML/CSS/JS, no build step. Static-hosted on GitHub Pages with an optional Cloudflare Worker for AI regenerate.

## What's in this repo

- `index.html` — the entire app. Open it locally with a double-click and it works (library mode).
- `worker.js` — Cloudflare Worker that proxies AI requests to Anthropic. Holds your API key server-side so the public site can't see it.
- `wrangler.toml` — Worker config for one-command deploy.

## Part 1 · Get the site live on GitHub Pages

You'll have a public URL in about 3 minutes.

1. **Create the repo.** On github.com, click **New repository**, name it `meal-planner`, leave it public, and don't add a README (this README is already here).

2. **Push these files.** In a terminal, from this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/meal-planner.git
   git push -u origin main
   ```

3. **Enable Pages.** On the repo page, go to **Settings → Pages**. Under "Build and deployment", set **Source** to `Deploy from a branch`, **Branch** to `main` and folder to `/ (root)`. Save.

4. **Wait ~1 minute**, then visit `https://YOUR-USERNAME.github.io/meal-planner/`. The site is live. Equipment, plan, and shopping check-offs all save to your browser via localStorage.

That's it for the static side. You can use the app fully — generate plans, swap meals, build shopping lists — without doing Part 2. Part 2 only enables the ✨ AI regenerate button.

## Part 2 · Deploy the AI proxy on Cloudflare Workers (optional)

Cloudflare Workers gives you a generous free tier (100k requests/day) and stays free for personal use.

### One-time setup

1. **Sign up for Cloudflare** at https://cloudflare.com (free).

2. **Install Wrangler** (Cloudflare's CLI):
   ```bash
   npm install -g wrangler
   wrangler login
   ```
   A browser will pop up to authenticate.

3. **Get an Anthropic API key.** Go to https://console.anthropic.com → API Keys → Create Key. Copy it (starts with `sk-ant-...`). You'll need a small balance — meal plans cost fractions of a cent each on Haiku.

### Deploy

From this folder:

```bash
# Tell Wrangler your API key (it gets stored encrypted, not in your repo)
wrangler secret put ANTHROPIC_API_KEY
# Paste your sk-ant-... key when prompted

# Deploy
wrangler deploy
```

Wrangler will print a URL like:
```
https://meal-planner-ai.YOUR-CLOUDFLARE-NAME.workers.dev
```

### Connect it to the site

1. Open your live site (`https://YOUR-USERNAME.github.io/meal-planner/`).
2. Open **Kitchen setup & preferences**.
3. Scroll to **AI regenerate (optional)** and paste your worker URL.
4. Click anywhere else to save. Now the ✨ button works.

### Lock down the worker (recommended)

By default the worker accepts requests from any origin. Once your Pages URL is stable, restrict it:

1. Open `wrangler.toml` and uncomment the `[vars]` block, replacing the URL with your actual github.io URL.
2. Run `wrangler deploy` again.

Now only your site can call the worker.

## Updating the site later

Make changes to `index.html`, then:

```bash
git add index.html
git commit -m "Tweak"
git push
```

Pages re-deploys in ~30 seconds.

## Costs

- **GitHub Pages**: free.
- **Cloudflare Workers**: free for the first 100,000 requests/day.
- **Anthropic API**: pay-as-you-go. Each AI regenerate is one Haiku call — typically under $0.01.

## Troubleshooting

**The AI button does nothing.** Open browser DevTools → Console. If you see a CORS error, your worker's `ALLOWED_ORIGIN` is restricting requests; check it matches your Pages URL exactly (no trailing slash). If you see `401`, your `ANTHROPIC_API_KEY` secret is missing or wrong — re-run `wrangler secret put ANTHROPIC_API_KEY`.

**localStorage filled up / weird state.** In DevTools: `localStorage.removeItem('mealplanner_v1')` and reload.

**Want to host the worker somewhere other than Cloudflare?** The same `worker.js` body logic works on Vercel Edge Functions, Deno Deploy, Netlify Functions, or any platform with `fetch`-style request handlers — just adapt the export signature.
