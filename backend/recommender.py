import numpy as np
import pandas as pd
import os

# ─── Load movie metadata from CSV ───────────────────────────────────────────
_CSV_PATH = os.path.join(os.path.dirname(__file__), "movies.csv")
MOVIES_DF = pd.read_csv(_CSV_PATH)

# Build lookup dicts from CSV
GENRES = {
    row["title"]: [g.strip() for g in str(row["genres"]).split(",")]
    for _, row in MOVIES_DF.iterrows()
}
YEAR_DATA = {row["title"]: int(row["year"]) for _, row in MOVIES_DF.iterrows()}
POSTER_URLS = {row["title"]: row["poster_url"] for _, row in MOVIES_DF.iterrows()}
BACKDROP_URLS = {row["title"]: row.get("backdrop_url", "") for _, row in MOVIES_DF.iterrows()}
MOVIES = MOVIES_DF["title"].tolist()

# ─── Ratings matrix ─────────────────────────────────────────────────────────
RATINGS_DATA = {
    "Alice":  [5, 4, 5, 4, 0, 0, 4, 5, 2, 0, 4, 0, 0, 5, 5, 5, 0, 5],
    "Bob":    [4, 5, 4, 5, 0, 3, 0, 4, 5, 5, 0, 0, 5, 0, 4, 0, 2, 0],
    "Carol":  [0, 2, 4, 0, 5, 5, 5, 0, 0, 0, 5, 5, 0, 4, 0, 3, 5, 4],
    "Dave":   [5, 5, 5, 5, 0, 0, 0, 5, 0, 2, 0, 0, 4, 5, 5, 5, 0, 5],
    "Eve":    [0, 3, 0, 2, 5, 5, 4, 0, 4, 4, 4, 5, 0, 0, 0, 2, 5, 0],
    "Frank":  [4, 4, 0, 4, 0, 0, 0, 3, 5, 5, 0, 2, 5, 0, 0, 3, 0, 2],
    "Grace":  [0, 2, 4, 3, 4, 4, 5, 4, 0, 0, 5, 5, 0, 4, 4, 0, 4, 5],
    "Henry":  [5, 4, 5, 4, 0, 0, 4, 5, 0, 2, 4, 0, 0, 5, 5, 5, 0, 0],
    "Isla":   [0, 0, 0, 1, 5, 5, 0, 0, 4, 5, 0, 4, 4, 0, 0, 0, 5, 2],
    "Jake":   [4, 5, 0, 5, 0, 2, 0, 4, 5, 4, 0, 0, 5, 0, 4, 4, 0, 3],
    "Karen":  [0, 3, 5, 0, 4, 0, 5, 4, 0, 0, 5, 4, 0, 4, 5, 4, 4, 5],
    "Liam":   [5, 5, 4, 5, 0, 0, 0, 0, 5, 5, 0, 0, 5, 0, 4, 4, 0, 0],
    "Maya":   [0, 0, 3, 0, 5, 5, 4, 2, 0, 3, 5, 5, 0, 4, 0, 0, 5, 4],
    "Noah":   [4, 0, 5, 4, 0, 2, 4, 5, 0, 0, 4, 4, 0, 5, 5, 5, 0, 5],
    "Olivia": [0, 4, 3, 4, 4, 4, 0, 3, 4, 4, 0, 4, 4, 0, 3, 0, 4, 3],
}

RATINGS_DF = pd.DataFrame(RATINGS_DATA, index=MOVIES).T


# ─── Similarity functions ────────────────────────────────────────────────────

def cosine_similarity(vec_a, vec_b):
    mask = (vec_a != 0) & (vec_b != 0)
    if mask.sum() == 0:
        return 0.0
    a, b = vec_a[mask].astype(float), vec_b[mask].astype(float)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom else 0.0


def pearson_similarity(vec_a, vec_b):
    mask = (vec_a != 0) & (vec_b != 0)
    if mask.sum() < 2:
        return 0.0
    a, b = vec_a[mask].astype(float), vec_b[mask].astype(float)
    ac, bc = a - a.mean(), b - b.mean()
    denom = np.sqrt(np.sum(ac**2) * np.sum(bc**2))
    return float(max(0, np.dot(ac, bc) / denom)) if denom else 0.0


def jaccard_similarity(vec_a, vec_b):
    sa, sb = (vec_a != 0).astype(int), (vec_b != 0).astype(int)
    union = np.sum(sa | sb)
    return float(np.sum(sa & sb) / union) if union else 0.0


# ─── Engine ──────────────────────────────────────────────────────────────────

