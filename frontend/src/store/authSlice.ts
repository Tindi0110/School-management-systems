import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
    user: any | null
    token: string | null
    isAuthenticated: boolean
}

const getUserFromStorage = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.error('Error parsing user from storage:', error);
        localStorage.removeItem('user'); // Clear corrupted data
        return null;
    }
};

const initialState: AuthState = {
    user: getUserFromStorage(),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.isAuthenticated = true
            localStorage.setItem('user', JSON.stringify(action.payload.user))
            localStorage.setItem('token', action.payload.token)
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            localStorage.removeItem('user')
            localStorage.removeItem('token')
        },
    },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
