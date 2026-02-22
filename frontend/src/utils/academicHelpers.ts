import type { GradeSystem } from '../types/academic.types';

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

    return '-';
};

export const calculateMeanGrade = (results: any[], gradeSystems: GradeSystem[], specificSystemId?: number | string | null) => {
    if (!results || results.length === 0) return 'N/A';
    const totalScore = results.reduce((sum, r) => sum + parseFloat(r.score), 0);
    const avg = totalScore / results.length;

    return calculateGrade(avg, gradeSystems, specificSystemId);
};
