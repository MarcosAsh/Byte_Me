"use client";

import { useAuth } from "@/store/auth.store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function emailCheck(email: string) {
  const atSplit = email.split("@");
  if (atSplit.length !== 2) return false;
  const dotSplit = atSplit[1].split(".");
  if (dotSplit.length < 2) return false;
  return true;
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, init } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [location, setLocation] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      router.push(user.role === "SELLER" ? "/dashboard" : "/home");
    }
  }, [user, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!emailCheck(email)) {
      setError("Invalid email format.");
      return;
    }

    setLoading(true);

    try {
      await register(
        email,
        password,
        isSeller ? "SELLER" : "ORG_ADMIN",
        name,
        location || undefined
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">BM</div>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">
            Join Byte Me and start reducing food waste
          </p>
        </div>

        <form onSubmit={handleRegister} className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="label">Business Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your business or organization name"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="label">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input"
                placeholder="Your city or address"
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isSeller}
                onChange={(e) => setIsSeller(e.target.checked)}
                className="checkbox"
              />
              <span>I am a seller</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-6"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link href="/login" className="link">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
