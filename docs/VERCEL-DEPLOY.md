# Deploy to Vercel and connect Supabase

This guide covers deploying Muley SE AI Squid Games to **Vercel** and connecting it to your **Supabase** backend.

---

## Prerequisites

- Backend already set up on Supabase (see [SUPABASE-BACKEND-DEPLOY.md](./SUPABASE-BACKEND-DEPLOY.md)).
- Your Supabase **Project URL**, **anon** key, and **service_role** key.
- Your app’s **ADMIN_PASSWORD** and **ADMIN_TOKEN** (from `.env.local` or [supabase-credentials.md](./supabase-credentials.md) for the DB password only).

---

## Step 1: Push your code to GitHub

1. Ensure all changes are committed and pushed to your GitHub repo (e.g. `https://github.com/valesit/muleyai-squidgames`).
2. Vercel will deploy from this repo.

---

## Step 2: Import the project in Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (use “Continue with GitHub” if the repo is on GitHub).
2. Click **“Add New…”** → **“Project”**.
3. **Import** your repository (`valesit/muleyai-squidgames` or your repo name).
4. Leave **Framework Preset** as **Next.js** (Vercel should detect it).
5. **Root Directory:** leave as `.` (repo root).
6. Do **not** deploy yet—add environment variables first.

---

## Step 3: Connect Vercel to Supabase (environment variables)

Add the same variables you use in `.env.local` so the app can talk to Supabase and auth works.

1. In the Vercel project import screen, open **“Environment Variables”** (or after creating the project, go to **Settings → Environment Variables**).
2. Add each variable below. For **Environment**, select **Production** (and optionally **Preview** if you want them for PR previews).

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` | From Supabase: Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | From Supabase: Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | From Supabase: Project Settings → API → service_role (Reveal) |
| `ADMIN_PASSWORD` | Your host dashboard login password | Same as in `.env.local` |
| `ADMIN_TOKEN` | Your long random cookie token | Same as in `.env.local` (e.g. from `openssl rand -hex 24`) |

Optional (only if you use it in code):

| Name | Value |
|------|--------|
| `SUPABASE_DATABASE_PASSWORD` | Your Supabase database password (e.g. from [supabase-credentials.md](./supabase-credentials.md)) |

3. Click **Save** for each variable (or **Save All**).
4. **Important:** Every variable the app reads at runtime must be set here; there is no `.env.local` on Vercel.

---

## Step 4: Deploy

1. Click **“Deploy”** (or, if you already deployed once, push a new commit or use **Deployments → Redeploy**).
2. Wait for the build to finish. Fix any build errors (e.g. missing env vars) in the Vercel build logs.
3. When the deployment is ready, open the **Production URL** (e.g. `https://muleyai-squidgames.vercel.app`).

---

## Step 5: Verify Supabase is connected

1. Open your Vercel deployment URL.
2. Go to **`/host`** and log in with `ADMIN_PASSWORD`.
3. Create a session and add participants. In Supabase **Table Editor**, confirm new rows in **sessions** and **participants**.
4. Open the voting link for that session, set the session to “Open voting” in the host dashboard, and cast a vote. In Supabase **votes** table, confirm a new row.

If all of that works, Vercel is correctly connected to Supabase.

---

## Checklist

- [ ] Repo pushed to GitHub.
- [ ] Project imported in Vercel (Next.js).
- [ ] All env vars set in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`.
- [ ] Deploy succeeded.
- [ ] Host login and Supabase reads/writes work on the live URL.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Build fails | Check Vercel build logs. Ensure no env vars are missing (e.g. `NEXT_PUBLIC_SUPABASE_URL`). |
| 401 on `/host` or API | `ADMIN_PASSWORD` or `ADMIN_TOKEN` wrong or not set in Vercel. Re-add them and redeploy. |
| Can’t fetch sessions / votes | `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` wrong or not set. Confirm in Supabase Project Settings → API. |
| Realtime not updating | Same as above; also ensure Realtime is enabled for `sessions` and `participants` in Supabase (Database → Replication). |

For Supabase setup only, see [SUPABASE-BACKEND-DEPLOY.md](./SUPABASE-BACKEND-DEPLOY.md).
