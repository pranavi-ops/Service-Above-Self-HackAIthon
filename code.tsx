import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { desc, eq } from "drizzle-orm";
import {
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  HeartHandshake,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { db, dbReady, schema } from "./db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { DotPattern } from "@/components/ui/dot-pattern";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";

type User = typeof schema.users.$inferSelect;
type Opportunity = typeof schema.opportunities.$inferSelect;
type Reservation = typeof schema.reservations.$inferSelect;
type Review = typeof schema.reviews.$inferSelect;
type ChatMessage = typeof schema.chat_messages.$inferSelect;
type Feedback = typeof schema.feedback.$inferSelect;

type AccountType = "student" | "organizer";
type Channel = "everyone" | "students" | "organizers";

const villages = ["Hansen", "Cordes", "College Park", "Questa", "Altamont", "Bethany", "Wicklund"];
const channels: { id: Channel; label: string; help: string }[] = [
  { id: "everyone", label: "Everyone", help: "Community-wide updates and questions" },
  { id: "students", label: "Students", help: "Student-to-student coordination" },
  { id: "organizers", label: "Organizers", help: "Teachers, parents, and community leaders" },
];

const initialOpportunity = {
  title: "",
  description: "",
  village: "Hansen",
  location: "",
  event_date: "",
  start_time: "",
  end_time: "",
  hours: "1",
  capacity: "10",
  status: "published",
};

function wordLimit(value: string, max: number) {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, max).join(" ");
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem("sas-theme") !== "light");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("sas-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, setDark };
}

function useAppData() {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  const refresh = useCallback(async () => {
    await dbReady;
    const [u, o, r, rv, m, f] = await Promise.all([
      db.select().from(schema.users).orderBy(desc(schema.users.created_at)),
      db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.created_at)),
      db.select().from(schema.reservations).orderBy(desc(schema.reservations.created_at)),
      db.select().from(schema.reviews).orderBy(desc(schema.reviews.created_at)),
      db.select().from(schema.chat_messages).orderBy(desc(schema.chat_messages.created_at)),
      db.select().from(schema.feedback).orderBy(desc(schema.feedback.created_at)),
    ]);
    setUsers(u);
    setOpportunities(o);
    setReservations(r);
    setReviews(rv);
    setMessages(m);
    setFeedback(f);
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { ready, users, opportunities, reservations, reviews, messages, feedback, refresh };
}

function AnimatedOrbs() {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="orb-float absolute -left-12 top-10 h-48 w-48 rounded-full bg-sky/25 blur-3xl" />
    <div className="orb-float-delayed absolute right-8 top-24 h-36 w-36 rounded-full bg-peach/30 blur-3xl" />
    <div className="orb-drift absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
  </div>;
}

function ShinyLabel({ children }: { children: React.ReactNode }) {
  return <span className="shiny-label">{children}</span>;
}

function VillageMarquee() {
  return <div className="relative overflow-hidden rounded-3xl border bg-card/70 py-3 shadow-sm">
    <div className="village-track flex w-max gap-3 px-3">
      {[...villages, ...villages, ...villages].map((v, index) => <div key={`${v}-${index}`} className="inline-flex items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-sm font-bold shadow-sm">
        <span className="h-2 w-2 rounded-full bg-sky" />{v}
      </div>)}
    </div>
  </div>;
}

