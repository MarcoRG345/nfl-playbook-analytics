import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isOpen } from "@/lib/tactical-data";
import { Play, Pause, RotateCcw } from "lucide-react";

type Scenario = "receptor" | "defensa";
const DUR = 4.2;
const lerp = (a0: number | undefined, b0: number | undefined, t: number) => { const a = a0 ?? 0, b = b0 ?? 0; return a + (b - a) * Math.min(1, Math.max(0, t)); };

// Rutas: puntos [t, x, y] en yardas (campo 0-60 x, 0-53 y)
const routes = {
  receptor: [
    [[0, 20, 8], [1.4, 32, 8], [2.0, 33, 18], [3.2, 36, 26]], // slant brusco
    [[0, 20, 45], [2.2, 38, 45], [3.2, 40, 40]],
    [[0, 19, 30], [1.6, 26, 34], [3.2, 30, 38]],
  ],
  defensa: [
    [[0, 20, 8], [2.0, 34, 9], [3.2, 40, 10]],
    [[0, 20, 45], [2.2, 36, 46], [3.2, 41, 47]],
    [[0, 19, 30], [1.6, 25, 30], [3.2, 28, 31]],
  ],
} as const;
const at = (pts: readonly (readonly number[])[], t: number): [number, number] => {
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    if (!p || !q) continue;
    const pt = p[0] ?? 0, qt = q[0] ?? pt;
    if (t <= qt) { const k = qt === pt ? 0 : (t - pt) / (qt - pt); return [lerp(p[1], q[1], k), lerp(p[2], q[2], k)]; }
  }
  const l = pts.at(-1); return [l?.[1] ?? 0, l?.[2] ?? 0];
};

