import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center space-y-6">
      <Link href="/" className="flex items-center gap-2 mb-4">
        <Image
          src="/nodoos-logo.png"
          alt="Nodoos AI"
          width={40}
          height={40}
          className="object-contain"
        />
        <span className="text-lg font-black tracking-tight text-foreground">NODOOS AI</span>
      </Link>
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-muted border border-border">
        <ShieldAlert className="h-8 w-8 text-accent" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Page Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          The dashboard link or URL you were looking for doesn't exist, or you don't have permission to access it.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