function RoleCard({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return <Card className="group relative overflow-hidden rounded-3xl bg-card/85 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky via-primary to-peach" />
    <CardContent className="p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary transition group-hover:scale-110"><Icon className="h-6 w-6" /></div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </CardContent>
  </Card>;
}

function EmptyState({ icon: Icon, title, text, action }: { icon: typeof Search; title: string; text: string; action?: React.ReactNode }) {
  return <div className="rounded-3xl border border-dashed bg-card/60 p-8 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="h-6 w-6" /></div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>;
}

function Shell({ children, user, setUser, dark, setDark }: { children: React.ReactNode; user: User | null; setUser: (u: User | null) => void; dark: boolean; setDark: (v: boolean) => void }) {
  const nav = user ? [
    ["/", "Home", HeartHandshake],
    ["/impact", "Impact", Award],
    ["/opportunities", "Opportunities", CalendarDays],
    ["/leaderboards", "Leaderboards", Trophy],
    ["/chat", "Chat", MessageCircle],
    ["/feedback", "Feedback", ClipboardCheck],
  ] as const : [];
  return <div className="min-h-screen overflow-hidden bg-background text-foreground">
    <DotPattern className="fixed inset-0 -z-10 opacity-25 [mask-image:radial-gradient(760px_circle_at_center,white,transparent)]" />
    <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><HeartHandshake className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-primary">SERVICE ABOVE SELF</p>
            <h1 className="text-lg font-bold leading-tight">Mountain House</h1>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map(([href, label, Icon]) => <NavLink key={href} to={href} className={({ isActive }) => cn("rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground", isActive && "bg-secondary text-foreground") }><span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span></NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
          {user && <Button variant="outline" onClick={() => { localStorage.removeItem("sas-user-id"); setUser(null); }}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>}
        </div>
      </div>
      {user && <div className="border-t lg:hidden"><div className="flex gap-1 overflow-x-auto px-4 py-2">{nav.map(([href, label, Icon]) => <NavLink key={href} to={href} className={({ isActive }) => cn("whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium", isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground") }><Icon className="mr-1 inline h-4 w-4" />{label}</NavLink>)}</div></div>}
    </header>
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">{children}</main>
  </div>;
}

function AuthPage({ onUser, refresh, users }: { onUser: (u: User) => void; refresh: () => Promise<void>; users: User[] }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", account_type: "student" as AccountType, village: "Hansen" });
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); await dbReady;
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password) return setError("Email and password are required.");
    const existing = users.find((u) => u.email.toLowerCase() === email);
    const password_hash = await hashPassword(form.password);
    if (mode === "login") {
      if (!existing) return setError("No account exists for that email address.");
      if (existing.password_hash !== password_hash) return setError("Incorrect password. Please try again.");
      localStorage.setItem("sas-user-id", String(existing.id)); onUser(existing); navigate("/"); return;
    }
    if (!form.name.trim()) return setError("Please enter your name.");
    if (existing) return setError("An account with this email already exists. Please log in instead.");
    const [created] = await db.insert(schema.users).values({ email, password_hash, name: form.name.trim(), account_type: form.account_type, village: form.village, phone: "", description: "", profile_picture: "", reminder_enabled: false }).returning();
    localStorage.setItem("sas-user-id", String(created.id)); await refresh(); onUser(created); navigate("/");
  }

  return <div className="space-y-8">
    <BlurFade><section className="relative overflow-hidden rounded-[2rem] border bg-card/80 p-6 text-center shadow-2xl md:p-10">
      <AnimatedOrbs />
      <div className="relative mx-auto max-w-4xl space-y-5">
        <Badge className="rounded-full bg-peach text-navy hover:bg-peach"><ShinyLabel>Seven villages. One service community.</ShinyLabel></Badge>
        <h2 className="text-4xl font-black tracking-tight md:text-7xl">Village Help Center</h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">A more beautiful home for Mountain House service—students find volunteer work, organizers publish events, and verified impact moves across every village.</p>
        <div className="mx-auto max-w-3xl"><VillageMarquee /></div>
      </div>
    </section></BlurFade>
    <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard icon={Users} title="For Students" text="Browse nearby service opportunities, reserve your spot, complete shifts, and watch verified hours lift your profile." />
          <RoleCard icon={ShieldCheck} title="For Organizers" text="Create listings, see student signups, verify completed hours, and keep the whole village loop moving." />
        </div>
        <Card className="relative overflow-hidden rounded-3xl bg-navy text-white shadow-2xl">
          <AnimatedOrbs />
          <CardContent className="relative p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky">Live community impact</p>
            <h3 className="mt-2 text-3xl font-black">Built around real service, not placeholder stats.</h3>
            <p className="mt-2 text-sm text-white/70">Leaderboards and village totals stay empty until organizers verify completed reservations.</p>
          </CardContent>
        </Card>
      </div>
      <Card className="relative overflow-hidden border-primary/20 shadow-2xl shadow-primary/10"><BorderBeam /><CardHeader><CardTitle>{mode === "signup" ? "Create your account" : "Welcome back"}</CardTitle><p className="text-sm text-muted-foreground">Use a unique email and password. Choose student or organizer access.</p></CardHeader><CardContent>
      {error && <div role="alert" className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form className="space-y-4" onSubmit={submit}>
        {mode === "signup" && <><div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Account type</Label><Select value={form.account_type} onValueChange={(v: AccountType) => setForm({ ...form, account_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="organizer">Organizer</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Village</Label><Select value={form.village} onValueChange={(v) => setForm({ ...form, village: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{villages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div></div></>}
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div>
        <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" /></div>
        <Button className="w-full" type="submit">{mode === "signup" ? "Create account" : "Log in"}</Button>
      </form>
      <Button variant="link" className="mt-3 w-full" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>{mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}</Button>
    </CardContent></Card>
    </div>
  </div>;
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Trophy; label: string; value: number; note: string }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-secondary p-3 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-black"><NumberTicker value={value} decimalPlaces={value % 1 ? 1 : 0} /></p><p className="text-xs text-muted-foreground">{note}</p></div></CardContent></Card>;
}

function Dashboard({ user, data, refresh }: { user: User; data: ReturnType<typeof useAppData>; refresh: () => Promise<void> }) {
  const navigate = useNavigate();
  const mine = data.reservations.filter((r) => r.student_id === user.id);
  const verified = mine.reduce((sum, r) => sum + (r.status === "verified" ? r.verified_hours : 0), 0);
  const posted = data.opportunities.filter((o) => o.organizer_id === user.id);
  const upcoming = mine.filter((r) => ["reserved", "completed"].includes(r.status)).map((r) => data.opportunities.find((o) => o.id === r.opportunity_id)).filter(Boolean) as Opportunity[];
  return <div className="space-y-8"><section className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]"><MagicCard className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-xl"><div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky/20 blur-3xl" /><div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><Badge className="mb-3 rounded-full bg-peach text-navy hover:bg-peach">{user.account_type === "student" ? "Student impact profile" : "Organizer command center"}</Badge><h2 className="text-3xl font-black tracking-tight md:text-5xl">Welcome, {user.name}.</h2><p className="mt-2 max-w-2xl text-muted-foreground">{user.account_type === "student" ? "Reserve shifts, track verified hours, review activities, and connect with your village community." : "Publish opportunities, manage reservations, verify hours, and celebrate student service."}</p><div className="mt-5 flex flex-wrap gap-2">{villages.map((v) => <span key={v} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", user.village === v ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{v}</span>)}</div></div><div className="flex flex-col gap-2"><ProfileDialog user={user} refresh={refresh} onUpdated={() => window.location.reload()} /><Button asChild variant="outline"><Link to="/impact">Open impact view</Link></Button></div></div></MagicCard><Card className="overflow-hidden"><CardHeader className="bg-secondary/60"><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Account snapshot</CardTitle></CardHeader><CardContent className="space-y-3 p-5 text-sm"><p><b>Type:</b> {user.account_type}</p><p><b>Village:</b> {user.village}</p><p><b>Email:</b> {user.email}</p><p><b>Reminder:</b> {user.reminder_enabled ? "30 minutes before reserved shifts" : "Off"}</p></CardContent></Card></section>
  <div className="grid gap-4 md:grid-cols-3"><StatCard icon={Award} label="Verified hours" value={user.account_type === "student" ? verified : data.reservations.filter((r) => posted.some((o) => o.id === r.opportunity_id) && r.status === "verified").reduce((s, r) => s + r.verified_hours, 0)} note="From real completed reservations" /><StatCard icon={CalendarDays} label={user.account_type === "student" ? "Upcoming shifts" : "Published listings"} value={user.account_type === "student" ? upcoming.length : posted.filter((o) => o.status === "published").length} note="No fabricated activity" /><StatCard icon={Users} label={user.account_type === "student" ? "Reservations" : "Student signups"} value={user.account_type === "student" ? mine.length : data.reservations.filter((r) => posted.some((o) => o.id === r.opportunity_id)).length} note="Live from your database" /></div>
  <VillageImpactRail data={data} />
  {user.account_type === "organizer" ? <OrganizerPanel user={user} data={data} refresh={refresh} /> : <StudentHome user={user} data={data} navigate={navigate} />}</div>;
}

function ProfileDialog({ user, refresh }: { user: User; refresh: () => Promise<void>; onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", description: user.description || "", village: user.village, reminder_enabled: user.reminder_enabled, profile_picture: user.profile_picture || "" });
  async function fileToDataUrl(file: File) { return new Promise<string>((resolve, reject) => { if (file.size > 2_000_000) reject(new Error("Please choose an image under 2 MB.")); const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); }
  async function save() { await db.update(schema.users).set({ ...form, description: wordLimit(form.description, 10) }).where(eq(schema.users.id, user.id)); await refresh(); setOpen(false); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><UserRound className="mr-2 h-4 w-4" />Edit profile</Button></DialogTrigger><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader><div className="space-y-4"><div className="flex items-center gap-4">{form.profile_picture ? <img src={form.profile_picture} alt="Profile" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><UserRound /></div>}<Label className="cursor-pointer"><span className="inline-flex items-center rounded-md border px-3 py-2 text-sm"><Upload className="mr-2 h-4 w-4" />Upload photo</span><Input className="sr-only" type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, profile_picture: await fileToDataUrl(f) }); }} /></Label></div><div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label>Village</Label><Select value={form.village} onValueChange={(v) => setForm({ ...form, village: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{villages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Optional notification phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(209) 555-0123" /></div><div className="space-y-2"><Label>Short description — 10 words max</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: wordLimit(e.target.value, 10) })} /></div>{user.account_type === "student" && <label className="flex items-center gap-3 rounded-2xl border p-3 text-sm"><input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setForm({ ...form, reminder_enabled: e.target.checked })} /> Remind me 30 minutes before reserved shifts</label>}<Button onClick={save} className="w-full">Save profile</Button></div></DialogContent></Dialog>;
}

function StudentHome({ user, data, navigate }: { user: User; data: ReturnType<typeof useAppData>; navigate: (path: string) => void }) {
  const published = data.opportunities.filter((o) => o.status === "published").slice(0, 3);
  return <section className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="text-2xl font-black tracking-tight">Next ways to help</h3><p className="text-sm text-muted-foreground">Published opportunities appear here immediately after organizers post them.</p></div><Button variant="outline" onClick={() => navigate("/opportunities")}>Browse all opportunities</Button></div>{published.length ? <div className="grid gap-4 md:grid-cols-3">{published.map((o) => <OpportunityCard key={o.id} opportunity={o} data={data} user={user} compact />)}</div> : <EmptyState icon={CalendarDays} title="No published opportunities yet" text="Published organizer listings will appear here immediately. Check back soon or ask an organizer to create one." />}</section>;
}

function impactMetrics(data: ReturnType<typeof useAppData>) {
  const verifiedReservations = data.reservations.filter((r) => r.status === "verified");
  const verifiedHours = verifiedReservations.reduce((sum, r) => sum + r.verified_hours, 0);
  const activeStudents = new Set(verifiedReservations.map((r) => r.student_id)).size;
  const published = data.opportunities.filter((o) => o.status === "published").length;
  const villageTotals = villages.map((v) => ({ village: v, hours: verifiedReservations.filter((r) => data.users.find((u) => u.id === r.student_id)?.village === v).reduce((s, r) => s + r.verified_hours, 0) }));
  return { verifiedHours, activeStudents, published, villageTotals };
}

function VillageImpactRail({ data }: { data: ReturnType<typeof useAppData> }) {
  const { villageTotals } = impactMetrics(data);
  const max = Math.max(...villageTotals.map((v) => v.hours), 1);
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{villageTotals.map((v, index) => <div key={v.village} className="group rounded-3xl border bg-card/80 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ animationDelay: `${index * 80}ms` }}><div className="mb-3 flex items-center justify-between gap-2"><p className="font-bold">{v.village}</p><Badge variant="secondary">{v.hours} hrs</Badge></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="impact-bar h-2 rounded-full bg-gradient-to-r from-sky via-primary to-peach" style={{ width: `${(v.hours / max) * 100}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Verified service only</p></div>)}</div>;
}

function ImpactPage({ data }: { data: ReturnType<typeof useAppData> }) {
  const metrics = impactMetrics(data);
  const recentVerified = data.reservations.filter((r) => r.status === "verified").slice(0, 5);
  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-[2.5rem] border bg-card/80 p-6 text-center shadow-2xl md:p-10">
      <AnimatedOrbs />
      <DotPattern className="absolute inset-0 opacity-20 [mask-image:radial-gradient(620px_circle_at_center,white,transparent)]" />
      <div className="relative mx-auto max-w-5xl space-y-6">
        <Badge className="rounded-full bg-peach text-navy hover:bg-peach"><ShinyLabel>Mountain House village service tracker</ShinyLabel></Badge>
        <h2 className="text-4xl font-black tracking-tight md:text-7xl">Village Help Center</h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">A shared impact board for Hansen, Cordes, College Park, Questa, Altamont, Bethany, and Wicklund—animated, live, and powered only by verified volunteer hours.</p>
        <div className="mx-auto max-w-4xl"><VillageMarquee /></div>
        <div className="flex flex-wrap justify-center gap-3"><Button asChild size="lg"><Link to="/opportunities">Find opportunities</Link></Button><Button asChild size="lg" variant="outline"><Link to="/leaderboards">View leaderboards</Link></Button></div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      {[{ label: "Verified Hours", value: metrics.verifiedHours, icon: Award }, { label: "Active Students", value: metrics.activeStudents, icon: Users }, { label: "Published Opportunities", value: metrics.published, icon: CalendarDays }].map((item) => <MagicCard key={item.label} className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-lg"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky/20 blur-2xl" /><item.icon className="mb-4 h-7 w-7 text-primary" /><p className="text-sm font-semibold text-muted-foreground">{item.label}</p><p className="mt-1 text-5xl font-black"><NumberTicker value={item.value} decimalPlaces={item.value % 1 ? 1 : 0} /></p><p className="mt-2 text-xs text-muted-foreground">Live from verified platform activity.</p></MagicCard>)}
    </section>

    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="relative overflow-hidden rounded-[2rem] bg-navy text-white shadow-2xl">
        <AnimatedOrbs />
        <CardHeader className="relative"><CardTitle className="text-2xl">Student / Organizer Portal</CardTitle><p className="text-sm text-white/65">Similar to the reference app: two clear paths, one shared village impact board.</p></CardHeader>
        <CardContent className="relative grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><Users className="mb-3 h-6 w-6 text-sky" /><h3 className="font-black">Students</h3><p className="mt-1 text-sm text-white/70">Reserve service, complete shifts, and build verified hours.</p></div>
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><ShieldCheck className="mb-3 h-6 w-6 text-peach" /><h3 className="font-black">Organizers</h3><p className="mt-1 text-sm text-white/70">Post needs, manage signups, and verify real impact.</p></div>
        </CardContent>
      </Card>
      <div className="space-y-4"><div><h3 className="text-2xl font-black">Village impact</h3><p className="text-sm text-muted-foreground">Bars animate from real verified hours. If no hours exist yet, every village correctly starts at zero.</p></div><VillageImpactRail data={data} /></div>
    </section>

    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><Card className="rounded-3xl"><CardHeader><CardTitle>Recent verified shifts</CardTitle></CardHeader><CardContent>{recentVerified.length ? <div className="space-y-3">{recentVerified.map((r) => { const student = data.users.find((u) => u.id === r.student_id); const opportunity = data.opportunities.find((o) => o.id === r.opportunity_id); return <div key={r.id} className="rounded-2xl border p-4 transition hover:bg-secondary/50"><p className="font-semibold">{student?.name} • {r.verified_hours} hrs</p><p className="text-sm text-muted-foreground">{opportunity?.title || "Opportunity"} · {student?.village}</p></div>; })}</div> : <EmptyState icon={CheckCircle2} title="No verified shifts yet" text="Once organizers verify completed shifts, recent impact will appear here automatically." />}</CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>How impact flows</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><Info label="1. Publish" value="Organizer posts" /><Info label="2. Reserve" value="Student signs up" /><Info label="3. Verify" value="Hours update" /></CardContent></Card></section>
  </div>;
}

function OpportunityCard({ opportunity, data, user, compact }: { opportunity: Opportunity; data: ReturnType<typeof useAppData>; user: User; compact?: boolean }) {
  const reserved = data.reservations.filter((r) => r.opportunity_id === opportunity.id && r.status !== "cancelled");
  const mine = data.reservations.find((r) => r.opportunity_id === opportunity.id && r.student_id === user.id && r.status !== "cancelled");
  return <Card className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl"><CardHeader><div className="flex items-start justify-between gap-3"><div><Badge variant="secondary" className="mb-2">{opportunity.village}</Badge><CardTitle className="line-clamp-2">{opportunity.title}</CardTitle></div><Badge className={opportunity.status === "published" ? "bg-sky text-navy hover:bg-sky" : ""}>{opportunity.status}</Badge></div></CardHeader><CardContent className="space-y-4"><p className={cn("text-sm text-muted-foreground", compact && "line-clamp-3")}>{opportunity.description}</p><div className="grid grid-cols-2 gap-2 text-sm"><p><CalendarDays className="mr-1 inline h-4 w-4 text-primary" />{opportunity.event_date}</p><p><Bell className="mr-1 inline h-4 w-4 text-primary" />{opportunity.start_time}–{opportunity.end_time}</p><p><Award className="mr-1 inline h-4 w-4 text-primary" />{opportunity.hours} hrs</p><p><Users className="mr-1 inline h-4 w-4 text-primary" />{reserved.length}/{opportunity.capacity}</p></div><div className="flex gap-2"><Button asChild className="flex-1"><Link to={`/opportunities/${opportunity.id}`}>View details</Link></Button>{mine && <Badge className="self-center bg-primary">Reserved</Badge>}</div></CardContent></Card>;
}

function OpportunitiesPage({ user, data, refresh }: { user: User; data: ReturnType<typeof useAppData>; refresh: () => Promise<void> }) {
  const [search, setSearch] = useState(""); const [village, setVillage] = useState("all");
  const filtered = data.opportunities.filter((o) => o.status === "published" || o.organizer_id === user.id).filter((o) => (village === "all" || o.village === village) && `${o.title} ${o.description} ${o.location}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="text-3xl font-black">Opportunities</h2><p className="text-muted-foreground">Browse, reserve, share, review, and manage volunteer service listings.</p></div>{user.account_type === "organizer" && <CreateOpportunity user={user} refresh={refresh} />}</div><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input placeholder="Search by title, description, or location" value={search} onChange={(e) => setSearch(e.target.value)} /><Select value={village} onValueChange={setVillage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All villages</SelectItem>{villages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>{filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((o) => <OpportunityCard key={o.id} opportunity={o} data={data} user={user} />)}</div> : <EmptyState icon={Search} title="No opportunities match" text="Try a different village or search term. Organizers can publish a listing and it will appear immediately." />}</div>;
}

type OpportunityForm = typeof initialOpportunity;

function CreateOpportunity({ user, refresh, opportunity }: { user: User; refresh: () => Promise<void>; opportunity?: Opportunity }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OpportunityForm>(() => opportunity ? {
    title: opportunity.title,
    description: opportunity.description,
    village: opportunity.village,
    location: opportunity.location,
    event_date: opportunity.event_date,
    start_time: opportunity.start_time,
    end_time: opportunity.end_time,
    hours: String(opportunity.hours),
    capacity: String(opportunity.capacity),
    status: opportunity.status,
  } : initialOpportunity);
  async function save() {
    const values = { organizer_id: user.id, title: form.title.trim(), description: form.description.trim(), village: form.village, location: form.location.trim(), event_date: form.event_date, start_time: form.start_time, end_time: form.end_time, hours: Number(form.hours), capacity: Number(form.capacity), status: form.status };
    if (!values.title || !values.description || !values.event_date || !values.start_time || !values.end_time || !values.location) return;
    if (opportunity) await db.update(schema.opportunities).set(values).where(eq(schema.opportunities.id, opportunity.id)); else await db.insert(schema.opportunities).values(values);
    await refresh(); setOpen(false); setForm(initialOpportunity);
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />{opportunity ? "Edit" : "Create listing"}</Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{opportunity ? "Edit opportunity" : "Create and publish opportunity"}</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>Clear instructions and details</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="space-y-2"><Label>Village</Label><Select value={form.village} onValueChange={(v) => setForm({ ...form, village: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{villages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><div className="space-y-2"><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div><div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div><div className="space-y-2"><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div></div><div className="space-y-2"><Label>Hours</Label><Input type="number" min="0.5" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div><div className="space-y-2"><Label>Capacity</Label><Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div><div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Publish immediately</SelectItem><SelectItem value="draft">Save draft</SelectItem></SelectContent></Select></div><Button className="md:col-span-2" onClick={save}>Save listing</Button></div></DialogContent></Dialog>;
}

function OpportunityDetail({ user, data, refresh }: { user: User; data: ReturnType<typeof useAppData>; refresh: () => Promise<void> }) {
  const { id } = useParams(); const [params] = useSearchParams(); const opportunity = data.opportunities.find((o) => o.id === Number(id)); const [review, setReview] = useState({ rating: "5", comment: "" });
  if (!opportunity) return <EmptyState icon={CalendarDays} title="Opportunity not found" text="The shared link may point to a listing that was removed." />;
  const selectedOpportunity = opportunity;
  const organizer = data.users.find((u) => u.id === selectedOpportunity.organizer_id); const signups = data.reservations.filter((r) => r.opportunity_id === selectedOpportunity.id && r.status !== "cancelled"); const mine = signups.find((r) => r.student_id === user.id); const isFull = signups.length >= selectedOpportunity.capacity;
  async function reserve() { if (user.account_type !== "student" || mine || isFull) return; await db.insert(schema.reservations).values({ opportunity_id: selectedOpportunity.id, student_id: user.id, status: "reserved", verified_hours: 0 }); await refresh(); }
  async function cancelReservation(reservation: Reservation) { await db.update(schema.reservations).set({ status: "cancelled" }).where(eq(schema.reservations.id, reservation.id)); await refresh(); }
  async function verify(reservation: Reservation) { await db.update(schema.reservations).set({ status: "verified", verified_hours: selectedOpportunity.hours }).where(eq(schema.reservations.id, reservation.id)); await refresh(); }
  async function markCompleted(reservation: Reservation) { await db.update(schema.reservations).set({ status: "completed" }).where(eq(schema.reservations.id, reservation.id)); await refresh(); }
  async function submitReview() { if (!review.comment.trim()) return; await db.insert(schema.reviews).values({ opportunity_id: selectedOpportunity.id, student_id: user.id, rating: Number(review.rating), comment: review.comment.trim() }); setReview({ rating: "5", comment: "" }); await refresh(); }
  async function share() { const url = `${location.origin}/opportunities/${selectedOpportunity.id}?shared=true`; await navigator.clipboard.writeText(url); alert("Shareable link copied to clipboard."); }
  return <div className="space-y-6"><Badge>{params.get("shared") ? "Opened from shareable link" : selectedOpportunity.village}</Badge><div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><Card><CardHeader><CardTitle className="text-3xl">{selectedOpportunity.title}</CardTitle><p className="text-muted-foreground">Posted by {organizer?.name || "Organizer"} • {selectedOpportunity.location}</p></CardHeader><CardContent className="space-y-5"><p className="leading-7">{selectedOpportunity.description}</p><div className="grid gap-3 sm:grid-cols-4"><Info label="Date" value={selectedOpportunity.event_date} /><Info label="Time" value={`${selectedOpportunity.start_time}–${selectedOpportunity.end_time}`} /><Info label="Hours" value={`${selectedOpportunity.hours}`} /><Info label="Spots" value={`${signups.length}/${selectedOpportunity.capacity}`} /></div><div className="flex flex-wrap gap-2">{user.account_type === "student" && <Button disabled={!!mine || isFull} onClick={reserve}>{mine ? "Reserved" : isFull ? "Full" : "Reserve spot"}</Button>}<Button variant="outline" onClick={share}><Copy className="mr-2 h-4 w-4" />Copy share link</Button>{mine && mine.status === "reserved" && <Button variant="outline" onClick={() => markCompleted(mine)}>Mark shift completed</Button>}{mine && <Button variant="outline" onClick={() => cancelReservation(mine)}>Cancel reservation</Button>}</div></CardContent></Card><Card><CardHeader><CardTitle>Reservation status</CardTitle></CardHeader><CardContent className="space-y-3">{mine ? <><Badge>{mine.status}</Badge><p className="text-sm text-muted-foreground">Verified hours are added automatically after an organizer confirms completion.</p></> : <p className="text-sm text-muted-foreground">Reserve a spot to add this event to your schedule.</p>}<Separator /><p className="text-sm"><b>Reminder setting:</b> {user.reminder_enabled ? "On, 30 minutes before shifts" : "Off"}</p></CardContent></Card></div>
  {user.account_type === "organizer" && selectedOpportunity.organizer_id === user.id && <Card><CardHeader><CardTitle>Signed-up students</CardTitle></CardHeader><CardContent>{signups.length ? <div className="space-y-3">{signups.map((r) => { const s = data.users.find((u) => u.id === r.student_id); return <div key={r.id} className="flex flex-col justify-between gap-3 rounded-2xl border p-4 md:flex-row md:items-center"><div><p className="font-semibold">{s?.name}</p><p className="text-sm text-muted-foreground">{s?.email} • {s?.village} • status: {r.status}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => cancelReservation(r)}>Remove</Button><Button disabled={r.status === "verified"} onClick={() => verify(r)}><CheckCircle2 className="mr-2 h-4 w-4" />Verify {selectedOpportunity.hours} hrs</Button></div></div>; })}</div> : <EmptyState icon={Users} title="No signups yet" text="Students who reserve this event will appear here with exact reservation status." />}</CardContent></Card>}
  <Card><CardHeader><CardTitle>Reviews and activity feedback</CardTitle></CardHeader><CardContent className="space-y-4">{user.account_type === "student" && mine && <div className="grid gap-3 md:grid-cols-[140px_1fr_auto]"><Select value={review.rating} onValueChange={(v) => setReview({ ...review, rating: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[5,4,3,2,1].map((n) => <SelectItem key={n} value={String(n)}>{n} stars</SelectItem>)}</SelectContent></Select><Input placeholder="Share useful feedback for organizers" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} /><Button onClick={submitReview}>Leave review</Button></div>}{data.reviews.filter((r) => r.opportunity_id === selectedOpportunity.id).length ? data.reviews.filter((r) => r.opportunity_id === selectedOpportunity.id).map((r) => <div key={r.id} className="rounded-2xl border p-4"><p className="font-medium"><Star className="mr-1 inline h-4 w-4 fill-current text-peach" />{r.rating}/5 by {data.users.find((u) => u.id === r.student_id)?.name}</p><p className="text-sm text-muted-foreground">{r.comment}</p></div>) : <EmptyState icon={Star} title="No reviews yet" text="Student reviews will appear here after real reservations." />}</CardContent></Card></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>; }

function OrganizerPanel({ user, data, refresh }: { user: User; data: ReturnType<typeof useAppData>; refresh: () => Promise<void> }) {
  const mine = data.opportunities.filter((o) => o.organizer_id === user.id);
  return <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Personally posted opportunities</CardTitle><CreateOpportunity user={user} refresh={refresh} /></div></CardHeader><CardContent>{mine.length ? <div className="space-y-3">{mine.map((o) => <div key={o.id} className="flex flex-col justify-between gap-3 rounded-2xl border p-4 md:flex-row md:items-center"><div><p className="font-semibold">{o.title}</p><p className="text-sm text-muted-foreground">{o.status} • {o.event_date} • {data.reservations.filter((r) => r.opportunity_id === o.id && r.status !== "cancelled").length}/{o.capacity} signed up</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to={`/opportunities/${o.id}`}>Manage</Link></Button><CreateOpportunity user={user} refresh={refresh} opportunity={o} /></div></div>)}</div> : <EmptyState icon={Plus} title="No posted opportunities" text="Create a listing and choose Publish immediately so students can reserve it right away." action={<CreateOpportunity user={user} refresh={refresh} />} />}</CardContent></Card>;
}

function Leaderboards({ data }: { data: ReturnType<typeof useAppData> }) {
  const studentTotals = data.users.filter((u) => u.account_type === "student").map((u) => ({ user: u, hours: data.reservations.filter((r) => r.student_id === u.id && r.status === "verified").reduce((s, r) => s + r.verified_hours, 0) })).filter((x) => x.hours > 0).sort((a, b) => b.hours - a.hours);
  const villageTotals = villages.map((v) => ({ village: v, hours: data.reservations.filter((r) => r.status === "verified" && data.users.find((u) => u.id === r.student_id)?.village === v).reduce((s, r) => s + r.verified_hours, 0) })).filter((x) => x.hours > 0).sort((a, b) => b.hours - a.hours); const max = Math.max(...villageTotals.map((v) => v.hours), 1);
  return <div className="space-y-6"><div><h2 className="text-3xl font-black">Leaderboards</h2><p className="text-muted-foreground">Rankings use verified service hours only. Empty states remain until real activity is verified.</p></div><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Individual ranking</CardTitle></CardHeader><CardContent>{studentTotals.length ? <div className="space-y-3">{studentTotals.map((x, i) => <div key={x.user.id} className="flex items-center justify-between rounded-2xl border p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{i + 1}</div><div><p className="font-semibold">{x.user.name}</p><p className="text-sm text-muted-foreground">{x.user.village}</p></div></div><p className="text-xl font-black">{x.hours} hrs</p></div>)}</div> : <EmptyState icon={Trophy} title="No verified hours yet" text="Once organizers verify completed reservations, student rankings will appear automatically." />}</CardContent></Card><Card><CardHeader><CardTitle>Village vs. village</CardTitle></CardHeader><CardContent>{villageTotals.length ? <div className="space-y-4">{villageTotals.map((v) => <div key={v.village}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{v.village}</span><span>{v.hours} hrs</span></div><div className="h-3 rounded-full bg-secondary"><div className="h-3 rounded-full bg-primary" style={{ width: `${(v.hours / max) * 100}%` }} /></div></div>)}</div> : <EmptyState icon={Award} title="No village hours yet" text="Village comparisons are based only on verified student hours from the seven Mountain House villages." />}</CardContent></Card></div></div>;
}

function ChatPage({ user, data, refresh }: { user: User; data: ReturnType<typeof useAppData>; refresh: () => Promise<void> }) {
  const [channel, setChannel] = useState<Channel>("everyone"); const [text, setText] = useState("");
  const visible = data.messages.filter((m) => m.channel === channel).slice(0, 60).reverse();
  async function send() { if (!text.trim()) return; await db.insert(schema.chat_messages).values({ user_id: user.id, channel, message: text.trim() }); setText(""); await refresh(); }
  return <div className="space-y-6"><div><h2 className="text-3xl font-black">Community chat</h2><p className="text-muted-foreground">Separate channels keep whole-community, student, and organizer conversations clear.</p></div><Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)}><TabsList className="grid h-auto grid-cols-3">{channels.map((c) => <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>)}</TabsList>{channels.map((c) => <TabsContent key={c.id} value={c.id}><Card><CardHeader><CardTitle>{c.label}</CardTitle><p className="text-sm text-muted-foreground">{c.help}</p></CardHeader><CardContent className="space-y-4"><div className="min-h-[320px] space-y-3 rounded-3xl border bg-secondary/30 p-4">{visible.length ? visible.map((m) => { const author = data.users.find((u) => u.id === m.user_id); return <div key={m.id} className={cn("max-w-[85%] rounded-2xl bg-card p-3 shadow-sm", m.user_id === user.id && "ml-auto bg-primary text-primary-foreground")}><p className="text-xs font-semibold opacity-75">{author?.name || "Member"} • {author?.account_type}</p><p>{m.message}</p></div>; }) : <EmptyState icon={MessageCircle} title="No messages yet" text="Start the channel with a useful update or question." />}</div><div className="flex gap-2"><Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={`Message ${c.label.toLowerCase()}`} /><Button onClick={send}><Send className="mr-2 h-4 w-4" />Send</Button></div></CardContent></Card></TabsContent>)}</Tabs></div>;
}

function FeedbackPage({ user, data, refresh }: { user: User; data: ReturnType<typeof useAppData>; refresh: () => Promise<void> }) {
  const [form, setForm] = useState({ category: "Suggestion", message: "", related_opportunity_id: "" });
  async function submit() { if (!form.message.trim()) return; await db.insert(schema.feedback).values({ user_id: user.id, category: form.category, message: form.message.trim(), related_opportunity_id: form.related_opportunity_id ? Number(form.related_opportunity_id) : null }); setForm({ category: "Suggestion", message: "", related_opportunity_id: "" }); await refresh(); }
  return <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><Card><CardHeader><CardTitle>Accessible feedback area</CardTitle><p className="text-sm text-muted-foreground">Submit suggestions, issue reports, or activity feedback. Organizers can review real submissions here.</p></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Suggestion">Suggestion</SelectItem><SelectItem value="Issue report">Issue report</SelectItem><SelectItem value="Activity review">Activity review</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Related opportunity (optional)</Label><Select value={form.related_opportunity_id || "none"} onValueChange={(v) => setForm({ ...form, related_opportunity_id: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No specific activity</SelectItem>{data.opportunities.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your suggestion or issue clearly." /></div><Button onClick={submit} className="w-full">Submit feedback</Button></CardContent></Card><Card><CardHeader><CardTitle>Recent feedback</CardTitle></CardHeader><CardContent>{data.feedback.length ? <div className="space-y-3">{data.feedback.map((f) => <div key={f.id} className="rounded-2xl border p-4"><Badge variant="secondary">{f.category}</Badge><p className="mt-2">{f.message}</p><p className="mt-1 text-xs text-muted-foreground">By {data.users.find((u) => u.id === f.user_id)?.name || "Member"}{f.related_opportunity_id ? ` • ${data.opportunities.find((o) => o.id === f.related_opportunity_id)?.title || "activity"}` : ""}</p></div>)}</div> : <EmptyState icon={ClipboardCheck} title="No feedback submitted" text="Suggestions and issue reports will appear here after users submit them." />}</CardContent></Card></div>;
}

function AppCore() {
  const data = useAppData(); const { dark, setDark } = useTheme(); const [user, setUser] = useState<User | null>(null);
  useEffect(() => { if (!data.ready) return; const id = Number(localStorage.getItem("sas-user-id")); const found = data.users.find((u) => u.id === id); if (found) setUser(found); }, [data.ready, data.users]);
  if (!data.ready) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="rounded-3xl border bg-card p-8 shadow-xl"><Sparkles className="mb-3 h-8 w-8 animate-pulse text-primary" /><p className="font-semibold">Preparing Service Above Self…</p></div></div>;
  return <Shell user={user} setUser={setUser} dark={dark} setDark={setDark}>{!user ? <AuthPage onUser={setUser} refresh={data.refresh} users={data.users} /> : <Routes><Route path="/" element={<Dashboard user={user} data={data} refresh={data.refresh} />} /><Route path="/impact" element={<ImpactPage data={data} />} /><Route path="/opportunities" element={<OpportunitiesPage user={user} data={data} refresh={data.refresh} />} /><Route path="/opportunities/:id" element={<OpportunityDetail user={user} data={data} refresh={data.refresh} />} /><Route path="/leaderboards" element={<Leaderboards data={data} />} /><Route path="/chat" element={<ChatPage user={user} data={data} refresh={data.refres