export function PlayField() {
  const [sc, setSc] = useState<Scenario>("receptor");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [turns, setTurns] = useState(true);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false); }, []);
  const raf = useRef(0), last = useRef(0), speedRef = useRef(1);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => {
    const step = (now: number) => {
      if (last.current) setT((p) => (p + ((now - last.current) / 1000) * speedRef.current) % (DUR + 0.8));
      last.current = now; raf.current = requestAnimationFrame(step);
    };
    if (playing) raf.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf.current); last.current = 0; };
  }, [playing]);

  const pressT = sc === "receptor" ? 2.7 : 1.9, freeT = sc === "receptor" ? 2.0 : 99;
  const qb: [number, number] = [14, 26.5];
  const rushK = Math.min(1, t / pressT);
  const rushers = ([[20, 18], [20, 26], [20, 33], [20, 40]] as [number, number][]).map(([x, y], i) => [lerp(x, qb[0] + 1.5, rushK * (i % 2 ? 0.92 : 1)), lerp(y, qb[1] + (i - 1.5) * 1.2, rushK)]);
  const recs = routes[sc].map((p) => at(p, Math.min(t, 3.2)));
  const dbs = recs.map(([x, y], i) => [x + (sc === "defensa" ? 1 : t >= 2.0 && i === 0 ? 3.5 : 2.2), y + (i === 0 && sc === "receptor" && t >= 2.0 ? -3.5 : 0.8)]);
  const throwT = sc === "receptor" ? 2.4 : 99;
  const ball = t > throwT ? (() => { const k = Math.min(1, (t - throwT) / 0.8); const tgt = recs[0] ?? qb; return [lerp(qb[0], tgt[0], k), lerp(qb[1], tgt[1], k) - Math.sin(k * Math.PI) * 4]; })() : qb;
  const X = (v?: number) => (v ?? 0) * 10, Y = (v?: number) => (v ?? 0) * 10;
  const clock = (lim: number) => Math.min(t, lim).toFixed(1);

  return (
    <div className="tactical-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg uppercase tracking-wide">Replay táctico · La carrera de los dos relojes</h3>
          <p className="text-xs text-muted-foreground">Tracking simulado · 10 Hz · 3.º y 6 · Q4 · 1:48 · n=1</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["receptor", "defensa"] as Scenario[]).map((k) => (
            <Button variant="ghost" size="sm" key={k} onClick={() => { setSc(k); setT(0); }} className={`rounded px-3 py-1.5 text-xs font-semibold uppercase ${sc === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              Gana {k}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setTurns(v => !v)} aria-pressed={turns} className="cyber-button">Giros</Button>
          {[0.5, 1, 2].map((v) => <Button variant="ghost" size="sm" key={v} onClick={() => setSpeed(v)} className={`rounded px-2 py-1.5 font-mono text-xs ${speed === v ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{v}×</Button>)}
          <Button variant="ghost" size="sm" onClick={() => setPlaying((p) => !p)} className="rounded bg-secondary p-1.5" aria-label={playing ? "Pausar jugada" : "Reproducir jugada"} title={playing ? "Pausar" : "Reproducir"}>{playing ? <Pause size={16} /> : <Play size={16} />}</Button>
          <Button variant="ghost" size="sm" onClick={() => setT(0)} className="rounded bg-secondary p-1.5" aria-label="Reiniciar" title="Reiniciar jugada"><RotateCcw size={16} /></Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        <svg viewBox="0 0 600 530" className="mx-auto max-h-[440px] w-full rounded-md bg-field" preserveAspectRatio="xMidYMid meet">
          <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" className="fill-primary" /></marker></defs>
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={i * 50} x2={i * 50} y1={0} y2={530} className="stroke-field-line" strokeWidth={i === 4 ? 3 : 1} />)}
          <line x1={X(20)} x2={X(20)} y1={0} y2={530} className="stroke-primary" strokeWidth={2} strokeDasharray="6 4" />
          <line x1={X(26)} x2={X(26)} y1={0} y2={530} className="stroke-chart-4/60" strokeWidth={2} />
          <circle cx={X(qb[0])} cy={Y(qb[1])} r={20} className="fill-none stroke-destructive" strokeWidth={2} opacity={rushK} strokeDasharray="4 3" />
          {routes[sc].map((p, i) => <polyline key={i} points={p.map((q) => `${X(q[1])},${Y(q[2])}`).join(" ")} className="fill-none stroke-foreground/30" strokeWidth={2} strokeDasharray="5 5" />)}
          {recs.map(([x, y], i) => {
            const defender = dbs[i] ?? [x, y];
            const d = Math.hypot(x - (defender[0] ?? 0), y - (defender[1] ?? 0)); const free = isOpen(d);
            return <g key={i}>
              <line x1={X(x)} y1={Y(y)} x2={X(defender[0])} y2={Y(defender[1])} className={free ? "stroke-accent" : "stroke-destructive"} strokeWidth={1.5} />
              {(() => { const [px, py] = at(routes[sc][i] ?? [], Math.max(0, Math.min(t, 3.2) - 0.2)); const dx = x - px, dy = y - py, m = Math.hypot(dx, dy); return m > 0.1 ? <line x1={X(x)} y1={Y(y)} x2={X(x + (dx / m) * Math.min(4, m * 5))} y2={Y(y + (dy / m) * Math.min(4, m * 5))} className="stroke-primary" strokeWidth={2.5} markerEnd="url(#arrow)" /> : null; })()}
              {turns && sc === "receptor" && i === 0 && t >= 1.4 && t <= 2.1 && <path d={`M${X(x)-20} ${Y(y)-8}q0 -28 28 -20`} className="fill-none stroke-primary" strokeWidth={3} markerEnd="url(#arrow)" />}
              <circle cx={X(x)} cy={Y(y)} r={11} className={free ? "fill-accent" : "fill-chart-5"} />
              <text x={X(x)} y={Y(y)+4} textAnchor="middle" className="fill-primary-foreground font-mono text-[10px]">{[10, 87, 11][i]}</text>
              <text x={X(x)} y={Y(y) - 16} textAnchor="middle" className="fill-foreground font-mono text-[11px]">{d.toFixed(1)}yd</text>
            </g>;
          })}
          {dbs.map(([x, y], i) => <rect key={i} x={X(x) - 9} y={Y(y) - 9} width={18} height={18} className="fill-destructive" transform={`rotate(45 ${X(x)} ${Y(y)})`} />)}
          {rushers.map(([x, y], i) => <path key={i} d={`M${X(x)} ${Y(y) - 10} L${X(x) + 10} ${Y(y) + 8} L${X(x) - 10} ${Y(y) + 8}Z`} className="fill-destructive" />)}
          <circle cx={X(qb[0])} cy={Y(qb[1])} r={12} className="fill-primary" />
          <text x={X(qb[0])} y={Y(qb[1]) + 4} textAnchor="middle" className="fill-primary-foreground font-display text-[10px] font-bold">QB</text>
          <ellipse cx={X(ball[0])} cy={Y(ball[1])} rx={6} ry={4} className="fill-chart-4 stroke-background" />
        </svg>
        <div className="flex flex-col gap-3">
          <Clock label="Reloj del receptor" sub="1er receptor libre ≥3yd" val={sc === "defensa" && t >= pressT ? "—" : t >= freeT ? freeT.toFixed(1) : clock(99)} done={t >= freeT} tone="accent" />
          <Clock label="Reloj de la defensa" sub="Rusher ≤2yd del QB" val={t >= pressT ? pressT.toFixed(1) : clock(99)} done={t >= pressT} tone="destructive" />
          <div className={`rounded-md p-3 text-center font-display text-xl uppercase transition-all ${t > Math.min(pressT, 3) ? (sc === "receptor" ? "bg-accent text-accent-foreground glow" : "bg-destructive text-destructive-foreground") : "bg-secondary text-muted-foreground"}`}>
            {t > Math.min(pressT, 3) ? (sc === "receptor" ? "✓ Convierte · +9 yd" : "✗ Sack · -7 yd") : "En juego…"}
          </div>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p><span className="text-primary">●</span> QB · <span className="text-accent">●</span> receptor libre · <span className="text-chart-5">●</span> cubierto</p>
            <p><span className="text-destructive">◆</span> cobertura · <span className="text-destructive">▲</span> pass rush</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        {[["Snap", 0], ["Giro", 1.4], ["Libre", freeT], ["Lanza", throwT], ["Presión", pressT], ["Llega", throwT + 0.8]].filter(([, v]) => (v as number) <= DUR).map(([label, value]) => <Button variant="ghost" size="sm" key={String(label)} onClick={() => { setT(Number(value)); setPlaying(false); }} className="h-7 px-2 font-mono text-[10px]">{label} · {Number(value).toFixed(1)}s</Button>)}
      </div>
      <div className="relative mt-1 h-3 text-[9px] uppercase text-muted-foreground">
        {[["Snap", 0], ["Giro", 1.4], ["Libre", freeT], ["Lanza", throwT], ["Presión", pressT], ["Llega", throwT + 0.8]].filter(([, v]) => (v as number) <= DUR).map(([l, v]) => <span key={l as string} className="absolute border-l border-primary h-2" style={{ left: `${((v as number) / DUR) * 100}%` }} title={String(l)} />)}
      </div>
      <input aria-label="Tiempo de la jugada" type="range" min={0} max={DUR} step={0.01} value={Math.min(t, DUR)} onChange={(e) => { setPlaying(false); setT(+e.target.value); }} className="w-full accent-primary" />
    </div>
  );
}

function Clock({ label, sub, val, done, tone }: { label: string; sub: string; val: string; done: boolean; tone: "accent" | "destructive" }) {
  return (
    <div className={`rounded-md border p-3 ${done ? (tone === "accent" ? "border-accent" : "border-destructive") : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-mono text-3xl font-bold ${tone === "accent" ? "text-accent" : "text-destructive"}`}>{val}s</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
