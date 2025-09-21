"use client";

import { Moon, Sun, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button, Input } from "./ui";
import { Container } from "@/components/ui/Container";
import { useState } from "react";

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  return (
    <div 
      className="sticky top-0 z-10 backdrop-blur-lg border-b shadow-sm"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <Container className="px-8">
        <div className="h-20 flex items-center justify-between">
          <div className="font-bold text-xl" style={{ color: 'var(--foreground)' }}>
            Church Tracker
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Search size={16} className="opacity-70" />
                </span>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 w-64"
                />
              </div>
            </div>
            <Button
              onClick={toggle}
              variant="secondary"
              size="md"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span className="hidden sm:inline font-medium">
                {theme === "dark" ? "Light" : "Dark"} mode
              </span>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}