class CollaborativeFilteringEngine:
    def __init__(self, ratings_df):
        self.ratings = ratings_df.copy()
        self.users = list(ratings_df.index)
        self.items = list(ratings_df.columns)
        self.item_sim_matrix = self._build_item_sim()

    def _build_item_sim(self):
        n = len(self.items)
        mat = np.zeros((n, n))
        for i, a in enumerate(self.items):
            for j, b in enumerate(self.items):
                if i == j:
                    mat[i][j] = 1.0
                elif i < j:
                    s = pearson_similarity(self.ratings[a].values, self.ratings[b].values)
                    mat[i][j] = mat[j][i] = s
        return pd.DataFrame(mat, index=self.items, columns=self.items)

    def _movie_dict(self, movie, extra=None):
        d = {
            "movie": movie,
            "year": YEAR_DATA.get(movie, "N/A"),
            "genres": GENRES.get(movie, []),
            "poster": POSTER_URLS.get(movie, ""),
            "backdrop": BACKDROP_URLS.get(movie, ""),
        }
        if extra:
            d.update(extra)
        return d

    def get_user_similarity(self, u1, u2, method="pearson"):
        v1, v2 = self.ratings.loc[u1].values, self.ratings.loc[u2].values
        fn = {"cosine": cosine_similarity, "pearson": pearson_similarity, "jaccard": jaccard_similarity}
        return fn.get(method, pearson_similarity)(v1, v2)

    def find_similar_users(self, target, n=5, method="pearson"):
        sims = [(u, self.get_user_similarity(target, u, method)) for u in self.users if u != target]
        return sorted(sims, key=lambda x: x[1], reverse=True)[:n]

    def user_based_recommend(self, user, n=5, n_neighbors=5, method="pearson"):
        neighbors = self.find_similar_users(user, n_neighbors, method)
        if not neighbors:
            return []
        unrated = self.ratings.loc[user][self.ratings.loc[user] == 0].index.tolist()
        preds = []
        for movie in unrated:
            ws, ss = 0.0, 0.0
            contribs = []
            for nb, sim in neighbors:
                r = self.ratings.loc[nb, movie]
                if r > 0 and sim > 0:
                    ws += sim * r; ss += sim; contribs.append(nb)
            if ss > 0:
                preds.append(self._movie_dict(movie, {
                    "predicted_rating": round(ws / ss, 2),
                    "confidence": round(ss / max(len(neighbors), 1), 2),
                    "based_on_users": contribs[:3],
                    "algorithm": "User-Based CF"
                }))
        return sorted(preds, key=lambda x: x["predicted_rating"], reverse=True)[:n]

    def item_based_recommend(self, user, n=5):
        ur = self.ratings.loc[user]
        rated = ur[ur > 0]
        unrated = ur[ur == 0].index.tolist()
        if rated.empty:
            return []
        preds = []
        for cm in unrated:
            ws, ss, sims = 0.0, 0.0, []
            for rm, rv in rated.items():
                s = self.item_sim_matrix.loc[cm, rm]
                if s > 0:
                    ws += s * float(rv); ss += s; sims.append((rm, round(s, 2)))
            if ss > 0:
                sims.sort(key=lambda x: x[1], reverse=True)
                preds.append(self._movie_dict(cm, {
                    "predicted_rating": round(ws / ss, 2),
                    "confidence": round(min(ss, 1.0), 2),
                    "similar_to": [m for m, _ in sims[:2]],
                    "algorithm": "Item-Based CF"
                }))
        return sorted(preds, key=lambda x: x["predicted_rating"], reverse=True)[:n]

    def hybrid_recommend(self, user, n=5, user_weight=0.5, method="pearson"):
        ur = self.user_based_recommend(user, n * 2, method=method)
        ir = self.item_based_recommend(user, n * 2)
        us = {r["movie"]: r["predicted_rating"] for r in ur}
        is_ = {r["movie"]: r["predicted_rating"] for r in ir}
        preds = []
        for movie in set(us) | set(is_):
            u, i = us.get(movie, 0), is_.get(movie, 0)
            score = user_weight * u + (1 - user_weight) * i
            if score > 0:
                preds.append(self._movie_dict(movie, {
                    "predicted_rating": round(score, 2),
                    "user_cf_score": round(u, 2),
                    "item_cf_score": round(i, 2),
                    "confidence": round(min((u + i) / 10, 1.0), 2),
                    "algorithm": "Hybrid CF"
                }))
        return sorted(preds, key=lambda x: x["predicted_rating"], reverse=True)[:n]

    def cold_start_recommend(self, n=5):
        stats = []
        for movie in self.items:
            ms = self.get_movie_stats(movie)
            score = (ms["avg_rating"] * 0.6) + (ms["popularity_pct"] / 100 * 4 * 0.4)
            stats.append({**ms, "predicted_rating": round(score, 2), "algorithm": "Popularity-Based (Cold Start)"})
        return sorted(stats, key=lambda x: x["predicted_rating"], reverse=True)[:n]

    def get_movie_stats(self, movie):
        col = self.ratings[movie]
        rated = col[col > 0]
        return self._movie_dict(movie, {
            "avg_rating": round(float(rated.mean()), 2) if len(rated) > 0 else 0,
            "num_ratings": int(len(rated)),
            "popularity_pct": round(len(rated) / len(self.users) * 100),
        })

    def get_system_stats(self):
        rated_count = int((self.ratings > 0).sum().sum())
        total = len(self.users) * len(self.items)
        return {
            "total_users": len(self.users),
            "total_items": len(self.items),
            "total_ratings": rated_count,
            "sparsity": round((1 - rated_count / total) * 100, 1),
            "avg_rating": round(float(self.ratings[self.ratings > 0].stack().mean()), 2),
            "users": self.users,
            "items": self.items
        }


engine = CollaborativeFilteringEngine(RATINGS_DF)
