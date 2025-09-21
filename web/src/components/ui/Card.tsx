"use client";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`rounded-3xl shadow-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-2xl ${className}`}
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--card-foreground)'
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`px-8 py-6 border-b ${className}`}
      style={{ borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-8 py-8 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`px-8 py-4 border-t ${className}`}
      style={{ borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}


