import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInitialAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-avance.webp";

export const Route = createFileRoute("/setup")({ component: SetupPage });

function SetupPage() {
  const fn = useServerFn(createInitialAdmin);
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await fn({ data: { email, password, fullName, instagramHandle: null } });
    if (r.error) {
      toast.error(r.error);
      setBusy(false);
      return;
    }
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      toast.success("Admin criado. Faca login.");
      nav({ to: "/login" });
    } else {
      toast.success("Admin criado!");
      nav({ to: "/admin" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-accent px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Configuracao Inicial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie a primeira conta de administrador. Esta pagina so funciona uma vez.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Senha (min. 8 caracteres)</Label>
            <Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Criando..." : "Criar admin"}</Button>
        </form>
      </div>
    </div>
  );
}
