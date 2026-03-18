import { useState, useEffect, useRef, useCallback } from "react";

const CARDS = [
  { id: 1, name: "Charizard Base Set", query: "Charizard Base Set Holo", game: "Pokémon", set: "Base Set", year: 1999 },
  { id: 2, name: "Black Lotus Alpha", query: "Black Lotus Alpha", game: "Magic: The Gathering", set: "Alpha", year: 1993 },
  { id: 3, name: "Pikachu Illustrator", query: "Pikachu Illustrator", game: "Pokémon", set: "Promo", year: 1998 },
  { id: 4, name: "Charizard ex SAR", query: "Charizard ex Special Art Rare", game: "Pokémon", set: "Obsidian Flames", year: 2023 },
  { id: 5, name: "Mox Sapphire Beta", query: "Mox Sapphire Beta", game: "Magic: The Gathering", set: "Beta", year: 1993 },
  { id: 6, name: "Luffy OP01-001 SGR", query: "Monkey D Luffy OP01-001", game: "One Piece", set: "Romance Dawn", year: 2022 },
  { id: 7, name: "Zoro OP01-002 SGR", query: "Roronoa Zoro OP01-002", game: "One Piece", set: "Romance Dawn", year: 2022 },
  { id: 8, name: "Shanks OP01-120 SEC", query: "Shanks OP01-120", game: "One Piece", set: "Romance Dawn", year: 2022 },
  { id: 9, name: "Nami OP02-016 Alt Art", query: "Nami OP02-016", game: "One Piece", set: "Paramount War", year: 2022 },
  { id: 10, name: "Umbreon VMAX Alt Art", query: "Umbreon VMAX Alternate Art", game: "Pokémon", set: "Evolving Skies", year: 2021 },
  { id: 11, name: "Mew VMAX Alt Art", query: "Mew VMAX Alternate Art", game: "Pokémon", set: "Fusion Strike", year: 2021 },
  { id: 12, name: "Black Lotus Unlimited", query: "Black Lotus Unlimited", game: "Magic: The Gathering", set: "Unlimited", year: 1993 },
];

const FALLBACK_PRICES = { 1: 8500, 2: 45000, 3: 380000, 4: 420, 5: 22000, 6: 4200, 7: 1800, 8: 3100, 9: 950, 10: 280, 11: 190, 12: 8000 };
const PLATFORMS = ["eBay", "TCGPlayer", "PWCC", "Goldin", "Whatnot", "Heritage"];

function generateFallbackSales(basePrice) {
  const sales = [];
  const now = Date.now();
  let price = basePrice;
  for (let i = 18; i >= 0; i--) {
    price = Math.max(price * (1 + (Math.random() - 0.48) * 0.08), basePrice * 0.4);
    sales.push({
      date: new Date(now - i * (Math.random() * 3 + 1) * 86400000),
      price: Math.round(price),
      platform: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
      condition: ["Near Mint", "Lightly Played", "PSA 9", "PSA 10", "BGS 9.5"][Math.floor(Math.random() * 5)],
      source: "estimated",
    });
  }
  return sales.sort((a, b) => a.date - b.date);
}

