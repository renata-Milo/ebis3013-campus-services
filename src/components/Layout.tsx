import type { ReactNode } from "react";
import {
  Archive,
  ClipboardList,
  FileCheck2,
  History,
  LayoutDashboard,
  RotateCcw,
  School,
  Search,
  SquarePlus,
} from "lucide-react";
import type { Role } from "@contracts/types";
import { go, ROLE_LABELS } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AppButton } from "./AppButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LayoutProps {
  role: Role;
  active: string;
  children: ReactNode;
  onReset: () => void;
  resetting: boolean;
}

const navigation: Record<Role, { label: string; target: string[]; key: string; icon: typeof LayoutDashboard }[]> = {
  student: [
    { label: "Overview", target: ["home"], key: "home", icon: LayoutDashboard },
    { label: "Report cleaning", target: ["cleaning", "new"], key: "cleaning", icon: SquarePlus },
    { label: "Find a lost item", target: ["lost"], key: "lost", icon: Search },
  ],
  supervisor: [
    { label: "Work queues", target: ["home"], key: "home", icon: LayoutDashboard },
    { label: "All requests", target: ["all"], key: "all", icon: ClipboardList },
  ],
  staff: [
    { label: "My assigned tasks", target: ["home"], key: "home", icon: ClipboardList },
    { label: "Work history", target: ["history"], key: "history", icon: History },
  ],
  admin: [
    { label: "Claim review", target: ["home"], key: "home", icon: FileCheck2 },
    { label: "Item records", target: ["inventory"], key: "inventory", icon: Archive },
  ],
};

export function Layout({ role, active, children, onReset, resetting }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="z-30 border-b bg-card lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8 lg:min-h-20 lg:flex-nowrap lg:py-3">
          <button
            type="button"
            onClick={() => go(role, "home")}
            className="flex min-h-11 items-center gap-3 rounded-lg text-left"
            aria-label="Campus Services home"
          >
            <School className="size-7 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <span>
              <span className="block text-xl font-extrabold leading-6 tracking-[-0.025em]">Campus Services</span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">EBIS3013</span>
            </span>
          </button>
          <label className="flex w-full items-center gap-3 text-sm font-bold sm:w-auto">
            <span className="shrink-0">Demo role</span>
            <select
              value={role}
              onChange={(event) => go(event.target.value as Role, "home")}
              className="field-input min-w-0 flex-1 sm:w-[290px] sm:flex-none"
              aria-label="Demo role"
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b bg-card px-5 py-4 md:px-8 lg:sticky lg:top-20 lg:flex lg:h-[calc(100dvh-5rem)] lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
          <nav aria-label={`${ROLE_LABELS[role]} navigation`} className="flex flex-wrap gap-2 lg:flex-nowrap lg:flex-col">
            {navigation[role].map((item) => {
              const Icon = item.icon;
              const selected = active === item.key || (item.key === "home" && active === "ticket") || (item.key === "home" && active === "claim");
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => go(role, ...item.target)}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition-colors duration-150 lg:min-h-12 lg:w-full lg:text-base",
                    selected ? "bg-secondary text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4 lg:mt-auto lg:block lg:pt-6">
            <div>
              <p className="section-label">Demo tools</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <AppButton variant="ghost" compact className="mt-1 -ml-4">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Reset demo data
                  </AppButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl">Reset all demo data?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      This restores the original tickets, found items and claims. Changes made in this demonstration will be removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="min-h-11">Keep changes</AlertDialogCancel>
                    <AlertDialogAction onClick={onReset} disabled={resetting} className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                      {resetting ? "Resetting…" : "Reset demo data"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="hidden max-w-[190px] text-xs leading-5 text-muted-foreground lg:mt-6 lg:block">
              Integrated Campus Cleaning and Lost-and-Found Management System
            </p>
          </div>
        </aside>
        <main id="main-content" className="min-w-0 px-5 py-7 md:px-10 md:py-10 xl:px-14" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[1220px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
