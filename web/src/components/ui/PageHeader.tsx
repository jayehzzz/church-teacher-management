"use client";

import * as React from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold truncate" style={{ color: 'var(--foreground)' }}>{title}</h1>
          <div className="h-1 w-20 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
        </div>
        {description ? (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}


