import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BottleWine,
  CalendarDays,
  Headphones,
  MapPin,
  Notebook,
  Package,
  Umbrella,
} from "lucide-react";
import type { Claim, CleaningTicket, FoundItem } from "@contracts/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { translateStatus, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AppButton } from "./AppButton";

const statusStyles: Record<string, string> = {
  Submitted: "border-slate-300 bg-slate-100 text-slate-800",
  Assigned: "border-indigo-300 bg-indigo-50 text-indigo-900",
  "In progress": "border-amber-300 bg-amber-50 text-amber-950",
  "Awaiting review": "border-orange-300 bg-orange-50 text-orange-950",
  Closed: "border-emerald-300 bg-emerald-50 text-emerald-900",
  "Pending verification": "border-amber-300 bg-amber-50 text-amber-950",
  "Approved – ready for collection": "border-emerald-300 bg-emerald-50 text-emerald-900",
  Rejected: "border-red-300 bg-red-50 text-red-900",
  Returned: "border-emerald-300 bg-emerald-50 text-emerald-900",
  Available: "border-slate-300 bg-slate-100 text-slate-800",
  "Awaiting collection": "border-indigo-300 bg-indigo-50 text-indigo-900",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { language } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold leading-5",
        statusStyles[status] ?? statusStyles.Submitted,
        className,
      )}
    >
      <span className="size-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {translateStatus(status, language)}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className="mb-8 flex flex-col gap-5 border-b pb-7 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="section-label mb-3">{t(eyebrow)}</p>
        <h1 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] md:text-5xl">
          {t(title)}
        </h1>
        {description && <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{t(description)}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useI18n();
  return (
    <AppButton variant="ghost" compact onClick={onClick} className="mb-5 -ml-4">
      <ArrowLeft className="size-5" aria-hidden="true" />
      {t(label ?? "Back")}
    </AppButton>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  const { t } = useI18n();
  return (
    <div className="border-y py-10 text-center">
      <Package className="mx-auto mb-3 size-7 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-xl font-bold">{t(title)}</h3>
      <p className="mt-1 text-muted-foreground">{t(description)}</p>
    </div>
  );
}

export function TicketRow({ ticket, onClick }: { ticket: CleaningTicket; onClick: () => void }) {
  const { t, text, language } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-24 w-full flex-col gap-3 border-b py-5 text-left transition-colors duration-150 last:border-b-0 hover:bg-secondary md:flex-row md:items-center md:justify-between md:px-3"
      aria-label={`${t("Open", "打开")} ${ticket.id}, ${text(ticket.issueType)}, ${translateStatus(ticket.status, language)}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="record-id">{ticket.id}</span>
          <span className="text-lg font-bold">{text(ticket.issueType)}</span>
        </div>
        <p className="mt-1 flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {ticket.location}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <StatusBadge status={ticket.status} />
        <ArrowRight className="size-5 shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </button>
  );
}

export function ClaimRow({ claim, item, onClick }: { claim: Claim; item?: FoundItem; onClick: () => void }) {
  const { t, text, language } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-24 w-full flex-col gap-3 border-b py-5 text-left transition-colors duration-150 last:border-b-0 hover:bg-secondary md:flex-row md:items-center md:justify-between md:px-3"
      aria-label={`${t("Open", "打开")} ${claim.id}, ${text(item?.name ?? "found item")}, ${translateStatus(claim.status, language)}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="record-id">{claim.id}</span>
          <span className="text-lg font-bold">{text(item?.name ?? claim.itemId)}</span>
        </div>
        <p className="mt-1 text-muted-foreground">{text(item?.location ?? "")} · {t("Submitted", "提交于")} {formatDateTime(claim.submittedAt)}</p>
      </div>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <StatusBadge status={claim.status} />
        <ArrowRight className="size-5 shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </button>
  );
}

export function ItemIcon({ item, className }: { item: FoundItem; className?: string }) {
  const props = { className: cn("size-12", className), "aria-hidden": true as const, strokeWidth: 1.5 };
  if (item.name.toLowerCase().includes("bottle")) return <BottleWine {...props} />;
  if (item.name.toLowerCase().includes("umbrella")) return <Umbrella {...props} />;
  if (item.name.toLowerCase().includes("earbuds")) return <Headphones {...props} />;
  if (item.name.toLowerCase().includes("notebook")) return <Notebook {...props} />;
  return <Package {...props} />;
}

export function ItemMeta({ item }: { item: FoundItem }) {
  const { t, text } = useI18n();
  return (
    <div className="mt-3 flex flex-col gap-1 text-muted-foreground">
      <span className="flex items-center gap-2">
        <MapPin className="size-4" aria-hidden="true" /> {text(item.location)}
      </span>
      <span className="flex items-center gap-2">
        <CalendarDays className="size-4" aria-hidden="true" /> {t("Found", "拾获日期")} {formatDate(item.foundDate)}
      </span>
    </div>
  );
}
