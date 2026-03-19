import { useState, useEffect, useRef, useCallback } from "react";

const GAME_CONFIGS = [
  { game: "pokemon", label: "Pokémon", color: { bg: "#faeeda", color: "#412402" } },
  { game: "one-piece", label: "One Piece", color: { bg: "#fcebeb", color: "#791f1f" } },
  { game: "dragon-ball-super", label: "Dragon Ball", color: { bg: "#eaf3de", color: "#27500a" } },
];

const FEATURED_SETS = [
  { game: "pokemon", label: "Pokémon", setId: "base-set", setName: "Base Set" },
  { game: "pokemon", label: "Pokémon", setId: "obsidian-flames", setName: "Obsidian Flames" },
  { game: "pokemon", label: "Pokémon", setId: "evolving-skies", setName: "Evolving Skies" },
  { game: "one-piece", label: "One Piece", setId: "romance-dawn", setName: "Romance Dawn" },
  { game: "one-piece", label: "One Piece", setId: "paramount-war", setName: "Paramount War" },
  { game: "dragon-ball-super", label: "Dragon Ball", setId: "galactic-battle", setName: "Galactic Battle" },
  { game: "dragon-ball-super", label: "Dragon Ball", setId: "union-force", setName: "Union Force" },
];

function getMarketPrice(card) {
  const variants = card.variants || [];
  const nm = variants.find(v => (v.condition || "").toLowerCase().includes("near mint") || (v.condition || "").toLowerCase() === "nm") || variants[0];
  return nm?.price || nm?.marketPrice || card.price || null;
}

function getChange(card, period) {
  const s = card.statistics || card.stats || {};
  return s[`${period}ChangePercent`] ?? s[`change_${period}`] ?? s[period] ?? null;
}

function getPriceHistory(card) {
  const variants = card.variants || [];
  const nm = variants.find(v => (v.condition || "").toLowerCase().includes("near mint")) || variants[0];
  const history = nm?.price_history || nm?.priceHistory || [];
  return history.map(h => ({ price: h.price || h.marketPrice || h.value, date: new Date((h.date || h.timestamp || Date.now() / 1000) * 1000) })).filter(h => h.price);
}

function GameTag({ label }) {
  const cfg = GAME_CONFIGS.find(g => g.label === label)?.color || { bg: "#f3f4f6", color: "#6b7280" };
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>;
}

