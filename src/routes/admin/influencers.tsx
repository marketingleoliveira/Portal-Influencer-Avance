import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInfluencer, listInfluencers, updateInfluencer } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Search } from "lucide-react";

export const Route = createFileRoute("/admin/influencers")({
  component: () => <RequireRole role="admin"><InfluencersPage /></RequireRole>,
});

type Inf = {
  id: string;
  full_name: string | null;
  instagram_handle: string | null;
  phone: string | null;
  partnership_start_date: string | null;
  status: string | null;
  internal_notes: string | null;
  email: string;
  created_at: string;
};

function InfluencersPage() {
  const list = useServerFn(listInfluencers);
  const create = useServerFn(createInfluencer);
  const update = useServerFn(updateInfluencer);
  const [items, setItems] = useState<Inf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Inf | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [insta, setInsta] = useState("");
  const [phone, setPhone] = useState("");

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
    const r = await create({ data: { email, password, fullName, instagramHandle: insta || null, phone: phone || null } });
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Influencer cadastrada!");
    setEmail(""); setPassword(""); setFullName(""); setInsta(""); setPhone("");
    setShowForm(false);
    refresh();
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((i) =>
        (i.full_name ?? "").toLowerCase().includes(q) ||
        (i.instagram_handle ?? "").toLowerCase().includes(q) ||
        (i.phone ?? "").toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q),
      )
    : items;

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
              <Label htmlFor="t">Telefone</Label>
              <Input id="t" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
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

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, @instagram, telefone ou email..."
          className="pl-9"
        />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma influencer encontrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Instagram</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Início parceria</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">{i.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{i.instagram_handle ? `@${i.instagram_handle}` : "—"}</td>
                  <td className="px-4 py-3">{i.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {i.partnership_start_date ? new Date(i.partnership_start_date).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={i.status === "inativa" ? "secondary" : "default"}>
                      {i.status === "inativa" ? "Inativa" : "Ativa"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DetailsSheet
        inf={selected}
        onClose={() => setSelected(null)}
        onSaved={() => { refresh(); }}
        update={update}
      />
    </AppShell>
  );
}

function DetailsSheet({
  inf, onClose, onSaved, update,
}: {
  inf: Inf | null;
  onClose: () => void;
  onSaved: () => void;
  update: (args: { data: any }) => Promise<{ error: string | null }>;
}) {
  const [fullName, setFullName] = useState("");
  const [insta, setInsta] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState<"ativa" | "inativa">("ativa");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!inf) return;
    setFullName(inf.full_name ?? "");
    setInsta(inf.instagram_handle ?? "");
    setPhone(inf.phone ?? "");
    setStartDate(inf.partnership_start_date ?? "");
    setStatus((inf.status === "inativa" ? "inativa" : "ativa"));
    setNotes(inf.internal_notes ?? "");
  }, [inf]);

  if (!inf) return null;

  const save = async () => {
    setBusy(true);
    const r = await update({
      data: {
        userId: inf.id,
        fullName,
        instagramHandle: insta || null,
        phone: phone || null,
        partnershipStartDate: startDate || null,
        status,
        internalNotes: notes || null,
      },
    });
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Dados atualizados!");
    onSaved();
    onClose();
  };

  return (
    <Sheet open={!!inf} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{inf.full_name ?? inf.email}</SheetTitle>
          <SheetDescription>{inf.email}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Informações da influencer</h3>
            <div className="space-y-3">
              <div>
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label>Instagram (sem @)</Label>
                <Input value={insta} onChange={(e) => setInsta(e.target.value.replace(/^@/, ""))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Gestão interna</h3>
            <div className="space-y-3">
              <div>
                <Label>Data de início da parceria</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "ativa" | "inativa")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações internas</Label>
                <Textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pedidos, combinados, anotações sobre essa influencer..."
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
