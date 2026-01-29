"use client";

import { authClient } from "@/lib/auth-client";
import {useState} from "react";

function emailCheck(email:string) {
    const atSplit = email.split('@');
    if(atSplit.length != 2){
        return false;
    }
    const dotSplit = atSplit[1].split('.');
    if(dotSplit.length < 2){
        return false;
    }
    return true;
}

function getReRoute(checked:boolean){
  if(checked){return "/dashboard"}
  else{return "/home"};
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");    
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // for role based login
  const [checked, setChecked] = useState(false);
  async function handleRegister(e:React.FormEvent) {
    e.preventDefault();
    // Presence check
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }
    // length check
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    // email format check
    if (!emailCheck(email)){
        setError("Invalid email format.");
        return;
    }
    setLoading(true);
    const { data, error: signUpError } = await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: getReRoute(checked),
      },
      {
        onError: (ctx) => {
          setError(ctx.error.message);
        },
      }
    );

    setLoading(false);
    if(signUpError){return;}
    setEmail(data?.user?.email ?? null);
    setSuccess(true);
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm"
      >
        <h1 className="mb-4 text-2xl font-semibold">Create an account</h1>

        {error && (
          <div className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-700">
            Account created successfully! Redirecting…
          </div>
        )}

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring"
            placeholder="John Doe"
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring"
            placeholder="john@example.com"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring"
            placeholder="Minimum 6 characters"
          />
        </div>

        <div className = "mt-4">
          <label className="flex items-left gap-2 text-sm">
            <span>Are you a seller?</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-4 w-4 align-middle"
            />
          </label>
        </div>


        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          {" "}
          <a href="/login" className="text-black underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
