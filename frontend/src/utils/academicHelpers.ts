import type { GradeSystem } from '../types/academic.types';

// Hardcoded KNEC fallback — mirrors backend get_grade_from_score
const gradeFromScore = (score: number): string => {
    if (score >= 78) return 'A';
    if (score >= 71) return 'A-';
    if (score >= 64) return 'B+';
    if (score >= 57) return 'B';
    if (score >= 50) return 'B-';
    if (score >= 43) return 'C+';
    if (score >= 36) return 'C';
    if (score >= 29) return 'C-';
    if (score >= 22) return 'D+';
    if (score >= 15) return 'D';
    if (score >= 8) return 'D-';
    if (score >= 1) return 'E';
    return 'Y';
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
        // Sort descending by min_score
        const sortedBoundaries = [...systemWithBoundaries.boundaries].sort((a, b) => b.min_score - a.min_score);
        for (const b of sortedBoundaries) {
            if (score >= b.min_score) {
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
