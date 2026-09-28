export type QualificationAnswer = string | string[] | number | null | undefined;

export interface ScoringQuestion {
  id: string;
  enabled: boolean;
  required: boolean;
  weight: number;
  pointsByOption: Readonly<Record<string, number>> | null;
}

export interface ScoreComponent {
  questionId: string;
  answered: boolean;
  weight: number;
  points: number | null;
  weightedPoints: number;
}

export interface QualificationScore {
  score: number;
  answeredCount: number;
  enabledCount: number;
  completionRate: number;
  components: ScoreComponent[];
}

export function classifyScore(score: number, mediumMinimum: number, highMinimum: number): 'low' | 'medium' | 'high' {
  if (![score, mediumMinimum, highMinimum].every(Number.isFinite) || score < 0 || score > 100 || mediumMinimum < 0 || highMinimum > 100 || mediumMinimum >= highMinimum) {
    throw new Error('Score thresholds must satisfy 0 ≤ medium minimum < high minimum ≤ 100');
  }
  return score >= highMinimum ? 'high' : score >= mediumMinimum ? 'medium' : 'low';
}

function answerPoints(answer: QualificationAnswer, mapping: Readonly<Record<string, number>>): number | null {
  if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) return null;
  const values = Array.isArray(answer) ? answer : [String(answer)];
  const points = values.map((value) => {
    const result = mapping[value];
    if (result === undefined || !Number.isFinite(result) || result < 0 || result > 100) {
      throw new Error(`Answer option "${value}" has no valid score mapping`);
    }
    return result;
  });
  return points.reduce((total, value) => total + value, 0) / points.length;
}

function isAnswered(answer: QualificationAnswer): boolean {
  return Array.isArray(answer) ? answer.some((value) => value.trim().length > 0) : typeof answer === 'number' ? Number.isFinite(answer) : typeof answer === 'string' && answer.trim().length > 0;
}

/** Deterministic weighted score; required unanswered questions count as zero, optional blank questions do not. */
export function calculateQualificationScore(
  questions: readonly ScoringQuestion[],
  answers: Readonly<Record<string, QualificationAnswer>>,
): QualificationScore {
  const enabled = questions.filter((question) => question.enabled);
  if (enabled.some((question) => !Number.isFinite(question.weight) || question.weight <= 0)) {
    throw new Error('Enabled question weights must be positive numbers');
  }
  let denominator = 0;
  let numerator = 0;
  let answeredCount = 0;
  const components = enabled.map((question): ScoreComponent => {
    const answer = answers[question.id];
    const answered = isAnswered(answer);
    const points = question.pointsByOption ? answerPoints(answer, question.pointsByOption) : null;
    if (answered) answeredCount += 1;
    if (question.pointsByOption && (question.required || answered)) {
      denominator += question.weight;
      numerator += question.weight * (points ?? 0);
    }
    return { questionId: question.id, answered, weight: question.weight, points, weightedPoints: question.weight * (points ?? 0) };
  });

  return {
    score: denominator === 0 ? 0 : Math.round(numerator / denominator),
    answeredCount,
    enabledCount: enabled.length,
    completionRate: enabled.length === 0 ? 0 : Math.round((answeredCount / enabled.length) * 100),
    components,
  };
}
