import { useState, useEffect } from "react";

// VITE_API_URL is injected at build time by Render (set in render.yaml envVars).
// In local dev it falls back to the Vite proxy defined in vite.config.js.
const API = import.meta.env.VITE_API_URL || "/api";

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT IDENTITY — edit these three values to change the displayed identity
// ─────────────────────────────────────────────────────────────────────────────
const STUDENT = {
  full_name:  "Nduka Chikamji Divine",
  reg_number: "2031375842",
  department: "Cybersecurity",
};

const http = {
  get: async (path) => {
    const r = await fetch(`${API}${path}`);
    const j = await r.json();
    if (j.status === "error") throw new Error(j.message);
    return j.data;
  },
  post: async (path, body) => {
    const r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.status === "error") throw new Error(j.message);
    return j.data;
  },
};

// ─── Poster image with fallback ───────────────────────────────────────────────
function Poster({ src, title, width = 80, height = 120, className = "" }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        style={{
          width, height,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          borderRadius: 6, flexShrink: 0,
          border: "1px solid #2a2a4a",
          color: "#6b7280", fontSize: 10, textAlign: "center", padding: 4,
          gap: 4,
        }}
      >
        <span style={{ fontSize: 20 }}>🎥</span>
        <span style={{ lineHeight: 1.2, opacity: 0.6 }}>{title}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      onError={() => setErr(true)}
      style={{
        width, height,
        objectFit: "cover",
        borderRadius: 6,
        flexShrink: 0,
        display: "block",
      }}
    />
  );
}

// ─── Star row ────────────────────────────────────────────────────────────────
function Stars({ rating, max = 5, size = 14, interactive = false, onRate }) {
  const [hov, setHov] = useState(0);
  const disp = interactive ? (hov || rating) : rating;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => {
        const v = i + 1;
        const filled = v <= disp;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24"
            fill={filled ? "#f59e0b" : "none"}
            stroke={filled ? "#f59e0b" : "#4b5563"}
            strokeWidth="2"
            style={{ cursor: interactive ? "pointer" : "default" }}
            onMouseEnter={() => interactive && setHov(v)}
            onMouseLeave={() => interactive && setHov(0)}
            onClick={() => interactive && onRate?.(v)}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        );
      })}
    </div>
  );
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────
function Tag({ text, accent = false }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px",
      borderRadius: 99, letterSpacing: "0.04em",
      background: accent ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.06)",
      color: accent ? "#a5b4fc" : "#9ca3af",
      border: accent ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
    }}>{text}</span>
  );
}

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 3 }}>
        <span>Confidence</span><span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

