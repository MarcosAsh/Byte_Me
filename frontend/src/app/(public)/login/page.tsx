"use client";

import { useAuth } from "@/store/auth.store";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function emailCheck(email: string) {
  const atSplit = email.split("@");
  if (atSplit.length !== 2) return false;
  const dotSplit = atSplit[1].split(".");
  if (dotSplit.length < 2) return false;
  return true;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, login, init } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
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
      await login(email, password, isSeller ? "SELLER" : "ORG_ADMIN");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">BM</div>
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">
            Join Byte Me and start reducing food waste
          </p>
        </div>

        <form onSubmit={handleLogin} className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="space-y-4">
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
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="link">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
