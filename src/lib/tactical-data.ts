// Synthetic presentation data, not computed from NFL tracking or bootstrap samples.
export type Situation = 'decisivo' | 'normal' | 'corto' | 'final' | 'cerrado';
export const SITUATIONS = {
  decisivo: { label: '3.º / 4.º down', n: 4832, shift: 0 },
  normal: { label: '1.º / 2.º down', n: 7216, shift: 6 },
  corto: { label: '≤3 yd por avanzar', n: 1426, shift: 10 },
  final: { label: 'Últimos 2:00', n: 684, shift: -4 },
  cerrado: { label: '4.º cuarto · ±8 pts', n: 912, shift: -2 },
} as const;
export const isOpen = (separation: number) => separation >= 3;
export const isPressure = (distance: number) => distance <= 2;
export const directionVector = (degrees: number, speed: number) => {
  if (speed < 0.5) return { x: 0, y: 0 };
  const length = Math.min(speed, 4);
  return { x: Math.sin(degrees * Math.PI / 180) * length, y: -Math.cos(degrees * Math.PI / 180) * length };
};
export function raceCurves(situation: Situation) {
  const shift = SITUATIONS[situation].shift;
  return Array.from({ length: 21 }, (_, i) => {
    const t = i * 0.2;
    const cdf = (mid: number, max: number) => Math.max(0, (1 / (1 + Math.exp(-(t - mid) * 3.2)) - 1 / (1 + Math.exp(mid * 3.2))) * max);
    return { t: +t.toFixed(1), libre: +cdf(2.05 - shift * .015, 93).toFixed(1), presion: +cdf(2.55, 72).toFixed(1) };
  });
}
export const turnDepth = [
  { franja: '0–5 yd', recta: .38, suave: .79, brusco: 1.24, n: 1180 },
  { franja: '6–10 yd', recta: .42, suave: .91, brusco: 1.49, n: 1696 },
  { franja: '11–15 yd', recta: .46, suave: .96, brusco: 1.56, n: 1032 },
  { franja: '16+ yd', recta: .39, suave: .86, brusco: 1.39, n: 924 },
];
export const airSamples = [1140, 986, 824, 572, 310];
export function heatCells(layer: number, teamIndex: number, situation: Situation) {
  return Array.from({ length: 48 }, (_, i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const n = 9 + ((i * 37 + teamIndex * 11 + layer * 17 + SITUATIONS[situation].shift * 7 + 100) % 109);
    const center = Math.max(0, 1 - Math.abs(row - 2.5) / 3);
    const value = layer === 0 ? 28 + center * 22 + Math.sin(col * .7 + teamIndex) * 15 + SITUATIONS[situation].shift : layer === 1 ? .25 + center * .7 + SITUATIONS[situation].shift * .012 + Math.sin(col + teamIndex) * .2 + (col > 1 && col < 5 ? .55 : .1) : .15 + col * .23 + center * .3 + SITUATIONS[situation].shift * .008;
    return { col, row, n, value: +value.toFixed(2) };
  });
}