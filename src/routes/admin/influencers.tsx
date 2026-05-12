import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInfluencer, listInfluencers } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin/influencers")({
  component: () => <RequireRole role="admin"><InfluencersPage /></RequireRole>,
});

type Inf = { id: string; full_name: string | null; instagram_handle: string | null; email: string; created_at: string };

function InfluencersPage() {
  const list = useServerFn(listInfluencers);
  const create = useServerFn(createInfluencer);
  const [items, setItems] = useState<Inf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [insta, setInsta] = useState("");

  const refresh = async () => {
    setLoading(true);
    const r = await list({});
    setItems((r.data as Inf[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await create({ data: { email, password, fullName, instagramHandle: insta || null } });
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Influencer cadastrada!");
    setEmail(""); setPassword(""); setFullName(""); setInsta("");
    setShowForm(false);
    refresh();
  };

  return (
    <AppShell title="Influencers">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <Button onClick={() => setShowForm((v) => !v)}>
          <UserPlus className="mr-2 h-4 w-4" /> {showForm ? "Cancelar" : "Nova influencer"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Cadastrar influencer</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="n">Nome completo</Label>
              <Input id="n" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="i">Instagram (sem @)</Label>
              <Input id="i" value={insta} onChange={(e) => setInsta(e.target.value.replace(/^@/, ""))} />
            </div>
            <div>
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p">Senha (min. 8)</Label>
              <Input id="p" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Criando..." : "Criar conta"}</Button>
        </form>
      )}

      <div className="rounded-2xl border bg-card shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma influencer cadastrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Instagram</th>
                <th className="px-4 py-3">Cadastrada em</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{i.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.email}</td>
                  <td className="px-4 py-3">{i.instagram_handle ? `@${i.instagram_handle}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(i.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
