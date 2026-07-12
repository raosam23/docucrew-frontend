"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSnackbar } from "notistack";

import ButtonLoader from "@/components/loading/ButtonLoader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";

const RegisterPage = () => {
  const router = useRouter();
  const { register } = useAuthStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();
  const handleRegister = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      await register(email, password, name || undefined);
      enqueueSnackbar("Registered succesfully", {
        variant: "success",
      });
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Error registering:", error);
      enqueueSnackbar("Failed to register", {
        variant: "error",
      });
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
            Create your account
          </h1>
          <p className="text-lg text-muted-foreground">
            Start using DocuCrew today
          </p>
        </div>
        {/* Form */}
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              required
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>
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
            {isLoading ? <ButtonLoader /> : "Create Account"}
          </Button>
        </form>
        {/* Footer */}
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
