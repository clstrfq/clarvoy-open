import test from "node:test";
import assert from "node:assert/strict";
import { calculateVariance } from "./varianceEngine";

test("calculateVariance returns zeros for empty input", () => {
  const result = calculateVariance([]);
  assert.deepEqual(result, {
    mean: 0,
    stdDev: 0,
    cv: 0,
    isHighNoise: false,
    scoreCount: 0,
  });
});

test("calculateVariance is safe for n < 2", () => {
  const result = calculateVariance([7]);
  assert.equal(result.mean, 7);
  assert.equal(result.stdDev, 0);
  assert.equal(result.cv, 0);
  assert.equal(result.isHighNoise, false);
});

test("calculateVariance uses sample variance (n-1)", () => {
  const result = calculateVariance([1, 2, 3]);
  assert.equal(result.mean, 2);
  assert.equal(result.stdDev, 1);
  assert.equal(result.cv, 0.5);
});

test("calculateVariance never emits non-finite cv", () => {
  const result = calculateVariance([1, -1]);
  assert.equal(Number.isFinite(result.cv), true);
});
