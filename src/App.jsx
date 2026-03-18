import { useState, useEffect, useCallback, useRef } from "react";

const MOCK_CARDS = [
  { id: 1, name: "Charizard Base Set PSA 10", set: "Base Set", year: 1999, game: "Pokémon" },
  { id: 2, name: "Black Lotus Alpha", set: "Alpha", year: 1993, game: "Magic: The Gathering" },
  { id: 3, name: "Babe Ruth 1933 Goudey", set: "Goudey", year: 1933, game: "Baseball" },
  { id: 4, name: "LeBron James 2003 Topps Chrome RC", set: "Topps Chrome", year: 2003, game: "Basketball" },
  { id: 5, name: "Pikachu Illustrator", set: "Promo", year: 1998, game: "Pokémon" },
  { id: 6, name: "Michael Jordan 1986 Fleer RC", set: "Fleer", year: 1986, game: "Basketball" },
  { id: 7, name: "Mox Sapphire Beta", set: "Beta", year: 1993, game: "Magic: The Gathering" },
  { id: 8, name: "Mickey Mantle 1952 Topps", set: "Topps", year: 1952, game: "Baseball" },
  { id: 9, name: "Monkey D. Luffy OP01-001 SGR PSA 10", set: "Romance Dawn", year: 2022, game: "One Piece" },
  { id: 10, name: "Roronoa Zoro OP01-002 SGR PSA 10", set: "Romance Dawn", year: 2022, game: "One Piece" },
  { id: 11, name: "Nami OP02-016 Alt Art PSA 10", set: "Paramount War", year: 2022, game: "One Piece" },
  { id: 12, name: "Shanks OP01-120 SEC PSA 10", set: "Romance Dawn", year: 2022, game: "One Piece" },
];

function generateSales(basePrice, count = 18) {
  const sales = [];
  const now = Date.now();
  let price = basePrice;
  for (let i = count; i >= 0; i--) {
    const daysAgo = i * (Math.random() * 3 + 1);
    const fluctuation = (Math.random() - 0.48) * 0.08;
    price = Math.max(price * (1 + fluctuation), basePrice * 0.4);
    sales.push({
      date: new Date(now - daysAgo * 86400000),
      price: Math.round(price),
      platform: ["eBay", "PWCC", "Heritage", "Goldin", "Whatnot"][Math.floor(Math.random() * 5)],
      grade: ["PSA 9", "PSA 10", "BGS 9.5", "RAW", "CGC 9"][Math.floor(Math.random() * 5)],
    });
  }
  return sales.sort((a, b) => a.date - b.date);
}

const BASE_PRICES = { 1: 8500, 2: 45000, 3: 12000, 4: 3200, 5: 380000, 6: 28000, 7: 22000, 8: 95000, 9: 4200, 10: 1800, 11: 950, 12: 3100 };

function RiskBadge({ level }) {
  const cfg = {
    Low: { bg: "#e6f3dd", color: "#2d6a1f", label: "Low Risk" },
    Medium: { bg: "#fff3cd", color: "#856404", label: "Medium Risk" },
    High: { bg: "#fde8e8", color: "#9b1c1c", label: "High Risk" },
  }[level] || { bg: "#f3f4f6", color: "#6b7280", label: level };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.03em", textTransform: "uppercase" }}>
      {cfg.label}
    </span>
  );
}

