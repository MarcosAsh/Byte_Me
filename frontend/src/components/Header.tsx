"use client";

import Link from "next/link";
import {useState,useEffect} from "react";
import { useAuth } from "@/store/auth.store";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, init } = useAuth();

  useEffect(() => { init(); }, [init]);
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-bold">
            BM
          </div>
          <span className="text-xl font-bold">
            Byte <span className="text-[var(--primary)]">Me</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/bundles">Browse Bundles</NavLink>
          <NavLink href="/about">How It Works</NavLink>
          <NavLink href="/impact">Our Impact</NavLink>
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex gap-3">
          <Link href="/login" className="btn btn-secondary text-sm">
            Log In
          </Link>
          <Link href="/register" className="btn btn-primary text-sm">
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] px-4 py-4 space-y-4">
          <NavLink href="/bundles" onClick={() => setOpen(false)}>
            Browse Bundles
          </NavLink>
          <NavLink href="/about" onClick={() => setOpen(false)}>
            How It Works
          </NavLink>
          <NavLink href="/impact" onClick={() => setOpen(false)}>
            Our Impact
          </NavLink>

          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            {user ? (
              isOrgAdmin ? (
                <Link
                  href="/home"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full text-sm"
                >
                  Home
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full text-sm"
                >
                  Dashboard
                </Link>
              )
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary w-full text-sm"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block text-[var(--muted)] hover:text-[var(--primary)] font-medium"
    >
      {children}
    </Link>
  );
}
