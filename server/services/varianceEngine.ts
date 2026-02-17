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

  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
  const stdDev = Math.sqrt(variance);

  const cv = mean !== 0 ? stdDev / mean : Infinity;

  return {
    mean: Number(mean.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    cv: Number(cv.toFixed(4)),
    isHighNoise: stdDev > threshold,
    scoreCount: n,
  };
}
