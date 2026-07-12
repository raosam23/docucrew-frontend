"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSnackbar } from "notistack";

import LoadingState from "@/components/loading/LoadingState";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { User } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { setUser, user, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.get("api/auth/me").json<User>();
        setUser(user);
        setIsLoading(false);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [setUser, router]);

  const handleLogout = async () => {
    try {
      await logout();
      enqueueSnackbar("Logged out successfully", { variant: "success" });
      router.push("/login");
    } catch (error: unknown) {
      console.error("Error logging out:", error);
      enqueueSnackbar("Failed to log out", { variant: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <LoadingState message="Loading user data..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <nav className="flex items-center justify-between px-6 py-3 bg-background border-b border-border shrink-0">
        <h1 className="text-4xl font-bold text-foreground">DocuCrew</h1>
        <div className="flex items-center gap-4">
          <span className="text-base text-muted-foreground">
            {user?.name ?? user?.email ?? "User"}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>
      <div className="flex-1 min-h-0 flex-col">{children}</div>
    </div>
  );
}