// ─── Movie card ───────────────────────────────────────────────────────────────
function MovieCard({ rec, rank, currentUser }) {
  const [rated, setRated] = useState(false);
  const [hov, setHov] = useState(false);

  const rankColor = rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : rank === 3 ? "#d97706" : "#6366f1";

  const handleRate = async (val) => {
    try {
      await http.post("/rate", { user: currentUser, movie: rec.movie, rating: val });
      setRated(true);
    } catch (e) { alert(e.message); }
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        gap: 14,
        transition: "all 0.2s",
        transform: hov ? "translateY(-2px)" : "none",
        position: "relative",
      }}
    >
      {/* Rank */}
      <div style={{
        position: "absolute", top: 12, right: 14,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 28, color: rankColor, opacity: 0.4,
        lineHeight: 1,
      }}>#{rank}</div>

      {/* Poster */}
      <Poster src={rec.poster} title={rec.movie} width={72} height={106} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, color: "#f3f4f6", letterSpacing: "0.03em",
            lineHeight: 1.1, paddingRight: 28,
          }}>{rec.movie}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{rec.year}</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(rec.genres || []).map(g => <Tag key={g} text={g} />)}
          <Tag text={rec.algorithm} accent />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stars rating={Math.round(rec.predicted_rating)} />
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{rec.predicted_rating}/5 predicted</span>
        </div>

        <ConfBar value={rec.confidence} />

        {rec.based_on_users && rec.based_on_users.length > 0 && (
          <div style={{ fontSize: 10, color: "#6b7280" }}>
            Based on: <span style={{ color: "#a5b4fc" }}>{rec.based_on_users.join(", ")}</span>
          </div>
        )}
        {rec.similar_to && rec.similar_to.length > 0 && (
          <div style={{ fontSize: 10, color: "#6b7280" }}>
            Because you liked: <span style={{ color: "#a5b4fc" }}>{rec.similar_to.join(", ")}</span>
          </div>
        )}

        {rated ? (
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Rating saved</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#6b7280" }}>Rate:</span>
            <Stars rating={0} interactive onRate={handleRate} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const student = STUDENT;
  const [tab, setTab] = useState("recommend");
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Recommend state
  const [selUser, setSelUser] = useState("");
  const [algorithm, setAlgorithm] = useState("hybrid");
  const [method, setMethod] = useState("pearson");
  const [n, setN] = useState(5);
  const [recs, setRecs] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recMsg, setRecMsg] = useState("");

  const loadData = () => {
    setLoadingData(true);
    setLoadError("");
    Promise.all([
      http.get("/users"),
      http.get("/movies"),
      http.get("/stats"),
    ]).then(([u, m, s]) => {
      setUsers(u); setMovies(m); setStats(s);
      setLoadingData(false);
    }).catch((e) => {
      console.error(e);
      setLoadError(e.message || "Could not reach the backend. It may be waking up — please wait 30 seconds and try again.");
      setLoadingData(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const fetchRecs = async () => {
    if (!selUser) return;
    setRecLoading(true);
    setRecMsg("");
    try {
      const data = await http.post("/recommend", { user: selUser, algorithm, method, n });
      setRecs(data.recommendations);
      setRecMsg(`${data.recommendations.length} recommendations loaded`);
    } catch (e) {
      setRecMsg(e.message);
    } finally {
      setRecLoading(false);
    }
  };

  const navItems = [
    { id: "recommend", label: "Recommend" },
    { id: "movies", label: "Browse Films" },
    { id: "users", label: "User Profiles" },
    { id: "stats", label: "System Stats" },
  ];

  // ── Loading / error screen ─────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "#0a0a0f", color: "#a5b4fc",
      }}>
        <div style={{
          width: 48, height: 48, border: "4px solid #2a2a4a",
          borderTop: "4px solid #a5b4fc", borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Connecting to backend… (free tier may take ~30 s to wake up)</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        background: "#0a0a0f", color: "#f87171", padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h2 style={{ margin: 0, color: "#fca5a5" }}>Could not load data</h2>
        <p style={{ color: "#9ca3af", maxWidth: 420, margin: 0, fontSize: 14 }}>{loadError}</p>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          Backend URL: <code style={{ color: "#a5b4fc" }}>{API}</code>
        </p>
        <button
          onClick={loadData}
          style={{
            padding: "10px 28px", background: "#4f46e5", color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 28, letterSpacing: "0.1em",
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>CINEMATCH</div>

          <nav style={{ display: "flex", gap: 4 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: tab === item.id ? "rgba(99,102,241,0.2)" : "transparent",
                color: tab === item.id ? "#a5b4fc" : "#6b7280",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}>{item.label}</button>
            ))}
          </nav>

          {/* Student badge */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 99, padding: "5px 12px",
            fontSize: 11, color: "#9ca3af",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>{student.full_name.split(" ")[0]}</span>
            <span style={{ color: "#4b5563" }}>·</span>
            <span>{student.reg_number}</span>
          </div>
        </div>
      </header>

      {/* Identity Banner */}
      <div style={{
        background: "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(124,58,237,0.08), rgba(99,102,241,0.12))",
        borderBottom: "1px solid rgba(99,102,241,0.2)",
        padding: "8px 24px",
        textAlign: "center",
        fontSize: 11, color: "#818cf8",
        letterSpacing: "0.05em",
        fontWeight: 600,
      }}>
        {student.full_name.toUpperCase()} &nbsp;·&nbsp; {student.reg_number} &nbsp;·&nbsp; {student.department} &nbsp;·&nbsp; Federal University of Technology, Owerri
      </div>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "28px 24px" }}>

        {/* ── RECOMMEND TAB ── */}
        {tab === "recommend" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 36, color: "#f3f4f6",
                letterSpacing: "0.04em", margin: 0,
              }}>Get Recommendations</h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>
                Collaborative filtering AI — user-based, item-based, or hybrid
              </p>
            </div>

            {/* Controls */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: 20, marginBottom: 24,
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "end"
            }}>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: "0.05em" }}>
                  SELECT USER
                </label>
                <select value={selUser} onChange={e => setSelUser(e.target.value)} style={selectStyle}>
                  <option value="">Choose user...</option>
                  {users.map(u => (
                    <option key={u.name} value={u.name} style={{ background: "#0f0f1a" }}>
                      {u.name} ({u.num_rated} rated)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: "0.05em" }}>
                  ALGORITHM
                </label>
                <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} style={selectStyle}>
                  <option value="hybrid" style={{ background: "#0f0f1a" }}>Hybrid CF</option>
                  <option value="user" style={{ background: "#0f0f1a" }}>User-Based CF</option>
                  <option value="item" style={{ background: "#0f0f1a" }}>Item-Based CF</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: "0.05em" }}>
                  SIMILARITY · RESULTS
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                    <option value="pearson" style={{ background: "#0f0f1a" }}>Pearson</option>
                    <option value="cosine" style={{ background: "#0f0f1a" }}>Cosine</option>
                    <option value="jaccard" style={{ background: "#0f0f1a" }}>Jaccard</option>
                  </select>
                  <select value={n} onChange={e => setN(Number(e.target.value))} style={{ ...selectStyle, width: 64 }}>
                    {[3, 5, 8, 10].map(v => <option key={v} value={v} style={{ background: "#0f0f1a" }}>{v}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={fetchRecs} disabled={!selUser || recLoading} style={{
                padding: "11px 22px",
                background: (!selUser || recLoading) ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none", borderRadius: 10,
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: (!selUser || recLoading) ? "not-allowed" : "pointer",
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", fontSize: 15,
                whiteSpace: "nowrap",
              }}>
                {recLoading ? "Computing..." : "Run"}
              </button>
            </div>

            {recMsg && (
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{recMsg}</div>
            )}

            {recs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {recs.map((rec, i) => (
                  <MovieCard key={rec.movie} rec={rec} rank={i + 1} currentUser={selUser} />
                ))}
              </div>
            )}

            {recs.length === 0 && !recLoading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#374151" }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🎬</div>
                <div style={{ fontSize: 14 }}>Select a user and click Run to generate recommendations</div>
              </div>
            )}
          </div>
        )}

        {/* ── BROWSE TAB ── */}
        {tab === "movies" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#f3f4f6", letterSpacing: "0.04em", margin: 0 }}>
                Film Library
              </h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>{movies.length} titles · sorted by average rating</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {movies.map(m => (
                <div key={m.movie} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, overflow: "hidden",
                  transition: "transform 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Poster src={m.poster} title={m.movie} width="100%" height={220} />
                  <div style={{ padding: "10px 10px 12px" }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 14, color: "#f3f4f6", letterSpacing: "0.03em",
                      lineHeight: 1.2, marginBottom: 4,
                    }}>{m.movie}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Stars rating={Math.round(m.avg_rating)} size={11} />
                      <span style={{ fontSize: 10, color: "#6b7280" }}>{m.num_ratings} ratings</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 6 }}>
                      {(m.genres || []).slice(0, 2).map(g => <Tag key={g} text={g} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#f3f4f6", letterSpacing: "0.04em", margin: 0 }}>
                User Profiles
              </h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>{users.length} users in the system</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {users.map(u => (
                <div key={u.name} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "16px 18px",
                }}>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 22, color: "#f3f4f6", letterSpacing: "0.04em", marginBottom: 8,
                  }}>{u.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af" }}>
                    <span>{u.num_rated} films rated</span>
                    <span>avg {u.avg_rating}/5</span>
                  </div>
                  <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                    <div style={{ width: `${(u.num_rated / 18) * 100}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>
                    {Math.round((u.num_rated / 18) * 100)}% of catalogue rated
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && stats && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#f3f4f6", letterSpacing: "0.04em", margin: 0 }}>
                System Statistics
              </h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>
                Live engine metrics for collaborative filtering analysis
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Total Users", value: stats.total_users, sub: "active profiles" },
                { label: "Total Films", value: stats.total_items, sub: "in catalogue" },
                { label: "Total Ratings", value: stats.total_ratings, sub: "data points" },
                { label: "Matrix Sparsity", value: `${stats.sparsity}%`, sub: "unrated cells" },
                { label: "Avg Rating", value: `${stats.avg_rating}/5`, sub: "system-wide" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "18px 20px",
                }}>
                  <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>
                    {s.label.toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 36, color: "#a5b4fc", letterSpacing: "0.02em", lineHeight: 1,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb", marginBottom: 14 }}>Users</div>
                {stats.users.map(u => (
                  <div key={u} style={{ fontSize: 12, color: "#9ca3af", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{u}</div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb", marginBottom: 14 }}>Films in Catalogue</div>
                {stats.items.map(m => (
                  <div key={m} style={{ fontSize: 12, color: "#9ca3af", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "14px 24px",
        textAlign: "center",
        fontSize: 11,
        color: "#374151",
      }}>
        CineMatch v2.0 · Collaborative Filtering AI &nbsp;·&nbsp; Ezaekor Chukwuebuka Emmanuel &nbsp;·&nbsp; FUTO Cybersecurity Dept.
      </footer>
    </div>
  );
}

const selectStyle = {
  width: "100%", padding: "10px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#f3f4f6",
  fontSize: 13, outline: "none", fontFamily: "inherit",
};
