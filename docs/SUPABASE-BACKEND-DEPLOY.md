# Step-by-step: Deploy the backend on Supabase

This guide walks you through deploying the **backend** for Muley SE AI Squid Games on Supabase (database, security, and real-time).

---

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier is enough).
- The project’s `supabase-schema.sql` file (in the repo root).

---

## Step 1: Create a Supabase project

1. Open **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **“New project”**.
3. **Organization:** Choose an existing one or create a new organization.
4. Fill in:
   - **Name:** e.g. `muleyai-squidgames`.
   - **Database password:** Create a strong password and **save it** (e.g. in a password manager). You need it for direct database access and recovery.
   - **Region:** Pick a region close to you or your users (e.g. `East US (N. Virginia)`).
5. Click **“Create new project”**.
6. Wait until the project status is **Active** (usually 1–2 minutes).

---

## Step 2: Run the database schema

This creates the tables, constraints, and security rules.

1. In the Supabase dashboard, open your **project**.
2. In the **left sidebar**, click **“SQL Editor”**.
3. Click **“New query”**.
4. Open the file **`supabase-schema.sql`** from this repo and **copy its entire contents**.
5. **Paste** the SQL into the Supabase SQL Editor.
6. Click **“Run”** (or press `Cmd+Enter` / `Ctrl+Enter`).

**Expected result:** A success message. The following are created:

| Item | Purpose |
|------|--------|
| `sessions` | Bi-weekly How We AI sessions and status (lobby, voting, results, completed). |
| `participants` | The 4 players per session (name, topic, image_url, status, vote_count). |
| `votes` | Anonymous votes (one per device per session). |
| RLS policies | Public read on all tables; votes can only be inserted when `sessions.status = 'voting'`. |
| Realtime | `sessions` and `participants` added to the Realtime publication. |

**If you see an error on the Realtime lines** (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`):

1. Go to **Database → Replication** in the left sidebar.
2. Open the **`supabase_realtime`** publication.
3. Click **“Edit”** and add the **`sessions`** and **`participants`** tables to the publication.
4. Save. The rest of the schema (tables and RLS) will already be in place.

---

## Step 3: Confirm tables and RLS

1. In the left sidebar, go to **“Table Editor”**.
2. You should see three tables: **`sessions`**, **`participants`**, **`votes`**.
3. Click **“sessions”** and confirm columns: `id`, `title`, `week_number`, `session_date`, `status`, `created_at`.
4. (Optional) In **Database → Roles**, open **“Policies”** for each table and confirm the policies from the schema are listed.

---

## Step 4: Get your API credentials

The app uses two keys: one public (anon) and one secret (service role).

1. In the left sidebar, click the **gear icon** (**“Project settings”**).
2. Open the **“API”** section.
3. Copy and store these somewhere temporary (you’ll put them in `.env.local` next):

   | Setting | Copy this | Use for |
   |--------|-----------|--------|
   | **Project URL** | `https://xxxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon public** | Long string under “Project API keys” | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role** | Long string under “Project API keys” (click “Reveal”) | `SUPABASE_SERVICE_ROLE_KEY` |

**Important:** The **service_role** key bypasses Row Level Security. Use it only in server-side code (e.g. Next.js API routes). Never expose it in the browser or commit it to git.

---

## Step 5: Configure the app with Supabase

1. In your project root, create or edit **`.env.local`** (copy from `.env.local.example` if it exists):

   ```bash
   cp .env.local.example .env.local
   ```

2. Open **`.env.local`** and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   ADMIN_PASSWORD=your-secure-admin-password
   ADMIN_TOKEN=generate-a-long-random-string
   ```

   Replace:

   - `YOUR_PROJECT_REF` with the ID from your Project URL (e.g. `abcdefghijklmnop`).
   - The two keys with the **anon** and **service_role** values from Step 4.
   - `ADMIN_PASSWORD` with the password you’ll use to log in at `/host`.
   - `ADMIN_TOKEN` with a long random string (e.g. run `openssl rand -hex 24` in a terminal).

3. Save the file. **Do not commit `.env.local`** (it should be in `.gitignore`).

---

## Step 6: Verify the backend

1. From the project root, run:

   ```bash
   npm install
   npm run dev
   ```

2. Open **http://localhost:3000** in your browser.

3. **Test admin (writes to Supabase):**
   - Go to **http://localhost:3000/host**.
   - Log in with your `ADMIN_PASSWORD`.
   - Create a session and add at least one participant.
   - In Supabase **Table Editor**, open **`sessions`** and **`participants`** and confirm new rows appear.

4. **Test voting (Realtime + RLS):**
   - Open the voting link for that session: **http://localhost:3000/vote/[session-id]** (copy the session ID from the host dashboard or from the `sessions` table).
   - In the host dashboard, set the session status to **“Open voting”**.
   - On the voting page, cast a vote.
   - In Supabase **Table Editor**, open **`votes`** and confirm a new row. In **`participants`**, confirm `vote_count` updates after you run “Close & reveal” (the app updates counts when moving to results).

If all of that works, your **backend is deployed and wired to the app**.

---

## Optional: Storage for participant images

The app currently uses **image URLs** for participants. If you want to **upload** images to Supabase instead:

1. In Supabase, go to **Storage** in the left sidebar.
2. Click **“New bucket”**.
3. Name it e.g. **`participant-images`**.
4. Choose **Public** if you want images to be viewable without signed URLs.
5. Create the bucket.
6. Under **Policies**, add a policy that allows:
   - **Insert** and **Update** for authenticated users (or use the service role from your API route), and
   - **Select** for everyone (if the bucket is public).

Then you’d add an API route (or use the Supabase client) to upload files to this bucket and save the returned public URL in `participants.image_url`. The schema already has `image_url`; no migration needed.

---

## Checklist

- [ ] **Step 1:** Supabase project created and active.
- [ ] **Step 2:** `supabase-schema.sql` run in SQL Editor (tables, RLS, Realtime).
- [ ] **Step 3:** Tables visible in Table Editor; policies present.
- [ ] **Step 4:** Project URL, anon key, and service_role key copied.
- [ ] **Step 5:** `.env.local` updated and saved (not committed).
- [ ] **Step 6:** App runs; host can create sessions/participants; votes appear when voting is open.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “relation already exists” | Tables were created before. Either drop them (Database → Tables → Delete) and run the schema again, or skip the `CREATE TABLE` lines and run only the RLS and policy parts. |
| Realtime not updating UI | Ensure `sessions` and `participants` are in the **Replication** publication. Restart the app and refresh the voting page. |
| 401 on API routes | `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_TOKEN` wrong or missing in `.env.local`. Check cookie for `/host` (e.g. `admin_token`). |
| Votes not inserted | Session must be in **voting** status. Check `sessions.status` in Table Editor. Ensure RLS policy “Insert votes only during voting phase” exists on `votes`. |

For more on the app flow, see the main **SETUP.md** in the repo root.
