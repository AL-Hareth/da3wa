import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-line-strong bg-card px-3.5 text-[0.95rem] text-ink placeholder:text-muted/70 transition-shadow focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15 disabled:bg-paper disabled:text-muted";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "h-11 pe-8", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink-soft", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ms-1.5 text-xs font-normal text-muted">({optional})</span>}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start gap-3", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-gold peer-focus-visible:ring-4 peer-focus-visible:ring-gold/20 after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4"
      />
      <span>
        <span className="block text-[0.95rem] font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function FormMessage({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: React.ReactNode }) {
  const tones = {
    error: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-gold-soft text-gold-dark",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}
