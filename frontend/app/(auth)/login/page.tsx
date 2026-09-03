"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn.email({
      email,
      password,
    });

    if (res.error) {
      setError(res.error.message || "An error occurred during login.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome back</h1>
      <p className="text-sm text-stone-500 mb-8">Enter your credentials to access your account.</p>

      {error && <div className="p-3 mb-6 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-xs font-medium text-stone-500 hover:text-stone-900">Forgot password?</Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-stone-500">
        Don't have an account?{" "}
        <Link href="/signup" className="font-medium text-stone-900 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
