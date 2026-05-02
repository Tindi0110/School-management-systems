import type { GradeSystem } from '../types/academic.types';

// Hardcoded KNEC fallback — mirrors backend get_grade_from_score
const gradeFromScore = (score: number): string => {
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    return 'E';
};

export const calculateGrade = (score: number, gradeSystems: GradeSystem[], specificSystemId?: number | string | null) => {
    if (score === undefined || score === null || isNaN(score)) return '-';

    // 1. Try specific system
    let system = gradeSystems.find((s: any) => s.id === specificSystemId || s.id === parseInt(specificSystemId as string));

    // 2. Try default system
    if (!system) {
        system = gradeSystems.find((s: any) => s.is_default);
    }

    // 3. Fallback to first system
    if (!system && gradeSystems.length > 0) {
        system = gradeSystems[0];
    }

    const systemWithBoundaries = system as any;
    if (systemWithBoundaries && systemWithBoundaries.boundaries && systemWithBoundaries.boundaries.length > 0) {
        const sortedBoundaries = [...systemWithBoundaries.boundaries].sort((a, b) => b.min_score - a.min_score);
        for (const b of sortedBoundaries) {
            if (score >= b.min_score && score <= b.max_score) {
                return b.grade;
            }
        }
    }

    // 4. Final fallback: hardcoded KNEC scale (handles missing/incomplete boundaries)
    return gradeFromScore(score);
};

export const calculateMeanGrade = (results: any[], gradeSystems: GradeSystem[], specificSystemId?: number | string | null) => {
    if (!results || results.length === 0) return 'N/A';
    const validResults = results.filter(r => r.score !== null && r.score !== undefined && !isNaN(parseFloat(r.score)));
    if (validResults.length === 0) return 'N/A';
    const totalScore = validResults.reduce((sum, r) => sum + parseFloat(r.score), 0);
    const avg = totalScore / validResults.length;

    return calculateGrade(avg, gradeSystems, specificSystemId);
};
