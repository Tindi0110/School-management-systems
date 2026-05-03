export interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    description?: string;
}

export interface Term {
    id: number;
    year: number;
    year_name?: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export interface ClassUnit {
    id: number;
    name: string;
    level: string;
    stream: string;
    capacity: number;
    student_count?: number;
    teacher?: number;
    teacher_name?: string;
    class_teacher_name?: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    category?: string;
    group_name?: string;
    is_optional: boolean;
}

export interface Exam {
    id: number;
    name: string;
    term: number;
    term_name?: string;
    year: number;
    date_start: string;
    date_end: string;
    date_started?: string;
    is_published: boolean;
    is_active?: boolean;
    weighting?: number;
    grade_system?: number;
}

export interface StudentResult {
    id: number;
    student: number;
    exam: number;
    subject: number;
    subject_name?: string;
    score: number;
    grade?: string;
    comments?: string;
}

export interface GradeBoundary {
    id: number;
    system: number;
    grade: string;
    min_score: number;
    max_score: number;
    points: number;
    remark?: string;
}

export interface GradeSystem {
    id: number;
    name: string;
    description?: string;
    is_default: boolean;
    boundaries?: GradeBoundary[];
}
