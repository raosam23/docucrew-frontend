import { create } from "zustand";
import { User } from "@/types";
import api from "@/lib/api";

type AuthState = {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    setUser: (user: User | null) => set({ user }),
    login: async (email: string, password: string) => {
        try {
            const user: User = await api.post("api/auth/login", {
                json: {
                    email,
                    password,
                }
            }).json<User>();
            get().setUser(user);
        } catch (error: unknown) {
            console.error("Error logging in:", error);
            throw error as Error;
        }
    },
    register: async (email: string, password: string, name?: string) => {
        try {
            const user: User = await api.post("api/auth/register", {
                json: {
                    email,
                    password,
                    name,
                }
            }).json<User>();
            await get().login(user.email, password);
        } catch (error: unknown) {
            console.error("Error registering:", error);
            throw error as Error;
        }
    },
    logout: async () => {
        try {
            await api.post("api/auth/logout");
            set({ user: null });
        } catch (error) {
            console.error("Error logging out:", error);
            throw error as Error;
        }
    }
}));