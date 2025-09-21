"use client";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success"
  | "warning";

type ButtonSize = "sm" | "md" | "lg" | "xl";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

export function Button({
  className = "",
  variant = "primary",
  size = "lg",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:hover:scale-100";

  const sizeClass =
    size === "sm"
      ? "text-sm px-3 py-2"
      : size === "md"
      ? "text-base px-4 py-2.5"
      : size === "xl"
      ? "text-lg px-6 py-3.5"
      : "text-base px-5 py-3"; // lg default

  const variantClassMap: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)] hover:brightness-110",
    secondary:
      "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] hover:bg-[var(--muted)]",
    outline:
      "bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)]",
    ghost:
      "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] border border-transparent",
    destructive:
      "bg-[var(--destructive)] text-[var(--destructive-foreground)] border border-[var(--destructive)] hover:brightness-110",
    success:
      "bg-[var(--success)] text-[var(--success-foreground)] border border-[var(--success)] hover:brightness-110",
    warning:
      "bg-[var(--warning)] text-[var(--warning-foreground)] border border-[var(--warning)] hover:brightness-105",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const loadingClass = loading ? "cursor-wait" : "";

  return (
    <button
      className={`${base} ${sizeClass} ${variantClassMap[variant]} ${widthClass} ${loadingClass} hover:scale-[1.02] ${className}`}
      style={{ "--tw-ring-color": "var(--ring)" } as React.CSSProperties}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] placeholder:text-[color:var(--muted-foreground)] px-5 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${className}`}
      style={{ "--tw-ring-color": "var(--ring)" } as React.CSSProperties}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-base font-medium mb-2 text-[var(--foreground)] ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] px-5 py-3 text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${className}`}
      style={{ "--tw-ring-color": "var(--ring)" } as React.CSSProperties}
      {...props}
    />
  );
}

export function Checkbox({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={`h-6 w-6 rounded-md border border-[var(--border)] accent-[var(--accent)] transition-all duration-200 ${className}`}
      {...props}
    />
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
      style={{
        backgroundColor: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        borderColor: 'var(--border)'
      }}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "h-6 w-24" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--muted)] ${className}`}
      style={{ opacity: 0.7 }}
    />
  );
}

