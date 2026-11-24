// Datos sintéticos (inventados) para demo. Semilla fija para que la demo sea reproducible.
let s = 42;
const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const r = (a: number, b: number) => a + rnd() * (b - a);

export const TEAMS = ["KC","BUF","PHI","SF","DAL","BAL","MIA","DET","CIN","GB","LAR","NYJ","SEA","MIN","PIT","LV"].map((t) => {
  const p1 = r(0.42, 0.78), p2 = r(0.45, 0.8), p3 = r(0.5, 0.85);
  const links = { P1: p1, P2: p2, P3: p3 };
  const weak = (Object.entries(links).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "P1") as "P1"|"P2"|"P3";
  return { team: t, n: Math.round(r(38, 92)), p1, p2, p3, conv: p1 * p2 * p3 * r(0.75, 0.98), weak, epa: r(-0.35, 0.45) };
});

export const LEAGUE = {
  plays: 4832, freeAtPressure: 0.58, convWin: 0.47, convLose: 0.29, noPressure: 0.31,
  avgPressureSec: 2.61, avgFreeSec: 2.18, sepGainSharp: 1.42, sepGainSoft: 0.88, sepGainStraight: 0.41,
};

// Distribución de tiempos: reloj defensa vs reloj receptor (s)
export const clockDist = Array.from({ length: 24 }, (_, i) => {
  const t = 1 + i * 0.15;
  const g = (m: number, sd: number) => Math.exp(-((t - m) ** 2) / (2 * sd * sd));
  return { t: t.toFixed(2), defensa: +(g(2.6, 0.45) * 100 + r(0, 6)).toFixed(1), receptor: +(g(2.15, 0.4) * 100 + r(0, 6)).toFixed(1) };
});

export const convByDown = [
  { down: "3rd & 1-3", gano: 64, perdio: 41 }, { down: "3rd & 4-6", gano: 51, perdio: 30 },
  { down: "3rd & 7+", gano: 37, perdio: 18 }, { down: "4th & any", gano: 58, perdio: 33 },
];

export const turnTypes = [
  { tipo: "Sin giro", sep: 0.41, vel: 0.97, n: 1620 }, { tipo: "Suave 30-60°", sep: 0.88, vel: 0.84, n: 1890 },
  { tipo: "Brusco ≥60°", sep: 1.42, vel: 0.71, n: 1322 },
];

export const receivers = ["T. Hill","J. Jefferson","C. Lamb","A. St. Brown","J. Chase","D. Adams","P. Nacua","S. Diggs","A. Brown","D. Samuel","G. Wilson","M. Evans"].map((name) => ({
  name, giro: Math.round(r(25, 110)), sep: +r(0.3, 2.1).toFixed(2), vel: +r(0.6, 1).toFixed(2), n: Math.round(r(20, 70)),
}));

export const depthAir = [
  { prof: "0-5 yd", lanzar: 3.4, llegar: 3.1, libre: 82, comp: 78 }, { prof: "6-10", lanzar: 3.1, llegar: 2.5, libre: 71, comp: 66 },
  { prof: "11-15", lanzar: 2.9, llegar: 2.0, libre: 58, comp: 55 }, { prof: "16-20", lanzar: 2.8, llegar: 1.6, libre: 44, comp: 43 },
  { prof: "21+", lanzar: 3.0, llegar: 1.1, libre: 29, comp: 31 },
];

export const hypotheses = [
  { id: "H1", txt: "Ganar la carrera sube la conversión en 3er down ≥10 pts", val: "+18.2 pts", ci: "IC90 [14.1, 22.6]", n: 2911, ok: true },
  { id: "H2", txt: "Giro brusco genera más separación que ruta recta", val: "+1.01 yd", ci: "IC90 [0.83, 1.19]", n: 2942, ok: true },
  { id: "H3", txt: "Pases largos pierden más separación en el aire", val: "-1.9 vs -0.3 yd", ci: "IC90 [1.4, 2.0]", n: 1980, ok: true },
];

export const liveFeed = [
  "KC 3rd&4 · Receptor libre a 2.0s · Presión 2.7s · CONVIERTE",
  "BUF 3rd&8 · Presión 1.9s · Sack · Defensa gana",
  "PHI 4th&1 · Giro brusco 78° · +1.6 yd sep · CONVIERTE",
  "SF 3rd&6 · Libre al lanzar, cubierto al llegar (-2.3 yd) · INCOMPLETO",
  "DET 3rd&2 · Sin presión · Lectura rápida · CONVIERTE",
  "BAL 3rd&11 · Receptor libre no visto · Sack 3.1s",
];
