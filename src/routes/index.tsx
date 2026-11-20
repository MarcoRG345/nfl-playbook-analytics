import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { Activity, Crosshair, Radio, Shield, Swords, Timer, TrendingUp, Wind } from "lucide-react";
import { PlayField } from "@/components/nfl/PlayField";
import { LEAGUE, TEAMS, clockDist, convByDown, depthAir, hypotheses, liveFeed, receivers, turnTypes } from "@/lib/nfl-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Two Clocks · NFL Scout Analytics" },
      { name: "description", content: "Dashboard de scouting NFL: quién gana la carrera en 3er y 4to down, receptor o pass rush." },
      { property: "og:title", content: "Two Clocks · NFL Scout Analytics" },
      { property: "og:description", content: "Análisis de jugadas decisivas para coaches y scouts NFL." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }, labelStyle: { color: "var(--foreground)" } };
const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };
const TABS = [
  { id: "resumen", label: "Resumen", icon: Activity },
  { id: "p1", label: "P1 · Dos relojes", icon: Timer },
  { id: "p2", label: "P2 · El giro", icon: Crosshair },
  { id: "p3", label: "P3 · Balón en el aire", icon: Wind },
  { id: "s", label: "Síntesis · Eslabón débil", icon: Shield },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Dashboard() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [side, setSide] = useState<"ofensiva" | "defensiva">("ofensiva");
  const [team, setTeam] = useState("KC");
  return (
    <div className="min-h-screen">
      <LiveTicker />
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded bg-primary font-display font-bold text-primary-foreground">2C</div>
            <div><p className="font-display text-lg uppercase leading-none">Two Clocks</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Scout Analytics</p></div>
          </div>
          <div className="mb-5 grid grid-cols-2 rounded bg-secondary p-1 text-xs">
            {(["ofensiva", "defensiva"] as const).map((s) => (
              <button key={s} onClick={() => setSide(s)} className={`flex items-center justify-center gap-1 rounded py-1.5 uppercase ${side === s ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"}`}>
                {s === "ofensiva" ? <Swords size={12} /> : <Shield size={12} />}{s.slice(0, 3)}
              </button>
            ))}
          </div>
          <nav className="space-y-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${tab === t.id ? "border-l-2 border-primary bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50"}`}>
                <t.icon size={15} />{t.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded border border-border p-3 text-[11px] text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Filtro activo</p>3er y 4to down · sin "No Play" · n = {LEAGUE.plays.toLocaleString()}
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Temporada 2026 · Semana 11 · Vista {side}</p>
              <h1 className="font-display text-3xl uppercase md:text-4xl">{TABS.find((t) => t.id === tab)!.label}</h1>
            </div>
            <div className="flex flex-wrap gap-2 md:hidden">
              {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`rounded px-2 py-1 text-xs ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t.label.split(" ·")[0]}</button>)}
            </div>
            <select value={team} onChange={(e) => setTeam(e.target.value)} className="rounded border border-primary bg-card px-3 py-2 font-display uppercase">
              {TEAMS.map((t) => <option key={t.team}>{t.team}</option>)}
            </select>
          </header>
          <div key={tab + side} className="animate-rise">
            {tab === "resumen" && <Resumen side={side} team={team} />}
            {tab === "p1" && <P1 side={side} />}
            {tab === "p2" && <P2 />}
            {tab === "p3" && <P3 />}
            {tab === "s" && <Sintesis team={team} setTeam={setTeam} side={side} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function LiveTicker() {
  const items = [...liveFeed, ...liveFeed];
  return (
    <div className="flex items-center overflow-hidden border-b border-border bg-card text-xs">
      <div className="z-10 flex shrink-0 items-center gap-2 bg-destructive px-3 py-2 font-display uppercase text-destructive-foreground">
        <Radio size={13} /><span className="h-2 w-2 rounded-full bg-destructive-foreground animate-live" /> En vivo
      </div>
      <div className="flex animate-ticker gap-10 whitespace-nowrap px-4 py-2 font-mono text-muted-foreground">
        {items.map((f, i) => <span key={i}><span className="text-primary">▸</span> {f}</span>)}
      </div>
    </div>
  );
}

function useCount(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => { let raf = 0; const st = performance.now(); const f = (n: number) => { const k = Math.min(1, (n - st) / ms); setV(target * (1 - (1 - k) ** 3)); if (k < 1) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf); }, [target, ms]);
  return v;
}
function Kpi({ label, value, suffix = "", dec = 0, hint, tone = "primary" }: { label: string; value: number; suffix?: string; dec?: number; hint: string; tone?: "primary" | "accent" | "destructive" }) {
  const v = useCount(value);
  const c = { primary: "text-primary", accent: "text-accent", destructive: "text-destructive" }[tone];
  return (
    <div className="panel p-4 transition-transform hover:-translate-y-0.5 hover:glow">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-4xl ${c}`}>{v.toFixed(dec)}{suffix}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
const Panel = ({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) => (
  <div className={`panel p-4 ${className}`}>
    <h3 className="font-display text-base uppercase tracking-wide">{title}</h3>
    {sub && <p className="mb-3 text-xs text-muted-foreground">{sub}</p>}
    {children}
  </div>
);
const Insight = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2 rounded border-l-4 border-primary bg-primary/10 p-3 text-sm"><TrendingUp size={16} className="mt-0.5 shrink-0 text-primary" /><div>{children}</div></div>
);

function Resumen({ side, team }: { side: string; team: string }) {
  const t = TEAMS.find((x) => x.team === team)!;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Receptor libre al llegar presión" value={LEAGUE.freeAtPressure * 100} suffix="%" hint="Liga · n=4,832" tone="accent" />
        <Kpi label="Conversión si gana receptor" value={LEAGUE.convWin * 100} suffix="%" hint={`vs ${Math.round(LEAGUE.convLose * 100)}% si gana defensa`} />
        <Kpi label="Reloj defensa promedio" value={LEAGUE.avgPressureSec} dec={2} suffix="s" hint="Snap → rusher a ≤2 yd" tone="destructive" />
        <Kpi label={`Conversión ${team}`} value={t.conv * 100} dec={1} suffix="%" hint={`Eslabón débil: ${t.weak}`} />
      </div>
      <PlayField />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Hipótesis CRISP-DM" sub="Bootstrap 1000 rep · semilla 42" className="lg:col-span-2">
          <div className="space-y-2">
            {hypotheses.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded bg-secondary p-3">
                <span className="rounded bg-primary px-2 py-1 font-display text-primary-foreground">{h.id}</span>
                <p className="flex-1 text-sm">{h.txt}</p>
                <div className="text-right"><p className="font-mono text-sm text-accent">{h.val}</p><p className="text-[10px] text-muted-foreground">{h.ci} · n={h.n}</p></div>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase text-accent">{h.ok ? "Confirmada" : "Rechazada"}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recomendación" sub={`Vista ${side}`}>
          <div className="space-y-3 text-sm">
            {side === "ofensiva" ? <>
              <Insight>Diseñar rutas con <b>giro brusco antes de 2.0s</b>: +1.01 yd de separación.</Insight>
              <Insight>Evitar pases 21+ yd en 3rd&medio: solo <b>29%</b> sigue libre al llegar.</Insight>
            </> : <>
              <Insight>Presión antes de <b>2.2s</b> reduce la conversión rival a <b>24%</b>.</Insight>
              <Insight>Cobertura trail vs slants: el giro brusco es la principal fuga.</Insight>
            </>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function P1({ side }: { side: string }) {
  return (
    <div className="space-y-5">
      <Insight>{side === "ofensiva" ? "El receptor se libera en promedio 0.43s antes de que llegue la presión: la ventana existe, hay que verla." : "Tu reloj llega 0.43s tarde en promedio: acelerar la presión es la palanca #1."}</Insight>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Distribución de los dos relojes" sub="Densidad de tiempos (s) · liga">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={clockDist}>
              <defs>{["accent", "destructive"].map((c) => <linearGradient key={c} id={c} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={`var(--${c})`} stopOpacity={0.6} /><stop offset="1" stopColor={`var(--${c})`} stopOpacity={0} /></linearGradient>)}</defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="t" {...axis} /><YAxis {...axis} /><Tooltip {...tip} /><Legend />
              <Area dataKey="receptor" name="Receptor libre" stroke="var(--accent)" fill="url(#accent)" strokeWidth={2} animationDuration={1500} />
              <Area dataKey="defensa" name="Presión llega" stroke="var(--destructive)" fill="url(#destructive)" strokeWidth={2} animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Conversión según quién gana" sub="% conversión por situación">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={convByDown}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="down" {...axis} /><YAxis {...axis} unit="%" /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Legend />
              <Bar dataKey="gano" name="Gana receptor" fill="var(--accent)" radius={[4, 4, 0, 0]} animationDuration={1200} />
              <Bar dataKey="perdio" name="Gana defensa" fill="var(--destructive)" radius={[4, 4, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="Resultado de la carrera · liga" sub="Clasificación por jugada">
        <div className="flex h-10 overflow-hidden rounded font-display text-sm uppercase">
          {[["Gana receptor", 58, "bg-accent text-accent-foreground"], ["Gana defensa", 27, "bg-destructive text-destructive-foreground"], ["Sin presión", 15, "bg-chart-5 text-foreground"]].map(([l, v, c]) => (
            <div key={l as string} style={{ width: `${v}%` }} className={`animate-fill flex items-center justify-center ${c}`}>{l} {v}%</div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Del 58% ganado, 11% terminó en sack: receptor libre <b>no visto</b> → problema de lectura del QB.</p>
      </Panel>
    </div>
  );
}

function P2() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {turnTypes.map((t, i) => (
          <div key={t.tipo} className="panel p-4" style={{ animationDelay: `${i * 0.1}s` }}>
            <p className="text-xs uppercase text-muted-foreground">{t.tipo} · n={t.n}</p>
            <p className="font-display text-4xl text-primary">+{t.sep} yd</p>
            <p className="mb-2 text-xs text-muted-foreground">separación ganada 1s post-giro</p>
            <div className="h-2 rounded bg-secondary"><div className="animate-fill h-2 rounded bg-accent" style={{ width: `${t.vel * 100}%` }} /></div>
            <p className="mt-1 text-[11px] text-muted-foreground">Velocidad conservada {Math.round(t.vel * 100)}%</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Panel title="Mapa de receptores · Giro vs separación" sub="Tamaño = rutas decisivas · clic para detalle">
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="giro" name="Giro" unit="°" {...axis} /><YAxis dataKey="sep" name="Separación" unit="yd" {...axis} /><ZAxis dataKey="n" range={[80, 500]} />
              <Tooltip {...tip} formatter={(v) => v} labelFormatter={() => ""} />
              <Scatter data={receivers} onClick={(d) => setSel(d.name)} animationDuration={1200}>
                {receivers.map((r) => <Cell key={r.name} fill={r.name === sel ? "var(--primary)" : r.sep > 1.2 ? "var(--accent)" : "var(--chart-5)"} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top separadores" sub="MIN_N_RECEPTOR = 20">
          <div className="space-y-1.5">
            {[...receivers].sort((a, b) => b.sep - a.sep).slice(0, 8).map((r, i) => (
              <button key={r.name} onClick={() => setSel(r.name)} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${sel === r.name ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                <span className="w-4 font-mono text-xs opacity-60">{i + 1}</span><span className="flex-1">{r.name}</span><span className="font-mono">{r.sep}yd</span><span className="w-10 text-right font-mono text-xs opacity-70">{r.giro}°</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function P3() {
  return (
    <div className="space-y-5">
      <Insight>A partir de 16 yd la ventaja se evapora: se pierden <b>1.2–1.9 yd</b> en vuelo y el % de completos cae bajo 45%.</Insight>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Separación al lanzar vs al llegar" sub="yd promedio por profundidad">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={depthAir}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="prof" {...axis} /><YAxis {...axis} /><Tooltip {...tip} /><Legend />
              <Line dataKey="lanzar" name="Al lanzar" stroke="var(--accent)" strokeWidth={3} dot={{ r: 5 }} animationDuration={1500} />
              <Line dataKey="llegar" name="Al llegar" stroke="var(--destructive)" strokeWidth={3} dot={{ r: 5 }} animationDuration={1800} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="% sigue libre y % completos" sub="Por profundidad del pase">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depthAir}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="prof" {...axis} /><YAxis {...axis} unit="%" /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Legend />
              <Bar dataKey="libre" name="Sigue libre" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comp" name="Completo" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="Trayectoria animada del balón" sub="Más vuelo = más tiempo para que la defensa cierre">
        <svg viewBox="0 0 800 160" className="w-full">
          {depthAir.map((d, i) => {
            const x2 = 60 + (i + 1) * 140; const path = `M40 140 Q ${(40 + x2) / 2} ${140 - 30 - i * 22} ${x2} 140`;
            return <g key={d.prof}>
              <path d={path} className="fill-none stroke-border" strokeWidth={2} strokeDasharray="4 4" />
              <ellipse rx={7} ry={4} className="fill-chart-4"><animateMotion dur={`${1 + i * 0.4}s`} repeatCount="indefinite" path={path} rotate="auto" /></ellipse>
              <text x={x2} y={156} textAnchor="middle" className="fill-muted-foreground text-[11px]">{d.prof} · −{(d.lanzar - d.llegar).toFixed(1)}yd</text>
            </g>;
          })}
        </svg>
      </Panel>
    </div>
  );
}

function Sintesis({ team, setTeam, side }: { team: string; setTeam: (t: string) => void; side: string }) {
  const [sort, setSort] = useState<"conv" | "p1" | "p2" | "p3">("conv");
  const rows = useMemo(() => [...TEAMS].sort((a, b) => b[sort] - a[sort]), [sort]);
  const t = TEAMS.find((x) => x.team === team)!;
  const radar = [{ k: "P1 Carrera", v: t.p1 * 100 }, { k: "P2 Giro", v: t.p2 * 100 }, { k: "P3 Aire", v: t.p3 * 100 }, { k: "Conversión", v: t.conv * 150 }, { k: "EPA", v: (t.epa + 0.5) * 100 }];
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const heat = (v: number) => v > 0.68 ? "bg-accent/70 text-accent-foreground" : v > 0.55 ? "bg-chart-4/50" : "bg-destructive/60";
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Panel title="Cadena de la jugada decisiva por equipo" sub="% que pasa cada eslabón · clic en columna para ordenar · fila = selecciona">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-muted-foreground">
              <th className="p-2 text-left">#</th><th className="p-2 text-left">Equipo</th><th className="p-2">n</th>
              {(["p1", "p2", "p3", "conv"] as const).map((k) => <th key={k} onClick={() => setSort(k)} className={`cursor-pointer p-2 ${sort === k ? "text-primary" : ""}`}>{k === "conv" ? "Conv." : k.toUpperCase()} ↓</th>)}
              <th className="p-2">Eslabón débil</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.team} onClick={() => setTeam(r.team)} className={`cursor-pointer border-t border-border ${r.team === team ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                  <td className="p-2 font-mono text-xs">{i + 1}</td><td className="p-2 font-display">{r.team}</td><td className="p-2 text-center font-mono text-xs">{r.n}</td>
                  {[r.p1, r.p2, r.p3].map((v, j) => <td key={j} className="p-1"><div className={`rounded py-1 text-center font-mono text-xs ${heat(v)}`}>{pct(v)}</div></td>)}
                  <td className="p-2 text-center font-mono">{(r.conv * 100).toFixed(1)}%</td>
                  <td className="p-2 text-center"><span className="rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive">{r.weak}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title={`Perfil ${team}`} sub={`Vista ${side}`}>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radar}><PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="k" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Radar dataKey="v" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} animationDuration={900} /></RadarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Cadena" sub="Dónde se rompe la jugada">
          <div className="space-y-2">
            {[["P1 Gana la carrera", t.p1], ["P2 Gana separación", t.p2], ["P3 La conserva en el aire", t.p3]].map(([l, v]) => (
              <div key={l as string}>
                <div className="flex justify-between text-xs"><span>{l}</span><span className="font-mono">{pct(v as number)}</span></div>
                <div className="h-2 rounded bg-secondary"><div key={team} className={`animate-fill h-2 rounded ${(l as string).startsWith(t.weak) ? "bg-destructive" : "bg-accent"}`} style={{ width: pct(v as number) }} /></div>
              </div>
            ))}
            <Insight>{side === "ofensiva" ? `Corregir ${t.weak} primero: es donde ${team} pierde más jugadas.` : `Atacar el eslabón ${t.weak} de ${team} en el game plan.`}</Insight>
          </div>
        </Panel>
      </div>
    </div>
  );
}
