"use client";

import * as React from "react";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  max?: "lg" | "xl" | "2xl" | "3xl" | "full";
};

export function Container({ children, className = "", max = "2xl" }: ContainerProps) {
  const maxWidthClass =
    max === "lg" ? "max-w-5xl" :
    max === "xl" ? "max-w-6xl" :
    max === "2xl" ? "max-w-7xl" :
    max === "3xl" ? "max-w-[96rem]" :
    "max-w-none";

  return (
    <div className={`mx-auto ${maxWidthClass} w-full ${className}`}>
      {children}
    </div>
  );
}


