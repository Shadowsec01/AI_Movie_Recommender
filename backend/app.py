from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback
import csv
import os
from datetime import datetime

from recommender import engine, GENRES, YEAR_DATA, POSTER_URLS, RATINGS_DF

app = Flask(__name__)
CORS(app, origins=["*"])

STUDENTS_CSV = os.path.join(os.path.dirname(__file__), "students.csv")
FIELDNAMES = ["full_name", "reg_number", "department", "registered_at"]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def ok(data, msg="Success"):
    return jsonify({"status": "success", "message": msg, "data": data})

def err(msg, code=400):
    return jsonify({"status": "error", "message": msg, "data": None}), code

def _load_students():
    if not os.path.exists(STUDENTS_CSV):
        return []
    with open(STUDENTS_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def _save_student(row):
    exists = os.path.isfile(STUDENTS_CSV) and os.path.getsize(STUDENTS_CSV) > 0
    with open(STUDENTS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if not exists:
            writer.writeheader()
        writer.writerow(row)


# ─── Student routes ───────────────────────────────────────────────────────────

@app.route("/api/student/register", methods=["POST"])
def register_student():
    body = request.get_json()
    if not body:
        return err("Request body required")

    full_name  = (body.get("full_name") or "").strip()
    reg_number = (body.get("reg_number") or "").strip().upper()
    department = (body.get("department") or "").strip()

    if not full_name:
        return err("Full name is required")
    if not reg_number:
        return err("Registration number is required")
    if not department:
        return err("Department is required")

    students = _load_students()
    if any(s["reg_number"] == reg_number for s in students):
        # Return existing record — treat as login
        student = next(s for s in students if s["reg_number"] == reg_number)
        return ok(student, "Welcome back!")

    record = {
        "full_name": full_name,
        "reg_number": reg_number,
        "department": department,
        "registered_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    _save_student(record)
    return ok(record, "Registration successful!"), 201


@app.route("/api/student/<reg_number>", methods=["GET"])
def get_student(reg_number):
    students = _load_students()
    student = next((s for s in students if s["reg_number"] == reg_number.upper()), None)
    if not student:
        return err("Student not found", 404)
    return ok(student)


@app.route("/api/students", methods=["GET"])
def list_students():
    return ok(_load_students())


# ─── Stats ────────────────────────────────────────────────────────────────────

@app.route("/api/stats", methods=["GET"])
def get_stats():
    try:
        return ok(engine.get_system_stats())
    except Exception as e:
        return err(str(e), 500)


# ─── Users ───────────────────────────────────────────────────────────────────

@app.route("/api/users", methods=["GET"])
def get_users():
    try:
        users_data = []
        for user in engine.users:
            uv = engine.ratings.loc[user]
            rated = uv[uv > 0]
            users_data.append({
                "name": user,
                "num_rated": int(len(rated)),
                "avg_rating": round(float(rated.mean()), 2) if len(rated) > 0 else 0
            })
        return ok(users_data)
    except Exception as e:
        return err(str(e), 500)


# ─── Movies ──────────────────────────────────────────────────────────────────

@app.route("/api/movies", methods=["GET"])
def get_movies():
    try:
        movies = [engine.get_movie_stats(m) for m in engine.items]
        movies.sort(key=lambda x: x["avg_rating"], reverse=True)
        return ok(movies)
    except Exception as e:
        return err(str(e), 500)


# ─── Recommend ───────────────────────────────────────────────────────────────

@app.route("/api/recommend", methods=["POST"])
def recommend():
    try:
        body = request.get_json()
        if not body:
            return err("Request body required")

        user      = body.get("user")
        algorithm = body.get("algorithm", "hybrid")
        n         = body.get("n", 5)
        method    = body.get("method", "pearson")

        if not user:
            return err("'user' field is required")
        if user not in engine.users:
            return err(f"User '{user}' not found")
        if algorithm not in ["user", "item", "hybrid"]:
            return err("algorithm must be 'user', 'item', or 'hybrid'")

        n = max(1, min(n, len(engine.items)))

        if algorithm == "user":
            recs = engine.user_based_recommend(user, n, method=method)
        elif algorithm == "item":
            recs = engine.item_based_recommend(user, n)
        else:
            recs = engine.hybrid_recommend(user, n, method=method)

        if not recs:
            recs = engine.cold_start_recommend(n)
            msg = "No rating history found — showing popular picks."
        else:
            msg = f"{len(recs)} recommendations via {algorithm.title()}-Based CF"

        return ok({"recommendations": recs, "user": user}, msg)

    except Exception as e:
        traceback.print_exc()
        return err(f"Recommendation failed: {str(e)}", 500)


# ─── Single movie ─────────────────────────────────────────────────────────────

@app.route("/api/movie/<path:movie_name>", methods=["GET"])
def get_movie(movie_name):
    try:
        movie_name = movie_name.replace("%20", " ")
        if movie_name not in engine.items:
            return err(f"Movie '{movie_name}' not found", 404)

        stats = engine.get_movie_stats(movie_name)
        ratings_col = engine.ratings[movie_name]
        stats["user_ratings"] = {u: int(r) for u, r in ratings_col.items() if r > 0}

        sim_row = engine.item_sim_matrix[movie_name].drop(movie_name)
        top_sim = sim_row.nlargest(5)
        stats["similar_movies"] = [
            {
                "movie": m,
                "similarity": round(float(s), 3),
                "genres": GENRES.get(m, []),
                "poster": POSTER_URLS.get(m, "")
            }
            for m, s in top_sim.items() if s > 0
        ]
        return ok(stats)
    except Exception as e:
        return err(str(e), 500)


# ─── Rate ─────────────────────────────────────────────────────────────────────

@app.route("/api/rate", methods=["POST"])
def rate_movie():
    try:
        body = request.get_json()
        user, movie, rating = body.get("user"), body.get("movie"), body.get("rating")
        if not all([user, movie, rating is not None]):
            return err("'user', 'movie', and 'rating' are required")
        if user not in engine.users:
            return err(f"User '{user}' not found")
        if movie not in engine.items:
            return err(f"Movie '{movie}' not found")
        if not isinstance(rating, (int, float)) or not (1 <= rating <= 5):
            return err("Rating must be 1–5")
        engine.ratings.loc[user, movie] = int(rating)
        engine.item_sim_matrix = engine._build_item_sim()
        return ok({"user": user, "movie": movie, "rating": int(rating)}, "Rating saved!")
    except Exception as e:
        return err(str(e), 500)


# ─── Similarity ───────────────────────────────────────────────────────────────

@app.route("/api/similarity", methods=["POST"])
def get_similarity():
    try:
        body = request.get_json()
        u1, u2 = body.get("user1"), body.get("user2")
        if not u1 or not u2:
            return err("Both 'user1' and 'user2' required")
        if u1 not in engine.users or u2 not in engine.users:
            return err("One or both users not found")
        common = [m for m in engine.items if engine.ratings.loc[u1, m] > 0 and engine.ratings.loc[u2, m] > 0]
        return ok({
            "user1": u1, "user2": u2,
            "cosine":  round(engine.get_user_similarity(u1, u2, "cosine"), 4),
            "pearson": round(engine.get_user_similarity(u1, u2, "pearson"), 4),
            "jaccard": round(engine.get_user_similarity(u1, u2, "jaccard"), 4),
            "common_movies": len(common),
            "common_titles": common[:5]
        })
    except Exception as e:
        return err(str(e), 500)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return ok({"status": "online", "version": "2.0.0"}, "CineMatch API running")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
