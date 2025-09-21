"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui";

export default function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Button onClick={() => signOut()} variant="destructive" size="md" fullWidth>
      <LogOut size={18} /> Sign out
    </Button>
  );
}


