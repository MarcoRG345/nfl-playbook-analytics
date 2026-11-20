import { describe, expect, it } from 'vitest';
import { directionVector, isOpen, isPressure, raceCurves } from '@/lib/tactical-data';

describe('Tracking definitions from CRISP-DM', () => {
  it('counts receivers free at 3 yards, not below', () => { expect(isOpen(3)).toBe(true); expect(isOpen(2.99)).toBe(false); });
  it('counts pressure at 2 yards, not above', () => { expect(isPressure(2)).toBe(true); expect(isPressure(2.01)).toBe(false); });
  it('points a 90 degree attacking player to the right', () => { expect(directionVector(90, 3).x).toBe(3); expect(Math.abs(directionVector(90, 3).y)).toBeLessThan(.001); });
  it('hides arrows below .5 yd/s and caps them at 4 yards', () => { expect(directionVector(90, .49).x).toBe(0); expect(directionVector(90, 7).x).toBe(4); });
  it('provides nondecreasing accumulated curves and different situation samples', () => {
    const data = raceCurves('decisivo');
    data.slice(1).forEach((p, i) => { expect(p.libre).toBeGreaterThanOrEqual(data[i]?.libre ?? 0); expect(p.presion).toBeGreaterThanOrEqual(data[i]?.presion ?? 0); });
    expect(raceCurves('normal')[10]?.libre).not.toBe(data[10]?.libre);
  });
});