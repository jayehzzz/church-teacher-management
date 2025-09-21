"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block px-5 py-3 rounded-xl border font-semibold transition-all duration-200 hover:scale-[1.02] 
        ${active
          ? "bg-[var(--sidebar-accent)] text-[var(--accent-foreground)] border-[var(--sidebar-accent)] shadow-sm"
          : "text-[var(--sidebar-foreground)] border-transparent hover:bg-[var(--muted)] hover:border-[var(--border)]"}
      `}
      style={{ "--tw-ring-color": "var(--ring)" } as React.CSSProperties}
    >
      {children}
    </Link>
  );
}


