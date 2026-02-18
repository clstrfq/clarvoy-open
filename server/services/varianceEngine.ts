export interface VarianceResult {
  mean: number;
  stdDev: number;
  cv: number;
  isHighNoise: boolean;
  scoreCount: number;
}

export function calculateVariance(scores: number[], threshold: number = 1.5): VarianceResult {
  if (scores.length === 0) {
    return { mean: 0, stdDev: 0, cv: 0, isHighNoise: false, scoreCount: 0 };
  }

  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  if (n < 2) {
    return {
      mean: Number(mean.toFixed(4)),
      stdDev: 0,
      cv: 0,
      isHighNoise: false,
      scoreCount: n,
    };
  }
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const safeMean = Math.abs(mean) < 1e-9 ? 0 : mean;
  const rawCv = safeMean === 0 ? 0 : stdDev / safeMean;
  const cv = Number.isFinite(rawCv) ? rawCv : 0;

  return {
    mean: Number(mean.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    cv: Number(cv.toFixed(4)),
    isHighNoise: stdDev > threshold,
    scoreCount: n,
  };
}