function generateScannerAlerts(cards) {
  const alerts = [];
  cards.forEach(card => {
    const avg = FALLBACK_PRICES[card.id];
    const buyZone = avg * 0.96;
    const platforms = [...PLATFORMS].sort(() => Math.random() - 0.5);
    if (Math.random() > 0.4) {
      const pct = (Math.random() * 18 + 5).toFixed(1);
      alerts.push({ id: `under-${card.id}-${Date.now()}-${Math.random()}`, type: "underpriced", card: card.name, cardId: card.id, game: card.game, message: `Listed ${pct}% below market avg`, price: Math.round(avg * (1 - pct / 100)), marketPrice: avg, platform: platforms[0], pctDiff: -parseFloat(pct), time: new Date(Date.now() - Math.random() * 3600000), severity: pct > 12 ? "high" : "medium" });
    }
    if (Math.random() > 0.5) {
      const hitPrice = Math.round(buyZone * (0.95 + Math.random() * 0.08));
      alerts.push({ id: `buy-${card.id}-${Date.now()}-${Math.random()}`, type: "buyzone", card: card.name, cardId: card.id, game: card.game, message: "Price entered optimal buy zone", price: hitPrice, marketPrice: avg, platform: platforms[1], pctDiff: ((hitPrice - avg) / avg * 100).toFixed(1), time: new Date(Date.now() - Math.random() * 7200000), severity: "medium" });
    }
    if (Math.random() > 0.55) {
      const pct = (Math.random() * 12 + 3).toFixed(1);
      alerts.push({ id: `drop-${card.id}-${Date.now()}-${Math.random()}`, type: "pricedrop", card: card.name, cardId: card.id, game: card.game, message: `Price dropped ${pct}% in 24hrs`, price: Math.round(avg * (1 - pct / 100)), marketPrice: avg, platform: platforms[2], pctDiff: -parseFloat(pct), time: new Date(Date.now() - Math.random() * 86400000), severity: pct > 8 ? "high" : "low" });
    }
    if (Math.random() > 0.65) {
      const pct = (Math.random() * 15 + 5).toFixed(1);
      const lowPrice = Math.round(avg * (1 - pct / 200));
      const highPrice = Math.round(avg * (1 + pct / 200));
      alerts.push({ id: `arb-${card.id}-${Date.now()}-${Math.random()}`, type: "arbitrage", card: card.name, cardId: card.id, game: card.game, message: `${pct}% spread between ${platforms[0]} and ${platforms[1]}`, price: lowPrice, highPrice, marketPrice: avg, platform: platforms[0], platformHigh: platforms[1], pctDiff: parseFloat(pct), time: new Date(Date.now() - Math.random() * 1800000), severity: pct > 10 ? "high" : "medium" });
    }
  });
  return alerts.sort((a, b) => b.time - a.time);
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - date) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AlertCard({ alert, onCardClick }) {
  const cfg = { underpriced: { bg: "#eaf3de", border: "#c0dd97", color: "#27500a", label: "Underpriced" }, buyzone: { bg: "#e6f1fb", border: "#b5d4f4", color: "#0c447c", label: "Buy Zone" }, pricedrop: { bg: "#fcebeb", border: "#f7c1c1", color: "#791f1f", label: "Price Drop" }, arbitrage: { bg: "#faeeda", border: "#fac775", color: "#412402", label: "Arbitrage" } }[alert.type];
  const severityDot = { high: "#dc2626", medium: "#d97706", low: "#16a34a" }[alert.severity];
  return (
    <div onClick={() => onCardClick(alert.cardId)} style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}`, borderRadius: 10, padding: "11px 14px", cursor: "pointer", transition: "opacity 0.15s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{cfg.label}</span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: severityDot, display: "inline-block" }} />
        </div>
        <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>{timeAgo(alert.time)}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color, marginBottom: 2 }}>{alert.card}</div>
      <div style={{ fontSize: 12, color: cfg.color, opacity: 0.8, marginBottom: 6 }}>{alert.message}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>${alert.price.toLocaleString()}</span>
        {alert.type === "arbitrage" && alert.highPrice && <span style={{ fontSize: 12, color: cfg.color, opacity: 0.8 }}>→ ${alert.highPrice.toLocaleString()} on {alert.platformHigh}</span>}
        <span style={{ fontSize: 11, background: "rgba(0,0,0,0.08)", color: cfg.color, padding: "2px 7px", borderRadius: 20 }}>{alert.platform}</span>
        {alert.type !== "arbitrage" && <span style={{ fontSize: 11, color: cfg.color, opacity: 0.8 }}>{parseFloat(alert.pctDiff) > 0 ? "+" : ""}{alert.pctDiff}% vs ${alert.marketPrice.toLocaleString()} avg</span>}
      </div>
    </div>
  );
}

function ScannerView({ onCardClick }) {
  const [alerts, setAlerts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [filter, setFilter] = useState("all");
  const [autoScan, setAutoScan] = useState(false);
  const intervalRef = useRef(null);

  const runScan = useCallback(() => {
    setScanning(true);
    setTimeout(() => { setAlerts(generateScannerAlerts(CARDS)); setLastScan(new Date()); setScanning(false); }, 1800);
  }, []);

  useEffect(() => { runScan(); }, []);
  useEffect(() => {
    if (autoScan) intervalRef.current = setInterval(runScan, 30000);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [autoScan, runScan]);

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.type === filter);
  const counts = { underpriced: alerts.filter(a => a.type === "underpriced").length, buyzone: alerts.filter(a => a.type === "buyzone").length, pricedrop: alerts.filter(a => a.type === "pricedrop").length, arbitrage: alerts.filter(a => a.type === "arbitrage").length };
  const highSeverity = alerts.filter(a => a.severity === "high").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Market Scanner</h2>
            {highSeverity > 0 && <span style={{ background: "#fcebeb", color: "#791f1f", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{highSeverity} urgent</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{lastScan ? `Last scan: ${timeAgo(lastScan)} · ${alerts.length} signals` : "Scanning..."}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <div onClick={() => setAutoScan(!autoScan)} style={{ width: 32, height: 18, borderRadius: 9, background: autoScan ? "#16a34a" : "var(--color-border-secondary)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: autoScan ? 16 : 2, transition: "left 0.2s" }} />
            </div>
            Auto
          </div>
          <button onClick={runScan} disabled={scanning} style={{ fontSize: 12, padding: "6px 14px", fontWeight: 600, opacity: scanning ? 0.6 : 1 }}>{scanning ? "Scanning..." : "Scan now"}</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
        {[{ key: "underpriced", label: "Underpriced", bg: "#eaf3de", color: "#27500a" }, { key: "buyzone", label: "Buy Zone", bg: "#e6f1fb", color: "#0c447c" }, { key: "pricedrop", label: "Price Drop", bg: "#fcebeb", color: "#791f1f" }, { key: "arbitrage", label: "Arbitrage", bg: "#faeeda", color: "#412402" }].map(t => (
          <div key={t.key} onClick={() => setFilter(filter === t.key ? "all" : t.key)} style={{ background: filter === t.key ? t.bg : "var(--color-background-secondary)", border: filter === t.key ? `1.5px solid ${t.color}` : "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: filter === t.key ? t.color : "var(--color-text-primary)" }}>{counts[t.key]}</div>
            <div style={{ fontSize: 10, color: filter === t.key ? t.color : "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>{t.label}</div>
          </div>
        ))}
      </div>
      {scanning ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 12 }}>
          <div style={{ width: 28, height: 28, border: "2.5px solid var(--color-border-secondary)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Scanning {CARDS.length} cards across {PLATFORMS.length} platforms...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 13 }}>No signals for this filter</div>}
          {filtered.map(alert => <AlertCard key={alert.id} alert={alert} onCardClick={onCardClick} />)}
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = { Low: { bg: "#e6f3dd", color: "#2d6a1f", label: "Low Risk" }, Medium: { bg: "#fff3cd", color: "#856404", label: "Medium Risk" }, High: { bg: "#fde8e8", color: "#9b1c1c", label: "High Risk" } }[level] || { bg: "#f3f4f6", color: "#6b7280", label: level };
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.03em", textTransform: "uppercase" }}>{cfg.label}</span>;
}

function Sparkline({ data, width = 90, height = 32 }) {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d.price - min) / range) * height}`).join(" ");
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

