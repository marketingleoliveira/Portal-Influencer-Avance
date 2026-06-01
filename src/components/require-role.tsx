import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export function RequireRole({ role, children }: { role: "admin" | "influencer"; children: React.ReactNode }) {
  const { user, role: r, loading } = useAuth();
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDelayed(true), 50);
    return () => clearTimeout(t);
  }, []);
  if (loading || !delayed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (r !== role) return <Navigate to="/" />;
  return <>{children}</>;
}
