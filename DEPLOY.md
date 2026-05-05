# CineMatch — Render Deployment Guide

## Why separate services?
The **backend** (Flask/Python) runs as a **Web Service**.  
The **frontend** (React/Vite) deploys as a **Static Site**.  
Vite bakes the backend URL into the JS bundle at build time via `VITE_API_URL`.

---

## Step-by-step

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cinematch.git
git push -u origin main
```

### 2. Deploy the Backend first

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --workers 2 --bind 0.0.0.0:$PORT --timeout 120`
4. Click **Create Web Service**
5. Wait for it to deploy. Copy the URL — it looks like:
   ```
   https://cinematch-api.onrender.com
   ```

### 3. Deploy the Frontend

1. Go to **New** → **Static Site**
2. Connect the same repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add an **Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://YOUR-BACKEND-URL.onrender.com/api`  ← use the URL from step 2
5. Click **Create Static Site**

> ⚠️ **The env var must be set BEFORE the first build.** Vite bakes it into
> the JS at build time — it is NOT read at runtime. If you set it after
> deploying, trigger a **Manual Deploy** from the Render dashboard.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| API calls fail with CORS error | Backend URL wrong in `VITE_API_URL` | Update the env var, redeploy frontend |
| `VITE_API_URL` shows as `undefined` | Env var set after build | Trigger Manual Deploy on frontend |
| 404 on page refresh | SPA routing not configured | `public/_redirects` file handles this — already included |
| Backend takes 30 s to respond | Free tier spin-down | Normal on free plan; upgrade to Starter ($7/mo) to stay always-on |
| `students.csv` data lost on redeploy | Ephemeral filesystem | Free tier limitation; upgrade and add a Persistent Disk |

---

## Blueprint deploy (alternative)

If you prefer one-click:
1. **New** → **Blueprint**
2. Connect repo — Render reads `render.yaml` and creates both services automatically
3. After deploy, update `VITE_API_URL` in the frontend service env vars to match
   the actual backend URL Render assigned, then **Manual Deploy** the frontend