function PriceChart({ sales }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !sales.length) return;
    const init = () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, { type: "line", data: { labels: sales.map(s => s.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })), datasets: [{ data: sales.map(s => s.price), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.07)", borderWidth: 2, pointRadius: 3, pointBackgroundColor: "#3b82f6", tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 8, font: { size: 10 }, color: "#6b7280" }, grid: { display: false } }, y: { ticks: { font: { size: 10 }, color: "#6b7280", callback: v => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v) }, grid: { color: "rgba(0,0,0,0.05)" } } } } });
    };
    if (window.Chart) init(); else { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"; s.onload = init; document.head.appendChild(s); }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [sales]);
  return <div style={{ position: "relative", width: "100%", height: 180 }}><canvas ref={canvasRef} /></div>;
}

function AIAnalysis({ card, sales, onClose }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function go() {
      const prices = sales.map(s => s.price);
      const latest = prices[prices.length - 1];
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const trend = ((latest - prices[0]) / prices[0] * 100).toFixed(1);
      const volatility = (Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100).toFixed(1);
      const prompt = `You are a trading card market analyst. Card: ${card.name} | Game: ${card.game} | Set: ${card.set} (${card.year})\nCurrent: $${latest.toLocaleString()} | Avg: $${avg.toLocaleString()} | Trend: ${trend}% | Volatility: ${volatility}%\nProvide: 1. RISK (Low/Medium/High) 2. BUY ZONE price range 3. SELL TARGET 4. 3-month OUTLOOK 5. KEY FACTORS (2-3 bullets). Under 200 words, plain text.`;
      try {
        const resp = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
        const data = await resp.json();
        setAnalysis(data.text || "Unable to load analysis.");
      } catch { setAnalysis("Unable to load analysis."); }
      setLoading(false);
    }
    go();
  }, [card, sales]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-secondary)", padding: 24, maxWidth: 540, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div><div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 2 }}>AI Analysis</div><div style={{ fontSize: 16, fontWeight: 600 }}>{card.name}</div></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)" }}>×</button>
        </div>
        {loading ? <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-secondary)", fontSize: 13, padding: "20px 0" }}><div style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Analyzing...<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div> : <div style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{analysis}</div>}
      </div>
    </div>
  );
}

