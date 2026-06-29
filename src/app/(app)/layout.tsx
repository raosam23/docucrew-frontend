"use client";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { setUser } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await api.get("api/auth/me").json<User>();
                setUser(user);
                setIsLoading(false);
            } catch {
                router.push("/login");
            }
        }
        checkAuth();
    }, [setUser, router]);
    if (isLoading) return null;
    return <>{children}</>;
}
