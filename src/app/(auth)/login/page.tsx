"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useSnackbar } from "notistack";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ButtonLoader from "@/components/loading/ButtonLoader";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();
  const handleLogin = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      await login(email, password);
      enqueueSnackbar("Logged in successfully", { variant: "success" });
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Error logging in:", error);
      enqueueSnackbar("Failed to log in", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-10 space-y-4 bg-card border border-border shadow-sm">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[oklch(0.35_0.12_40)]">
            Welcome back
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(event.target.value)
              }
              required
              placeholder="name@example.com"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(event.target.value)
              }
              required
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? <ButtonLoader /> : "Sign in"}
          </Button>
        </form>
        {/* Footer */}
        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
          >
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
