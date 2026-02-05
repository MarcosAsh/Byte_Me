import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--gray-900)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center font-bold">
              BM
            </div>
            <span className="text-xl font-bold">
              Byte <span className="text-[var(--primary)]">Me</span>
            </span>
          </Link>
          <p className="text-sm text-[var(--gray-400)] leading-relaxed">
            Turning surplus food into something useful. Less waste, more impact.
          </p>
        </div>

        <FooterColumn title="Platform">
          <FooterLink href="/bundles">Browse Bundles</FooterLink>
          <FooterLink href="/about">How It Works</FooterLink>
          <FooterLink href="/impact">Our Impact</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink>
        </FooterColumn>

        <FooterColumn title="Partners">
          <FooterLink href="/sellers">Become a Seller</FooterLink>
          <FooterLink href="/organizations">For Organizations</FooterLink>
          <FooterLink href="/dashboard">Dashboard</FooterLink>
          <FooterLink href="/support">Support</FooterLink>
        </FooterColumn>

        <FooterColumn title="Legal">
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/cookies">Cookies</FooterLink>
        </FooterColumn>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--gray-800)]">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-[var(--gray-400)]">
            © {new Date().getFullYear()} Byte Me. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block text-sm text-[var(--gray-400)] hover:text-[var(--primary)] transition"
    >
      {children}
    </Link>
  );
}
