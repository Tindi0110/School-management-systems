export interface Student {
    id: number;
    full_name: string;
    admission_number: string;
    admission_date: string;
    date_of_birth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    level?: string;
    stream?: string;
    class_unit?: number;
    guardian_name?: string;
    guardian_phone?: string;
    photo?: string;
    status: 'ACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'TRANSFERRED' | 'INACTIVE';
    health_record?: {
        id: number;
        blood_group?: string;
        allergies?: string;
        chronic_conditions?: string;
        emergency_contact_name?: string;
        emergency_contact_phone?: string;
    };
}

export interface Parent {
    id: number;
    full_name: string;
    phone: string;
    email?: string;
    relationship: string;
    is_primary: boolean;
}

export interface DisciplineIncident {
    id: number;
    incident_date: string;
    offence_category: string;
    description: string;
    action_taken: string;
    reported_by_name?: string;
}

export interface StudentDocument {
    id: number;
    name: string;
    doc_type: string;
    file: string;
    uploaded_at: string;
}

export interface Activity {
    id: number;
    name: string;
    role: string;
    year: number;
    activity_type: string;
}
