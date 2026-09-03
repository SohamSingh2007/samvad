"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signUp.email({
      name,
      email,
      password,
    });

    if (res.error) {
      setError(res.error.message || "An error occurred during signup.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Create an account</h1>
      <p className="text-sm text-stone-500 mb-8">Join Samvad to start making every meeting accessible.</p>

      {error && <div className="p-3 mb-6 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            type="text" 
            placeholder="John Doe" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-stone-900 hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