function LiveBadge() {
  return <span style={{ background: "#e6f1fb", color: "#0c447c", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>● Live</span>;
}

function RiskBadge({ level }) {
  const cfg = { Low: { bg: "#e6f3dd", color: "#2d6a1f", label: "Low Risk" }, Medium: { bg: "#fff3cd", color: "#856404", label: "Medium Risk" }, High: { bg: "#fde8e8", color: "#9b1c1c", label: "High Risk" } }[level] || { bg: "#f3f4f6", color: "#6b7280", label: level };
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.03em", textTransform: "uppercase" }}>{cfg.label}</span>;
}

function Spinner({ size = 16 }) {
  return <>
    <div style={{ width: size, height: size, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </>;
}

function Sparkline({ prices, width = 90, height = 32 }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * width},${height - ((p - min) / range) * height}`).join(" ");
  const color = prices[prices.length - 1] >= prices[0] ? "#16a34a" : "#dc2626";
  return <svg width={width} height={height} style={{ display: "block", flexShrink: 0 }}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" /><circle cx={width} cy={height - ((prices[prices.length - 1] - min) / range) * height} r={2.5} fill={color} /></svg>;
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function PriceChart({ history }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !history.length) return;
    const init = () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: "line",
        data: {
          labels: history.map(h => h.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })),
          datasets: [{ data: history.map(h => h.price), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.07)", borderWidth: 2, pointRadius: 2, tension: 0.3, fill: true }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 8, font: { size: 10 }, color: "#6b7280" }, grid: { display: false } }, y: { ticks: { font: { size: 10 }, color: "#6b7280", callback: v => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v) }, grid: { color: "rgba(0,0,0,0.05)" } } } }
      });
    };
    if (window.Chart) init();
    else { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"; s.onload = init; document.head.appendChild(s); }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [history]);
  return <div style={{ position: "relative", width: "100%", height: 200 }}><canvas ref={canvasRef} /></div>;
}

function AIAnalysis({ cardData, gameLabel, onClose }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function go() {
      const price = getMarketPrice(cardData);
      const change7d = getChange(cardData, "7d");
      const change30d = getChange(cardData, "30d");
      const prompt = `You are a trading card market analyst. Analyze this card using live JustTCG data.
Card: ${cardData.name} | Game: ${gameLabel} | Set: ${cardData.set_name || cardData.setId}
Live Price: $${price?.toLocaleString()} | 7d Change: ${change7d != null ? change7d.toFixed(1) + "%" : "N/A"} | 30d Change: ${change30d != null ? change30d.toFixed(1) + "%" : "N/A"}
Provide: 1. RISK (Low/Medium/High) 2. BUY ZONE price range 3. SELL TARGET 4. 3-month OUTLOOK 5. KEY FACTORS (2-3 bullets). Under 200 words, plain text.`;
      try {
        const resp = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
        const data = await resp.json();
        setAnalysis(data.text || "Unable to load analysis.");
      } catch { setAnalysis("Unable to load analysis."); }
      setLoading(false);
    }
    go();
  }, [cardData, gameLabel]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-secondary)", padding: 24, maxWidth: 540, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div><div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 2 }}>AI Analysis · Live JustTCG Data</div><div style={{ fontSize: 16, fontWeight: 600 }}>{cardData.name}</div></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)" }}>×</button>
        </div>
        {loading ? <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-secondary)", fontSize: 13, padding: "20px 0" }}><Spinner />Analyzing live market data...</div> : <div style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{analysis}</div>}
      </div>
    </div>
  );
}

function CardDetail({ card, gameLabel, onBack }) {
  const [fullCard, setFullCard] = useState(card);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    async function fetchFull() {
      setLoading(true);
      try {
        const resp = await fetch("/api/justtcg", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "card", cardId: card.id }),
        });
        const data = await resp.json();
        if (data.card) setFullCard(data.card);
      } catch { }
      setLoading(false);
    }
    fetchFull();
  }, [card]);

  const price = getMarketPrice(fullCard);
  const change7d = getChange(fullCard, "7d");
  const change30d = getChange(fullCard, "30d");
  const change90d = getChange(fullCard, "90d");
  const history = getPriceHistory(fullCard);
  const prices = history.map(h => h.price);
  const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : price;
  const volatility = prices.length > 1 ? Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100 : 5;
  const riskLevel = volatility > 12 ? "High" : volatility > 6 ? "Medium" : "Low";
  const buyZoneLow = Math.round((avg || price || 0) * 0.88);
  const buyZoneHigh = Math.round((avg || price || 0) * 0.96);
  const sellTarget = Math.round((avg || price || 0) * 1.18);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, padding: "0 0 16px" }}>← Back</button>
      {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 12 }}><Spinner />Loading full price history...</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <GameTag label={gameLabel} />
            <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{fullCard.set_name || fullCard.setId}</span>
            <LiveBadge />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{fullCard.name}</h2>
          {fullCard.number && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>#{fullCard.number} · {fullCard.rarity}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RiskBadge level={riskLevel} />
          <button onClick={() => setShowAI(true)} style={{ background: "var(--color-background-info)", color: "var(--color-text-info)", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>AI Analysis ↗</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>
        <MetricCard label="Market Price" value={price ? `$${Number(price).toLocaleString()}` : "—"} sub="JustTCG live" />
        <MetricCard label="7d Change" value={change7d != null ? `${change7d > 0 ? "+" : ""}${Number(change7d).toFixed(1)}%` : "—"} color={change7d > 0 ? "#16a34a" : change7d < 0 ? "#dc2626" : undefined} sub="7 days" />
        <MetricCard label="30d Change" value={change30d != null ? `${change30d > 0 ? "+" : ""}${Number(change30d).toFixed(1)}%` : "—"} color={change30d > 0 ? "#16a34a" : change30d < 0 ? "#dc2626" : undefined} sub="30 days" />
        <MetricCard label="90d Change" value={change90d != null ? `${change90d > 0 ? "+" : ""}${Number(change90d).toFixed(1)}%` : "—"} color={change90d > 0 ? "#16a34a" : change90d < 0 ? "#dc2626" : undefined} sub="90 days" />
      </div>

      {history.length > 1 && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>Price History <LiveBadge /></div>
          <PriceChart history={history} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "#e6f3dd", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #86efac" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Optimal Buy Zone</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#15803d" }}>${buyZoneLow.toLocaleString()} – ${buyZoneHigh.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>based on 30d average</div>
        </div>
        <div style={{ background: "#fde8e8", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #fca5a5" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Sell Target</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#b91c1c" }}>${sellTarget.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>+18% above avg</div>
        </div>
      </div>

      {fullCard.variants && fullCard.variants.length > 0 && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            All Variants <span style={{ color: "#185fa5", fontWeight: 700 }}>● JustTCG Live</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>{["Condition", "Printing", "Price"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>)}</tr></thead>
              <tbody>{fullCard.variants.map((v, i) => (
                <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "6px 10px" }}><span style={{ background: "var(--color-background-info)", color: "var(--color-text-info)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>{v.condition}</span></td>
                  <td style={{ padding: "6px 10px", color: "var(--color-text-secondary)" }}>{v.printing || "—"}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v.price ? `$${Number(v.price).toLocaleString()}` : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {showAI && <AIAnalysis cardData={fullCard} gameLabel={gameLabel} onClose={() => setShowAI(false)} />}
    </div>
  );
}

function SetTopCards({ setConfig, onCardClick }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch10() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch("/api/justtcg", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "top_cards", game: setConfig.game, setId: setConfig.setId, orderBy: "price", order: "desc", limit: 10 }),
        });
        const data = await resp.json();
        if (data.cards) setCards(data.cards);
        else setError(data.error || "No data");
      } catch (e) { setError(e.message); }
      setLoading(false);
    }
    fetch10();
  }, [setConfig]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <GameTag label={setConfig.label} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{setConfig.setName}</span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Top 10 by price</span>
        {!loading && !error && <LiveBadge />}
      </div>
      {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-secondary)", fontSize: 12, padding: "12px 0" }}><Spinner size={14} />Fetching top cards...</div>}
      {error && <div style={{ fontSize: 12, color: "var(--color-text-danger)", padding: "8px 0" }}>Could not load: {error}</div>}
      {!loading && !error && cards.length === 0 && <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>No cards found for this set</div>}
      <div style={{ display: "grid", gap: 6 }}>
        {cards.map((card, idx) => {
          const price = getMarketPrice(card);
          const change7d = getChange(card, "7d");
          const trendColor = change7d != null ? (change7d >= 0 ? "#16a34a" : "#dc2626") : "var(--color-text-secondary)";
          return (
            <div key={card.id || idx} onClick={() => onCardClick(card, setConfig.label)} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-background-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--color-text-secondary)", flexShrink: 0 }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>{card.rarity || ""}{card.number ? ` · #${card.number}` : ""}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{price ? `$${Number(price).toLocaleString()}` : "—"}</div>
                {change7d != null && <div style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>{change7d >= 0 ? "▲" : "▼"} {Math.abs(change7d).toFixed(1)}%</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketView({ onCardClick }) {
  const [activeGames, setActiveGames] = useState(["pokemon", "one-piece", "dragon-ball-super"]);
  const [search, setSearch] = useState("");
  const [selectedSet, setSelectedSet] = useState("all");

  const visibleSets = FEATURED_SETS.filter(s =>
    activeGames.includes(s.game) &&
    (selectedSet === "all" || s.setId === selectedSet)
  );

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Card Market Intelligence</h1>
          <LiveBadge />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Top 10 most valuable cards per set · Powered by JustTCG</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {GAME_CONFIGS.map(g => {
          const active = activeGames.includes(g.game);
          return (
            <button key={g.game} onClick={() => setActiveGames(prev => active ? prev.filter(x => x !== g.game) : [...prev, g.game])}
              style={{ fontSize: 11, padding: "5px 12px", fontWeight: 600, borderRadius: 20, border: active ? `1.5px solid ${g.color.color}` : "0.5px solid var(--color-border-tertiary)", background: active ? g.color.bg : "transparent", color: active ? g.color.color : "var(--color-text-secondary)", cursor: "pointer" }}>
              {g.label}
            </button>
          );
        })}
        <select value={selectedSet} onChange={e => setSelectedSet(e.target.value)} style={{ fontSize: 11, padding: "5px 10px", marginLeft: "auto" }}>
          <option value="all">All sets</option>
          {FEATURED_SETS.filter(s => activeGames.includes(s.game)).map(s => <option key={s.setId} value={s.setId}>{s.setName}</option>)}
        </select>
      </div>

      {visibleSets.map(setConfig => (
        <SetTopCards key={`${setConfig.game}-${setConfig.setId}`} setConfig={setConfig} onCardClick={onCardClick} />
      ))}
    </>
  );
}

function ScannerView() {
  const [alerts, setAlerts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [filter, setFilter] = useState("all");
  const [autoScan, setAutoScan] = useState(false);
  const intervalRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    const newAlerts = [];
    try {
      const games = ["pokemon", "one-piece", "dragon-ball-super"];
      const gameLabels = { "pokemon": "Pokémon", "one-piece": "One Piece", "dragon-ball-super": "Dragon Ball" };

      await Promise.all(games.map(async game => {
        const [moversResp, dealsResp] = await Promise.all([
          fetch("/api/justtcg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "movers", game, orderBy: "7d" }) }),
          fetch("/api/justtcg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deals", game, orderBy: "7d" }) }),
        ]);
        const moversData = await moversResp.json();
        const dealsData = await dealsResp.json();
        const label = gameLabels[game];

        (moversData.cards || []).slice(0, 5).forEach(card => {
          const price = getMarketPrice(card);
          const change = getChange(card, "7d");
          if (!price || change == null) return;
          if (change > 5) newAlerts.push({ id: `up-${card.id}`, type: "buyzone", card: card.name, cardData: card, gameLabel: label, message: `Up ${change.toFixed(1)}% in 7 days — momentum`, price: Math.round(price), change, platform: "JustTCG", time: new Date(), severity: change > 15 ? "high" : "medium" });
        });

        (dealsData.cards || []).slice(0, 5).forEach(card => {
          const price = getMarketPrice(card);
          const change = getChange(card, "7d");
          if (!price || change == null) return;
          if (change < -3) {
            newAlerts.push({ id: `down-${card.id}`, type: "underpriced", card: card.name, cardData: card, gameLabel: label, message: `Down ${Math.abs(change).toFixed(1)}% — potential buy`, price: Math.round(price), change, platform: "JustTCG", time: new Date(), severity: change < -10 ? "high" : "medium" });
            newAlerts.push({ id: `drop-${card.id}`, type: "pricedrop", card: card.name, cardData: card, gameLabel: label, message: `Dropped ${Math.abs(change).toFixed(1)}% this week`, price: Math.round(price), change, platform: "JustTCG", time: new Date(), severity: change < -10 ? "high" : "low" });
          }
        });
      }));
    } catch (e) { console.error("Scanner:", e); }
    setAlerts(newAlerts.sort((a, b) => (b.severity === "high" ? 1 : 0) - (a.severity === "high" ? 1 : 0)));
    setLastScan(new Date());
    setScanning(false);
  }, []);

  useEffect(() => { runScan(); }, []);
  useEffect(() => {
    if (autoScan) intervalRef.current = setInterval(runScan, 60000);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [autoScan, runScan]);

  if (selectedCard) return <CardDetail card={selectedCard.card} gameLabel={selectedCard.label} onBack={() => setSelectedCard(null)} />;

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.type === filter);
  const counts = { underpriced: alerts.filter(a => a.type === "underpriced").length, buyzone: alerts.filter(a => a.type === "buyzone").length, pricedrop: alerts.filter(a => a.type === "pricedrop").length };
  const highSeverity = alerts.filter(a => a.severity === "high").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Market Scanner</h2>
            <LiveBadge />
            {highSeverity > 0 && <span style={{ background: "#fcebeb", color: "#791f1f", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{highSeverity} urgent</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{lastScan ? `Last scan: ${lastScan.toLocaleTimeString()} · ${alerts.length} signals from JustTCG` : "Scanning..."}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <div onClick={() => setAutoScan(!autoScan)} style={{ width: 32, height: 18, borderRadius: 9, background: autoScan ? "#16a34a" : "var(--color-border-secondary)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: autoScan ? 16 : 2, transition: "left 0.2s" }} />
            </div>
            Auto (60s)
          </div>
          <button onClick={runScan} disabled={scanning} style={{ fontSize: 12, padding: "6px 14px", fontWeight: 600, opacity: scanning ? 0.6 : 1 }}>{scanning ? "Scanning..." : "Scan now"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
        {[{ key: "underpriced", label: "Underpriced", bg: "#eaf3de", color: "#27500a" }, { key: "buyzone", label: "Momentum", bg: "#e6f1fb", color: "#0c447c" }, { key: "pricedrop", label: "Price Drop", bg: "#fcebeb", color: "#791f1f" }].map(t => (
          <div key={t.key} onClick={() => setFilter(filter === t.key ? "all" : t.key)} style={{ background: filter === t.key ? t.bg : "var(--color-background-secondary)", border: filter === t.key ? `1.5px solid ${t.color}` : "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: filter === t.key ? t.color : "var(--color-text-primary)" }}>{counts[t.key]}</div>
            <div style={{ fontSize: 10, color: filter === t.key ? t.color : "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {scanning ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 12 }}>
          <Spinner size={28} />
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Scanning Pokémon · One Piece · Dragon Ball via JustTCG...</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 13 }}>No signals — try scanning again</div>}
          {filtered.map(alert => {
            const cfg = { underpriced: { bg: "#eaf3de", border: "#c0dd97", color: "#27500a", label: "Underpriced" }, buyzone: { bg: "#e6f1fb", border: "#b5d4f4", color: "#0c447c", label: "Momentum" }, pricedrop: { bg: "#fcebeb", border: "#f7c1c1", color: "#791f1f", label: "Price Drop" } }[alert.type];
            const severityDot = { high: "#dc2626", medium: "#d97706", low: "#16a34a" }[alert.severity];
            return (
              <div key={alert.id} onClick={() => setSelectedCard({ card: alert.cardData, label: alert.gameLabel })} style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}`, borderRadius: 10, padding: "11px 14px", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{cfg.label}</span>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: severityDot, display: "inline-block" }} />
                    <GameTag label={alert.gameLabel} />
                  </div>
                  <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>JustTCG live</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color, marginBottom: 2 }}>{alert.card}</div>
                <div style={{ fontSize: 12, color: cfg.color, opacity: 0.8, marginBottom: 6 }}>{alert.message}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>${alert.price.toLocaleString()}</span>
                  <span style={{ fontSize: 11, background: "rgba(0,0,0,0.08)", color: cfg.color, padding: "2px 7px", borderRadius: 20 }}>7d: {alert.change >= 0 ? "+" : ""}{Number(alert.change).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WatchlistTicker() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    async function fetchTicker() {
      try {
        const resp = await fetch("/api/justtcg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "top_cards", game: "pokemon", orderBy: "price", order: "desc", limit: 5 }) });
        const data = await resp.json();
        const resp2 = await fetch("/api/justtcg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "top_cards", game: "one-piece", orderBy: "price", order: "desc", limit: 3 }) });
        const data2 = await resp2.json();
        const all = [...(data.cards || []), ...(data2.cards || [])];
        setItems(all.map(c => {
          const price = getMarketPrice(c);
          const change = getChange(c, "7d");
          return `${c.name}  ${price ? "$" + Number(price).toLocaleString() : "—"}  ${change != null ? (change >= 0 ? "▲" : "▼") + " " + Math.abs(change).toFixed(1) + "%" : ""}`;
        }));
      } catch { }
    }
    fetchTicker();
  }, []);

  if (!items.length) return null;
  const text = items.join("   ·   ") + "   ·   ";
  return (
    <div style={{ overflow: "hidden", background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "6px 0", fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-block", animation: "ticker 60s linear infinite" }}>{text}{text}</div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("market");
  const [selectedCard, setSelectedCard] = useState(null);

  const handleCardClick = (card, gameLabel) => {
    setSelectedCard({ card, gameLabel });
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 760, margin: "0 auto", paddingBottom: 60 }}>
      <WatchlistTicker />
      <div style={{ padding: "16px 16px 0" }}>
        {selectedCard ? (
          <CardDetail card={selectedCard.card} gameLabel={selectedCard.gameLabel} onBack={() => setSelectedCard(null)} />
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "var(--color-background-secondary)", borderRadius: 10, padding: 4 }}>
              {[{ key: "market", label: "Market" }, { key: "scanner", label: "Scanner" }].map(t => (
                <button key={t.key} onClick={() => setView(t.key)} style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 7, background: view === t.key ? "var(--color-background-primary)" : "transparent", color: view === t.key ? "var(--color-text-primary)" : "var(--color-text-secondary)", cursor: "pointer", transition: "all 0.15s", boxShadow: view === t.key ? "0 0 0 0.5px var(--color-border-secondary)" : "none" }}>{t.label}</button>
              ))}
            </div>
            {view === "market" && <MarketView onCardClick={handleCardClick} />}
            {view === "scanner" && <ScannerView />}
          </>
        )}
      </div>
    </div>
  );
}
