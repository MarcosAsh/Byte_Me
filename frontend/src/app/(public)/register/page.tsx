"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";

function emailCheck(email: string) {
  const atSplit = email.split("@");
  if (atSplit.length !== 2) return false;
  const dotSplit = atSplit[1].split(".");
  if (dotSplit.length < 2) return false;
  return true;
}

function getReRoute(checked: boolean) {
  if (checked) return "/dashboard";
  else return "/home";
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSeller, setIsSeller] = useState(false);

  // for role based login
  const [checked, setChecked] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

    const { data, error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name,
      isSeller,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed");
      return;
    }

    setEmail(data?.user?.email ?? "");
    setSuccess(true);

    // optional redirect
    // window.location.href = getReRoute(checked);
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
          {success && (
            <div className="alert alert-success">
              Account created successfully!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="John Doe"
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
