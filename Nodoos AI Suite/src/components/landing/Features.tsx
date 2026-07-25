import { motion } from "framer-motion";
import { Sparkles, Users, Plus } from "lucide-react";
import slack from "@/assets/icon-slack.png";
import gmail from "@/assets/icon-gmail.png";
import google from "@/assets/icon-google.png";
import notes from "@/assets/icon-notes.png";

const cards = [
  {
    title: "Intelligent Automation",
    description:
      "Automate repetitive technical workflows using context-aware LLMs and real-time Cortex pipelines.",
    visual: "emails",
  },
  {
    title: "Team Collaboration",
    description:
      "Enable cross-functional RevOps, Engineering, and CS teams to execute unified mitigation plays.",
    visual: "team",
  },
  {
    title: "API Integrations",
    description:
      "Seamlessly connect with your existing tech stack including Slack, Webhooks, and REST APIs.",
    visual: "connect",
  },
  {
    title: "Smart Analytics",
    description:
      "Real-time health scores, churn risk indicators, and predictive cohort analytics.",
    visual: "gantt",
  },
];

function EmailsVisual() {
  return (
    <div className="relative h-56 w-full">
      {/* connecting lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" fill="none">
        <path d="M110 55 Q 180 90 195 105" stroke="#E2E8F0" strokeDasharray="3 3" />
        <path d="M290 65 Q 230 90 205 105" stroke="#E2E8F0" strokeDasharray="3 3" />
        <path d="M110 175 Q 170 140 195 120" stroke="#E2E8F0" strokeDasharray="3 3" />
        <path d="M290 165 Q 230 140 205 120" stroke="#E2E8F0" strokeDasharray="3 3" />
      </svg>
      {/* center icon */}
      <div className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-teal-100 shadow-sm ring-1 ring-teal-200">
        <Sparkles className="h-4 w-4 text-teal-600" />
      </div>
      {/* email cards */}
      <EmailCard label="Welcome Email" className="left-2 top-4" />
      <EmailCard label="Product Update Email" className="right-2 top-10" />
      <EmailCard label="Lead Magnet Email" className="left-2 bottom-4" />
      <EmailCard label="Confirmation Email" className="right-2 bottom-8" />
    </div>
  );
}
function EmailCard({ label, className }: { label: string; className: string }) {
  return (
    <div className={`absolute w-32 rounded-md border border-border bg-surface px-2.5 py-2 shadow-sm ${className}`}>
      <div className="text-[10px] font-medium text-foreground">{label}</div>
      <div className="mt-1.5 h-0.5 w-full rounded bg-border/70" />
    </div>
  );
}

function TeamVisual() {
  const avatars = [
    { pos: "left-4 top-4", tone: "from-stone-200 to-stone-400" },
    { pos: "right-4 top-4", tone: "from-rose-200 to-rose-400" },
    { pos: "left-4 bottom-4", tone: "from-slate-200 to-slate-400" },
    { pos: "right-4 bottom-4", tone: "from-neutral-200 to-neutral-400" },
  ];
  return (
    <div className="relative h-56 w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" fill="none">
        <line x1="60" y1="40" x2="200" y2="110" stroke="#E2E8F0" />
        <line x1="340" y1="40" x2="200" y2="110" stroke="#E2E8F0" />
        <line x1="60" y1="180" x2="200" y2="110" stroke="#E2E8F0" />
        <line x1="340" y1="180" x2="200" y2="110" stroke="#E2E8F0" />
      </svg>
      <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-teal-100 shadow-md ring-4 ring-teal-50">
        <Users className="h-6 w-6 text-teal-600" />
      </div>
      {avatars.map((a, i) => (
        <div
          key={i}
          className={`absolute h-11 w-11 rounded-full border-2 border-surface bg-gradient-to-br shadow-md ${a.pos} ${a.tone}`}
        />
      ))}
    </div>
  );
}

function ConnectVisual() {
  return (
    <div className="relative h-56 w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" fill="none">
        <line x1="80" y1="60" x2="200" y2="170" stroke="#E2E8F0" />
        <line x1="200" y1="40" x2="200" y2="170" stroke="#E2E8F0" />
        <line x1="320" y1="60" x2="200" y2="170" stroke="#E2E8F0" />
        <line x1="360" y1="120" x2="200" y2="170" stroke="#E2E8F0" />
      </svg>
      <img src={notes} alt="Notes" className="absolute left-6 top-4 h-12 w-12 object-contain drop-shadow-lg" />
      <img src={google} alt="Google" className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 object-contain drop-shadow-lg" />
      <img src={slack} alt="Slack" className="absolute left-4 bottom-16 h-12 w-12 object-contain drop-shadow-lg" />
      <img src={gmail} alt="Gmail" className="absolute right-6 top-6 h-12 w-12 object-contain drop-shadow-lg" />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 shadow-md">
        <span className="text-sm font-medium text-foreground">Connect</span>
        <Plus className="h-3.5 w-3.5 text-foreground" />
      </div>
    </div>
  );
}

function GanttVisual() {
  const scale = [0, 10, 20, 30, 40, 50, 60];
  const tasks = [
    { label: "Task1", rows: [{ start: 5, end: 30 }, { start: 15, end: 35 }, { start: 45, end: 55, badge: 10 }] },
    { label: "Task2", rows: [{ start: 0, end: 15 }, { start: 30, end: 50 }, { start: 35, end: 60 }] },
  ];
  return (
    <div className="h-56 w-full text-[9px]">
      <div className="mb-1 text-[11px] font-semibold text-foreground">Real Time Analytics</div>
      <div className="ml-12 flex justify-between text-muted-foreground">
        {scale.map((n) => <span key={n}>{n}</span>)}
      </div>
      <div className="mt-1 space-y-2">
        {tasks.map((t) => (
          <div key={t.label}>
            <div className="mb-1 inline-block rounded bg-foreground px-1.5 py-0.5 text-[9px] font-medium text-background">{t.label}</div>
            {t.rows.map((r, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-10 text-[9px] text-muted-foreground">Activity{i + 1}</div>
                <div className="relative h-2.5 flex-1 rounded bg-teal-50">
                  <div
                    className="absolute h-full rounded bg-teal-200"
                    style={{ left: `${(r.start / 60) * 100}%`, width: `${((r.end - r.start) / 60) * 100}%` }}
                  />
                  {r.badge && (
                    <span
                      className="absolute -top-0.5 rounded bg-teal-500 px-1 text-[8px] font-bold text-white"
                      style={{ left: `${(r.end / 60) * 100 - 4}%` }}
                    >
                      {r.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Visual({ kind }: { kind: string }) {
  if (kind === "emails") return <EmailsVisual />;
  if (kind === "team") return <TeamVisual />;
  if (kind === "connect") return <ConnectVisual />;
  return <GanttVisual />;
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles className="h-3 w-3" /> Powerful Features
        </span>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Everything You Need To Scale With AI.
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Built with cutting-edge technology to help teams automate, analyze and optimize every aspect of their workflow.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
          >
            <div className="p-6">
              <Visual kind={c.visual} />
            </div>
            <div className="border-t border-border bg-[#F1F3F5] p-6">
              <h3 className="text-xl font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
