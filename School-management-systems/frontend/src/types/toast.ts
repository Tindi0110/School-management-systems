export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}
