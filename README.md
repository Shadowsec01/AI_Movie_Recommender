# CineMatch v2.0 — AI Movie Recommendation System

Built by **Ezaekor Chukwuebuka Emmanuel** · FUTO Cybersecurity Department

---

## What it does

CineMatch uses **Memory-Based Collaborative Filtering** to recommend movies:

- **User-Based CF** — finds users with similar taste and recommends what they liked
- **Item-Based CF** — finds movies similar to what you've already rated highly
- **Hybrid CF** — blends both for best results (default)

Three similarity metrics: Pearson Correlation, Cosine Similarity, Jaccard Index.

---

## Project Structure

```
cinematch/
├── backend/
│   ├── app.py             # Flask REST API
│   ├── recommender.py     # CF engine + similarity math
│   ├── movies.csv         # Movie metadata + TMDB poster URLs
│   ├── students.csv       # Auto-created on first registration
│   └── requirements.txt
├── frontend/
│   ├── src/App.jsx        # React UI
│   ├── index.html
│   └── package.json
├── render.yaml            # Render deployment blueprint
└── README.md
```

---

## movies.csv

Columns: `title, year, genres, tmdb_id, poster_url, backdrop_url`

Poster images are fetched directly from **TMDB's CDN** (`image.tmdb.org`).  
To add more movies: append rows to `movies.csv` and add their ratings to the `RATINGS_DATA` dict in `recommender.py`.

---

## students.csv

Auto-created when the first student registers. Columns:  
`full_name, reg_number, department, registered_at`

Registration numbers are unique — re-entering an existing one returns the existing record (acts as login). On Render's free plan, this file resets on each deploy. Use a persistent disk (paid plan) or swap to a database like SQLite/PostgreSQL for permanence.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/student/register` | Register / return existing student |
| GET  | `/api/student/<reg>` | Fetch student by reg number |
| GET  | `/api/students` | List all students |
| GET  | `/api/stats` | System statistics |
| GET  | `/api/users` | All users + rating counts |
| GET  | `/api/movies` | All movies + avg ratings |
| POST | `/api/recommend` | Get personalized recommendations |
| GET  | `/api/movie/<name>` | Single movie stats |
| POST | `/api/rate` | Submit a rating |
| POST | `/api/similarity` | Compare two users |
| GET  | `/api/health` | Health check |

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# → http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Deploying to Render

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cinematch.git
git push -u origin main
```

2. Go to [render.com](https://render.com) → **New** → **Blueprint** → connect your repo.

3. Render reads `render.yaml` and creates two services automatically:
   - `cinematch-api` (Flask backend)
   - `cinematch-web` (React frontend)

4. After the API deploys, copy its URL (e.g. `https://cinematch-api.onrender.com`).

5. In Render dashboard → `cinematch-web` → **Environment** → set:
   ```
   VITE_API_URL = https://cinematch-api.onrender.com/api
   ```

6. Click **Manual Deploy** on `cinematch-web`.

**Free plan note:** Services spin down after 15 min of inactivity. First cold-start request takes ~30s.

---

## CORS

The backend allows all origins (`"*"`) for development. For production, restrict it in `app.py`:

```python
CORS(app, origins=["https://cinematch-web.onrender.com"])
```
