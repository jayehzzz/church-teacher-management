"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const auth = getFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError("");
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      const next = searchParams?.get("next") || "/dashboard";
      router.replace(next);
    } catch (err: any) {
      const code: string | undefined = err?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setFormError("Invalid email or password");
      } else if (code === "auth/too-many-requests") {
        setFormError("Too many attempts. Please try again later.");
      } else {
        setFormError(err?.message ?? "Sign in failed");
      }
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Church Tracker
          </h1>
          <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
            Welcome back
          </p>
        </div>
        
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-8 rounded-2xl shadow-xl border"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)'
          }}
        >
          <h2 className="text-2xl font-semibold text-center" style={{ color: 'var(--card-foreground)' }}>
            Sign in
          </h2>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Email
            </label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--ring)'
              }}
              autoComplete="username email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm mt-1" style={{ color: 'var(--destructive)' }}>
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--ring)'
              }}
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm mt-1" style={{ color: 'var(--destructive)' }}>
                {errors.password.message}
              </p>
            )}
          </div>
          
          {formError ? (
            <div className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
              {formError}
            </div>
          ) : null}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)'
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}