function Sparkline({ data, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.price - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const last = prices[prices.length - 1], first = prices[0];
  const color = last >= first ? "#16a34a" : "#dc2626";
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((last - min) / range) * height} r={2.5} fill={color} />
    </svg>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", minWidth: 100 }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function SalesTable({ sales }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
            {["Date", "Price", "Platform", "Grade"].map(h => (
              <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...sales].reverse().slice(0, 10).map((s, i) => (
            <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <td style={{ padding: "6px 10px", color: "var(--color-text-secondary)" }}>{s.date.toLocaleDateString()}</td>
              <td style={{ padding: "6px 10px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${s.price.toLocaleString()}</td>
              <td style={{ padding: "6px 10px" }}>{s.platform}</td>
              <td style={{ padding: "6px 10px" }}>
                <span style={{ background: "var(--color-background-info)", color: "var(--color-text-info)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>{s.grade}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriceChart({ sales }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !sales.length) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => {
      if (chartRef.current) chartRef.current.destroy();
      const labels = sales.map(s => s.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      const prices = sales.map(s => s.price);
      chartRef.current = new window.Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Sale Price",
            data: prices,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.07)",
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: "#3b82f6",
            tension: 0.3,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { autoSkip: true, maxTicksLimit: 8, font: { size: 10 }, color: "#6b7280" }, grid: { display: false } },
            y: {
              ticks: { font: { size: 10 }, color: "#6b7280", callback: v => "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v) },
              grid: { color: "rgba(0,0,0,0.05)" }
            }
          }
        }
      });
    };
    if (!window.Chart) document.head.appendChild(script);
    else script.onload();
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [sales]);

  return (
    <div style={{ position: "relative", width: "100%", height: 180 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function AIAnalysis({ card, sales, onClose }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalysis() {
      const prices = sales.map(s => s.price);
      const latest = prices[prices.length - 1];
      const oldest = prices[0];
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const trend = ((latest - oldest) / oldest * 100).toFixed(1);
      const volatility = (Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100).toFixed(1);

      const prompt = `You are a trading card market analyst. Analyze this card and provide actionable investment insights.

Card: ${card.name}
Game: ${card.game}
Set: ${card.set} (${card.year})

Recent Sales Data (${sales.length} sales):
- Current Price: $${latest.toLocaleString()}
- 30-day Average: $${avg.toLocaleString()}
- Min: $${min.toLocaleString()} | Max: $${max.toLocaleString()}
- Price Trend: ${trend}%
- Volatility: ${volatility}%
- Platforms: ${[...new Set(sales.map(s => s.platform))].join(", ")}

Provide a concise analysis with:
1. RISK ASSESSMENT: (Low/Medium/High) and why
2. OPTIMAL BUY ZONE: specific price range to target
3. OPTIMAL SELL TARGET: specific price to exit at
4. MARKET OUTLOOK: 3-month prediction
5. KEY FACTORS: 2-3 bullet points driving price

Be specific with dollar amounts. Keep it under 250 words total. Use plain text, no markdown headers.`;

      try {
        const resp = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await resp.json();
        const text = data.text || data.content?.map(b => b.text || "").join("") || "";
        setAnalysis(text);
      } catch (e) {
        setError("Unable to load analysis. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [card, sales]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-secondary)", padding: 24, maxWidth: 540, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 2 }}>AI Analysis</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{card.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)", lineHeight: 1 }}>×</button>
        </div>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-secondary)", fontSize: 13, padding: "20px 0" }}>
            <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Analyzing market data...
          </div>
        )}
        {error && <div style={{ color: "var(--color-text-danger)", fontSize: 13 }}>{error}</div>}
        {analysis && (
          <div style={{ fontSize: 13, lineHeight: 1.75, color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>{analysis}</div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function CardDetail({ card, onBack }) {
  const sales = generateSales(BASE_PRICES[card.id]);
  const prices = sales.map(s => s.price);
  const latest = prices[prices.length - 1];
  const oldest = prices[0];
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const trend = ((latest - oldest) / oldest * 100);
  const volatility = Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100;
  const riskLevel = volatility > 12 ? "High" : volatility > 6 ? "Medium" : "Low";
  const buyZoneLow = Math.round(avg * 0.88);
  const buyZoneHigh = Math.round(avg * 0.96);
  const sellTarget = Math.round(avg * 1.18);
  const trendColor = trend >= 0 ? "#16a34a" : "#dc2626";
  const [showAI, setShowAI] = useState(false);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, padding: "0 0 16px", display: "flex", alignItems: "center", gap: 4 }}>
        ← Back to market
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.game} · {card.set} · {card.year}</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{card.name}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RiskBadge level={riskLevel} />
          <button onClick={() => setShowAI(true)} style={{ background: "var(--color-background-info)", color: "var(--color-text-info)", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            AI Analysis ↗
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>
        <MetricCard label="Current" value={`$${latest.toLocaleString()}`} sub="last sale" />
        <MetricCard label="30d Avg" value={`$${avg.toLocaleString()}`} sub="mean price" />
        <MetricCard label="Trend" value={`${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`} color={trendColor} sub="30-day change" />
        <MetricCard label="Volatility" value={`${volatility.toFixed(1)}%`} sub={riskLevel + " risk"} />
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Price History</div>
        <PriceChart sales={sales} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "#e6f3dd", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #86efac" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Optimal Buy Zone</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#15803d" }}>${buyZoneLow.toLocaleString()} – ${buyZoneHigh.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>{((avg - buyZoneHigh) / avg * 100).toFixed(0)}% below avg</div>
        </div>
        <div style={{ background: "#fde8e8", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #fca5a5" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Sell Target</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#b91c1c" }}>${sellTarget.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>+{((sellTarget - avg) / avg * 100).toFixed(0)}% above avg</div>
        </div>
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Last 10 Sales</div>
        <SalesTable sales={sales} />
      </div>

      {showAI && <AIAnalysis card={card} sales={sales} onClose={() => setShowAI(false)} />}
    </div>
  );
}

function WatchlistTicker({ cards }) {
  const items = cards.map(c => {
    const price = BASE_PRICES[c.id];
    const change = ((Math.random() - 0.45) * 8).toFixed(1);
    return `${c.name.split(" ").slice(0, 3).join(" ")}  $${price.toLocaleString()}  ${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}%`;
  });
  const text = items.join("   ·   ") + "   ·   ";

  return (
    <div style={{ overflow: "hidden", background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "6px 0", fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-block", animation: "ticker 40s linear infinite" }}>
        {text}{text}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export default function App() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("All");

  const games = ["All", ...new Set(MOCK_CARDS.map(c => c.game))];
  const filtered = MOCK_CARDS.filter(c =>
    (gameFilter === "All" || c.game === gameFilter) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 760, margin: "0 auto", paddingBottom: 40 }}>
      <WatchlistTicker cards={MOCK_CARDS} />

      <div style={{ padding: "20px 16px 0" }}>
        {!selectedCard ? (
          <>
            <div style={{ marginBottom: 18 }}>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Card Market Intelligence</h1>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Live sales data · AI risk analysis · Optimal buy & sell signals</p>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cards..."
                style={{ flex: 1, minWidth: 180, fontSize: 13 }}
              />
              <select value={gameFilter} onChange={e => setGameFilter(e.target.value)} style={{ fontSize: 13 }}>
                {games.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map(card => {
                const sales = generateSales(BASE_PRICES[card.id]);
                const prices = sales.map(s => s.price);
                const latest = prices[prices.length - 1];
                const oldest = prices[0];
                const trend = ((latest - oldest) / oldest * 100);
                const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                const volatility = Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100;
                const riskLevel = volatility > 12 ? "High" : volatility > 6 ? "Medium" : "Low";
                const trendColor = trend >= 0 ? "#16a34a" : "#dc2626";

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.game} · {card.year}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                      <div style={{ marginTop: 4 }}>
                        <RiskBadge level={riskLevel} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${latest.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%</div>
                    </div>
                    <Sparkline data={sales} />
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 13 }}>No cards found</div>
            )}
          </>
        ) : (
          <CardDetail card={selectedCard} onBack={() => setSelectedCard(null)} />
        )}
      </div>
    </div>
  );
}