function CardDetail({ card, onBack }) {
  const sales = generateFallbackSales(FALLBACK_PRICES[card.id]);
  const prices = sales.map(s => s.price);
  const latest = prices[prices.length - 1];
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const trend = ((latest - prices[0]) / prices[0] * 100);
  const volatility = Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100;
  const riskLevel = volatility > 12 ? "High" : volatility > 6 ? "Medium" : "Low";
  const buyZoneLow = Math.round(avg * 0.88), buyZoneHigh = Math.round(avg * 0.96), sellTarget = Math.round(avg * 1.18);
  const trendColor = trend >= 0 ? "#16a34a" : "#dc2626";
  const [showAI, setShowAI] = useState(false);
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, padding: "0 0 16px" }}>← Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div><div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.game} · {card.set} · {card.year}</div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{card.name}</h2></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><RiskBadge level={riskLevel} /><button onClick={() => setShowAI(true)} style={{ background: "var(--color-background-info)", color: "var(--color-text-info)", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>AI Analysis ↗</button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>
        <MetricCard label="Price" value={`$${latest.toLocaleString()}`} sub="last sale" />
        <MetricCard label="Average" value={`$${avg.toLocaleString()}`} sub="30d mean" />
        <MetricCard label="Trend" value={`${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`} color={trendColor} sub="change" />
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
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Recent Sales</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>{["Date","Price","Platform","Condition"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>)}</tr></thead>
            <tbody>{[...sales].reverse().slice(0, 10).map((s, i) => <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}><td style={{ padding: "6px 10px", color: "var(--color-text-secondary)" }}>{s.date.toLocaleDateString()}</td><td style={{ padding: "6px 10px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${s.price.toLocaleString()}</td><td style={{ padding: "6px 10px" }}>{s.platform}</td><td style={{ padding: "6px 10px" }}><span style={{ background: "var(--color-background-info)", color: "var(--color-text-info)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>{s.condition}</span></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      {showAI && <AIAnalysis card={card} sales={sales} onClose={() => setShowAI(false)} />}
    </div>
  );
}

function WatchlistTicker({ cards }) {
  const text = cards.map(c => `${c.name}  $${FALLBACK_PRICES[c.id].toLocaleString()}  ${Math.random() > 0.5 ? "▲" : "▼"} ${(Math.random() * 5 + 0.5).toFixed(1)}%`).join("   ·   ") + "   ·   ";
  return (
    <div style={{ overflow: "hidden", background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "6px 0", fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-block", animation: "ticker 50s linear infinite" }}>{text}{text}</div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("market");
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("All");
  const games = ["All", ...new Set(CARDS.map(c => c.game))];
  const filtered = CARDS.filter(c => (gameFilter === "All" || c.game === gameFilter) && c.name.toLowerCase().includes(search.toLowerCase()));
  const handleCardClick = (cardId) => { const card = CARDS.find(c => c.id === cardId); if (card) { setSelectedCard(card); setView("market"); } };

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 760, margin: "0 auto", paddingBottom: 60 }}>
      <WatchlistTicker cards={CARDS} />
      <div style={{ padding: "16px 16px 0" }}>
        {selectedCard ? <CardDetail card={selectedCard} onBack={() => setSelectedCard(null)} /> : (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "var(--color-background-secondary)", borderRadius: 10, padding: 4 }}>
              {[{ key: "market", label: "Market" }, { key: "scanner", label: "Scanner" }].map(t => (
                <button key={t.key} onClick={() => setView(t.key)} style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 7, background: view === t.key ? "var(--color-background-primary)" : "transparent", color: view === t.key ? "var(--color-text-primary)" : "var(--color-text-secondary)", cursor: "pointer", transition: "all 0.15s", boxShadow: view === t.key ? "0 0 0 0.5px var(--color-border-secondary)" : "none" }}>{t.label}</button>
              ))}
            </div>
            {view === "market" && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <h1 style={{ margin: "0 0 3px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Card Market Intelligence</h1>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Market scanner · AI risk analysis · Buy & sell signals</p>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..." style={{ flex: 1, minWidth: 180, fontSize: 13 }} />
                  <select value={gameFilter} onChange={e => setGameFilter(e.target.value)} style={{ fontSize: 13 }}>{games.map(g => <option key={g}>{g}</option>)}</select>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {filtered.map(card => {
                    const sales = generateFallbackSales(FALLBACK_PRICES[card.id]);
                    const prices = sales.map(s => s.price);
                    const latest = prices[prices.length - 1];
                    const trend = ((latest - prices[0]) / prices[0] * 100);
                    const volatility = Math.sqrt(prices.slice(1).reduce((sum, p, i) => sum + Math.pow((p - prices[i]) / prices[i], 2), 0) / (prices.length - 1)) * 100;
                    const riskLevel = volatility > 12 ? "High" : volatility > 6 ? "Medium" : "Low";
                    const trendColor = trend >= 0 ? "#16a34a" : "#dc2626";
                    return (
                      <div key={card.id} onClick={() => setSelectedCard(card)} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.game} · {card.year}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                          <div style={{ marginTop: 4 }}><RiskBadge level={riskLevel} /></div>
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
                {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 13 }}>No cards found</div>}
              </>
            )}
            {view === "scanner" && <ScannerView onCardClick={handleCardClick} />}
          </>
        )}
      </div>
    </div>
  );
}
