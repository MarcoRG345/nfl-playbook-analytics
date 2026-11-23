import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, LabelList, BarChart, Bar, Legend, ErrorBar } from "recharts";
import { TEAMS } from "@/lib/nfl-data";
import { SITUATIONS, airSamples, heatCells, raceCurves, turnDepth, type Situation } from "@/lib/tactical-data";

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "var(--foreground)" } };
const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };

export function SituationPicker({ value, onChange }: { value: Situation; onChange: (s: Situation) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(SITUATIONS) as Situation[]).map((k) => (
        <button key={k} onClick={() => onChange(k)} className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wide transition ${value === k ? "bg-primary text-primary-foreground glow" : "cyber-button"}`}>
          {SITUATIONS[k].label}
        </button>
      ))}
    </div>
  );
}

/** Métrica principal: número grande + dos barras. */
export function HeroMetric({ situation }: { situation: Situation }) {
  const sh = SITUATIONS[situation].shift;
  const win = 47 + sh * 0.4, lose = 29 - sh * 0.3;
  return (
    <div className="tactical-surface relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">La métrica · hallazgo</p>
      <div className="mt-2 grid items-end gap-6 md:grid-cols-[auto_1fr]">
        <div>
          <p className="font-display text-7xl leading-none text-primary">+{(win - lose).toFixed(0)}<span className="text-3xl"> pts</span></p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">de conversión cuando el receptor llega libre antes que la presión · {SITUATIONS[situation].label} · n={SITUATIONS[situation].n.toLocaleString()}</p>
        </div>
        <div className="space-y-3">
          {[["Gana el receptor", win, "bg-accent"], ["Gana la defensa", lose, "bg-destructive"]].map(([l, v, c]) => (
            <div key={l as string}>
              <div className="flex justify-between text-xs"><span>{l}</span><span className="font-mono">{(v as number).toFixed(0)}%</span></div>
              <div className="h-4 overflow-hidden rounded-full bg-secondary"><div key={situation} className={`animate-fill h-full rounded-full ${c}`} style={{ width: `${v}%` }} /></div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">IC90 bootstrap (1000 rep · semilla 42) · H1 exige ≥10 pts</p>
        </div>
      </div>
    </div>
  );
}

/** Gráfica estrella: dos curvas acumuladas y su cruce. */
export function RaceCurves({ situation }: { situation: Situation }) {
  const data = useMemo(() => raceCurves(situation), [situation]);
  const cross = data.find((d) => d.libre > 0 && d.presion >= d.libre * 0.62)?.t ?? 2.4;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 16, right: 12, left: -10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="t" unit="s" {...axis} /><YAxis unit="%" {...axis} domain={[0, 100]} />
        <Tooltip {...tip} />
        <ReferenceLine x={cross} stroke="var(--primary)" strokeDasharray="4 4" label={{ value: `Se decide · ${cross}s`, fill: "var(--primary)", fontSize: 11, position: "top" }} />
        <ReferenceLine x={2.5} stroke="var(--chart-4)" strokeOpacity={0.5} label={{ value: "Presión rápida 2.5s", fill: "var(--chart-4)", fontSize: 10, position: "insideBottomRight" }} />
        <Line dataKey="libre" name="% ya hay receptor libre" stroke="var(--accent)" strokeWidth={3} dot={false} animationDuration={1600} />
        <Line dataKey="presion" name="% ya llegó la presión" stroke="var(--destructive)" strokeWidth={3} dot={false} animationDuration={1900} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OutcomeBars() {
  const d = [{ r: "Gana receptor", c: 47, e: [4, 4], n: 2802 }, { r: "Gana defensa", c: 29, e: [3, 4], n: 1305 }, { r: "Sin presión", c: 31, e: [5, 5], n: 725 }];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={d} margin={{ left: -10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="r" {...axis} /><YAxis unit="%" {...axis} />
        <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="c" name="% conversión" fill="var(--primary)" fillOpacity={0.75} radius={[6, 6, 0, 0]}>
          <ErrorBar dataKey="e" stroke="var(--foreground)" width={6} />
          <LabelList dataKey="n" position="insideBottom" formatter={(v: number) => `n=${v}`} fill="var(--primary-foreground)" fontSize={10} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cuadrante: ¿culpa de la línea o de los receptores? */
export function TeamQuadrant({ team, setTeam }: { team: string; setTeam: (t: string) => void }) {
  const pts = TEAMS.map((t, i) => ({ team: t.team, x: +(2.2 + t.p1 * 0.6 + (i % 4) * 0.05).toFixed(2), y: Math.round(t.p1 * 90), n: t.n }));
  const mx = 2.61, my = 58;
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-2 grid-rows-2 p-8 text-[10px] uppercase tracking-widest text-muted-foreground/70">
        <span>Línea frágil · receptores rápidos</span><span className="text-right text-accent">Élite: tiempo y ruta</span>
        <span className="self-end text-destructive">Crisis: corregir todo</span><span className="self-end text-right">Línea firme · receptores lentos</span>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 16, left: -10, bottom: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" domain={[2.1, 3]} unit="s" name="Presión (mediana)" {...axis} />
          <YAxis type="number" dataKey="y" domain={[30, 75]} unit="%" name="Libre al llegar presión" {...axis} />
          <ZAxis dataKey="n" range={[60, 260]} />
          <ReferenceLine x={mx} stroke="var(--primary)" strokeOpacity={0.5} /><ReferenceLine y={my} stroke="var(--primary)" strokeOpacity={0.5} />
          <Tooltip {...tip} />
          <Scatter data={pts} fill="var(--primary)" onClick={(d: { team: string }) => setTeam(d.team)} className="cursor-pointer">
            <LabelList dataKey="team" position="top" fill="var(--foreground)" fontSize={10} />
          </Scatter>
          <Scatter data={pts.filter((p) => p.team === team)} fill="var(--accent)" shape="star" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TurnByDepth() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={turnDepth} margin={{ left: -10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="franja" {...axis} /><YAxis unit="yd" {...axis} />
        <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="recta" name="Sin giro" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="suave" name="Suave 30–60°" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="brusco" name="Brusco ≥60°" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Matriz ángulo × velocidad conservada (punto ideal). */
export function TurnMatrix() {
  const ang = ["0-30", "30-45", "45-60", "60-75", "75-90", "90+"], vel = ["<60%", "60-70", "70-80", "80-90", "90%+"];
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div>
      <div className="grid grid-cols-[48px_repeat(6,1fr)] gap-1 text-[10px]">
        {[...vel].reverse().map((v, vi) => (
          <div key={v} className="contents">
            <span className="self-center text-right font-mono text-muted-foreground">{v}</span>
            {ang.map((a, ai) => {
              const vIdx = vel.length - 1 - vi, n = 12 + ((ai * 7 + vIdx * 13) % 80);
              const pct = Math.round(30 + ai * 6 + vIdx * 7 - (ai > 3 && vIdx < 2 ? 18 : 0));
              const sparse = n < 20, id = `${a}-${v}`;
              return (
                <div key={a} onMouseEnter={() => setHover(`${a}° · vel ${v} · ${pct}% gana · n=${n}`)} onMouseLeave={() => setHover(null)}
                  className={`grid aspect-[1.6] place-items-center rounded font-mono transition hover:scale-110 hover:ring-1 hover:ring-primary ${sparse ? "bg-secondary text-muted-foreground" : ""}`}
                  style={sparse ? undefined : { background: `color-mix(in oklab, var(--primary) ${pct}%, var(--secondary))` }} data-id={id}>
                  {sparse ? "—" : `${pct}`}
                </div>
              );
            })}
          </div>
        ))}
        <span />{ang.map((a) => <span key={a} className="text-center font-mono text-muted-foreground">{a}°</span>)}
      </div>
      <p className="mt-2 h-4 text-xs text-primary">{hover ?? "Celda = % que ganó la carrera · gris = n<20"}</p>
    </div>
  );
}

/** Gráfica de pendiente P3. */
export function SlopeChart() {
  const rows = [{ l: "Corto 0-9", a: 3.3, b: 2.9, n: airSamples[0] }, { l: "Medio 10-19", a: 2.9, b: 1.9, n: airSamples[2] }, { l: "Largo 20+", a: 3.0, b: 1.1, n: airSamples[4] }];
  const y = (v: number) => 220 - v * 55;
  return (
    <svg viewBox="0 0 420 250" className="w-full">
      <line x1={90} x2={90} y1={20} y2={230} className="stroke-border" /><line x1={330} x2={330} y1={20} y2={230} className="stroke-border" />
      <line x1={70} x2={350} y1={y(3)} y2={y(3)} className="stroke-accent" strokeDasharray="4 4" strokeOpacity={0.5} />
      <text x={352} y={y(3) + 3} className="fill-accent text-[9px]">libre 3yd</text>
      <text x={90} y={14} textAnchor="middle" className="fill-muted-foreground text-[10px] uppercase">Al lanzar</text>
      <text x={330} y={14} textAnchor="middle" className="fill-muted-foreground text-[10px] uppercase">Al llegar</text>
      {rows.map((r, i) => (
        <g key={r.l}>
          <line x1={90} y1={y(r.a)} x2={330} y2={y(r.b)} className={i === 2 ? "stroke-destructive" : i === 1 ? "stroke-chart-4" : "stroke-accent"} strokeWidth={3} strokeDasharray="300" strokeDashoffset="300">
            <animate attributeName="stroke-dashoffset" from="300" to="0" dur={`${1 + i * 0.3}s`} fill="freeze" />
          </line>
          <circle cx={90} cy={y(r.a)} r={5} className="fill-foreground" /><circle cx={330} cy={y(r.b)} r={5} className="fill-foreground" />
          <text x={340} y={y(r.b) + 4} className="fill-foreground text-[10px]">{r.l} · −{(r.a - r.b).toFixed(1)}yd · n={r.n}</text>
        </g>
      ))}
    </svg>
  );
}

/** Embudo de síntesis. */
export function Funnel({ teamName }: { teamName: string }) {
  const t = TEAMS.find((x) => x.team === teamName)!;
  const steps = [["Jugadas decisivas", 1], ["Se liberó (≥3 yd)", t.p2 * 1.1], ["Ganó la carrera", t.p1 * t.p2 * 1.1], ["Siguió libre al llegar", t.p1 * t.p2 * t.p3 * 1.1], ["Convirtió", t.conv]] as const;
  const drops = steps.slice(1).map((s, i) => (steps[i]![1] - s[1]));
  const worst = drops.indexOf(Math.max(...drops.slice(0, 3)));
  return (
    <div className="space-y-1.5">
      {steps.map(([l, v], i) => (
        <div key={l} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs">{l}</span>
          <div className="flex-1"><div key={teamName} className={`animate-fill h-6 rounded ${i - 1 === worst ? "bg-destructive" : "bg-primary/70"}`} style={{ width: `${Math.max(4, Math.min(1, v) * 100)}%`, animationDelay: `${i * 0.12}s` }} /></div>
          <span className="w-16 shrink-0 text-right font-mono text-[11px]">{Math.round(Math.min(1, v) * 100)}% · {Math.round(Math.min(1, v) * t.n)}</span>
        </div>
      ))}
      <p className="pt-1 text-xs text-destructive">▲ Mayor fuga: «{steps[worst + 1]![0]}» · n={t.n}</p>
    </div>
  );
}

/** Mapas de calor M1–M3 sobre la cancha, relativos a la línea de golpeo. */
export function HeatField({ situation, team }: { situation: Situation; team: string }) {
  const [layer, setLayer] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const ti = Math.max(0, TEAMS.findIndex((t) => t.team === team));
  const cells = useMemo(() => heatCells(layer, ti, situation), [layer, ti, situation]);
  const vals = cells.map((c) => c.value), mn = Math.min(...vals), mx = Math.max(...vals);
  const cls = (v: number) => { const k = (v - mn) / (mx - mn || 1); return k > 0.8 ? "heat-peak" : k > 0.55 ? "heat-high" : k > 0.3 ? "heat-mid" : "heat-low"; };
  const L = [{ k: "M1 · Al llegar la presión", u: "% libres", f: (v: number) => `${v.toFixed(0)}%` }, { k: "M2 · Giros que liberan", u: "yd ganadas", f: (v: number) => `+${v.toFixed(1)}` }, { k: "M3 · Pérdida en el aire", u: "yd perdidas", f: (v: number) => `−${v.toFixed(1)}` }][layer]!;
  const c = sel != null ? cells[sel] : null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["M1 Presión", "M2 Giro", "M3 Aire"].map((l, i) => <button key={l} onClick={() => { setLayer(i); setSel(null); }} className={`rounded px-3 py-1 text-xs uppercase ${layer === i ? "bg-primary text-primary-foreground" : "cyber-button"}`}>{l}</button>)}
      </div>
      <svg viewBox="0 0 520 330" className="w-full rounded-lg bg-field">
        <line x1={40} x2={40} y1={0} y2={330} className="stroke-chart-5" strokeWidth={3} />
        <text x={44} y={14} className="fill-chart-5 text-[10px]">LOS</text>
        {cells.map((cl, i) => (
          <rect key={`${layer}-${i}`} x={46 + cl.col * 58} y={8 + cl.row * 52} width={54} height={48} rx={6}
            className={`${cl.n < 20 ? "heat-sparse" : cls(cl.value)} cursor-pointer transition-opacity hover:opacity-100 animate-rise ${sel === i ? "stroke-foreground" : ""}`} strokeWidth={2}
            opacity={sel === null || sel === i ? 0.9 : 0.5} style={{ animationDelay: `${(cl.col + cl.row) * 0.03}s` }} onClick={() => setSel(i)} />
        ))}
        {cells.map((cl, i) => cl.n >= 20 && <text key={`t${i}`} x={73 + cl.col * 58} y={36 + cl.row * 52} textAnchor="middle" className="pointer-events-none fill-foreground font-mono text-[10px]">{L.f(cl.value)}</text>)}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <text key={i} x={73 + i * 58} y={326} textAnchor="middle" className="fill-muted-foreground text-[9px]">+{i * 5}yd</text>)}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">{L.u}: <span className="h-2 w-5 rounded bg-primary/20" /><span className="h-2 w-5 rounded bg-primary/50" /><span className="h-2 w-5 rounded bg-primary" /> · gris n&lt;20</span>
        <span className="font-mono text-primary">{c ? `Celda ${c.col * 5}-${c.col * 5 + 5}yd · ${L.f(c.value)} · n=${c.n}` : `${L.k} · n=${cells.reduce((a, b) => a + b.n, 0)}`}</span>
      </div>
    </div>
  );
}