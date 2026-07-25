import { motion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";
import figure from "@/assets/hero-figure.png";
import slack from "@/assets/icon-slack.png";
import gmail from "@/assets/icon-gmail.png";
import google from "@/assets/icon-google.png";
import notes from "@/assets/icon-notes.png";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-between px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-3">
        {/* Headline */}
        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-medium tracking-tight text-foreground md:text-2xl"
          >
            Smarter <span className="font-serif italic font-normal text-foreground/80">Workflow</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-black leading-[0.85] tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.5rem, 12vw, 10rem)", letterSpacing: "-0.04em" }}
          >
            AUTOMATION
          </motion.h1>
        </div>

        {/* Main hero canvas */}
        <div className="relative">
          {/* Center figure */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative z-10 mx-auto flex justify-center"
          >
            <img
              src={figure}
              alt="Person reading"
              className="h-auto w-full max-w-[240px] md:max-w-[340px]"
            />
          </motion.div>

          {/* Trustpilot badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute right-0 top-0 z-20 hidden md:block"
          >
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 shadow-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              ))}
              <span className="ml-1 text-xs font-semibold text-foreground">Trustpilot</span>
            </div>
          </motion.div>

          {/* Sub copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute right-0 top-9 z-20 hidden max-w-[220px] text-right text-xs text-muted-foreground md:block"
          >
            Empower your team with advanced AI tools that automate repetitive tasks and streamline operations.
          </motion.p>

          {/* Floating 3D icons */}
          <FloatIcon src={slack} alt="Slack" className="left-2 top-2 h-10 w-10 md:left-16 md:top-10 md:h-14 md:w-14" delay={0.3} />
          <FloatIcon src={notes} alt="Notes" className="left-4 top-28 h-9 w-9 md:left-24 md:top-44 md:h-12 md:w-12" delay={0.45} />
          <FloatIcon src={gmail} alt="Gmail" className="right-2 top-2 h-10 w-10 md:right-24 md:top-16 md:h-14 md:w-14" delay={0.35} />
          <FloatIcon src={google} alt="Google" className="right-6 top-28 h-10 w-10 md:right-40 md:top-44 md:h-14 md:w-14" delay={0.5} />

          {/* Analytics card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-0 right-0 z-20 hidden w-52 rounded-2xl border border-border bg-surface p-3 shadow-xl md:block"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold text-foreground">Intelligence in Every Decision</div>
              <TrendingUp className="h-3 w-3 text-accent" />
            </div>
            <div className="mt-2 flex h-12 items-end gap-1">
              {[45, 30, 65, 40, 75, 55, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-accent/20 to-accent/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trusted by row */}
        <div className="mt-3 flex flex-col items-start justify-between gap-3 border-t border-border pt-3 md:flex-row md:items-center">
          <div className="text-xs font-semibold leading-tight text-foreground">
            Trusted By Worldwide Company
          </div>
          <div className="grid flex-1 grid-cols-3 items-center gap-4 md:ml-16 md:grid-cols-5">
            {["Lumen", "Northwind", "Atlas Co.", "Vertex", "Helix"].map((n) => (
              <div key={n} className="text-center text-sm font-medium text-muted-foreground/60">{n}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatIcon({
  src,
  alt,
  className,
  delay,
}: {
  src: string;
  alt: string;
  className: string;
  delay: number;
}) {
  return (
    <motion.img
      src={src}
      alt={alt}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.4, delay },
        scale: { duration: 0.4, delay },
        y: { duration: 4, delay, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`absolute z-20 object-contain drop-shadow-xl ${className}`}
    />
  );
}
