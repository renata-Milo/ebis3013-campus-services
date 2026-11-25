import type { ReactNode } from "react";
import {
  Archive,
  ClipboardList,
  FileCheck2,
  History,
  Languages,
  LayoutDashboard,
  RotateCcw,
  School,
  Search,
  SquarePlus,
} from "lucide-react";
import type { Role } from "@contracts/types";
import { go, ROLE_LABELS } from "@/lib/router";
import { useI18n } from "@/lib/i18n";
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

const navigation: Record<Role, { label: string; zh: string; target: string[]; key: string; icon: typeof LayoutDashboard }[]> = {
  student: [
    { label: "Overview", zh: "首页", target: ["home"], key: "home", icon: LayoutDashboard },
    { label: "Report cleaning", zh: "上报清洁问题", target: ["cleaning", "new"], key: "cleaning", icon: SquarePlus },
    { label: "Find a lost item", zh: "寻找失物", target: ["lost"], key: "lost", icon: Search },
  ],
  supervisor: [
    { label: "Work queues", zh: "工作队列", target: ["home"], key: "home", icon: LayoutDashboard },
    { label: "All requests", zh: "全部工单", target: ["all"], key: "all", icon: ClipboardList },
  ],
  staff: [
    { label: "My assigned tasks", zh: "我的任务", target: ["home"], key: "home", icon: ClipboardList },
    { label: "Work history", zh: "工作记录", target: ["history"], key: "history", icon: History },
  ],
  admin: [
    { label: "Claim review", zh: "认领审核", target: ["home"], key: "home", icon: FileCheck2 },
    { label: "Item records", zh: "物品记录", target: ["inventory"], key: "inventory", icon: Archive },
  ],
};

export function Layout({ role, active, children, onReset, resetting }: LayoutProps) {
  const { t, language, toggleLanguage } = useI18n();
  const roleZh: Record<Role, string> = {
    student: "学生",
    supervisor: "清洁主管",
    staff: "清洁员",
    admin: "失物管理员",
  };
  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform focus:translate-y-0"
      >
        {t("Skip to content", "跳至主要内容")}
      </a>
      <header className="z-30 border-b bg-card lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8 lg:min-h-20 lg:flex-nowrap lg:py-3">
          <button
            type="button"
            onClick={() => go(role, "home")}
            className="flex min-h-11 items-center gap-3 rounded-lg text-left"
            aria-label={t("Campus Services home", "校园服务首页")}
          >
            <School className="size-7 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <span>
              <span className="block text-xl font-extrabold leading-6 tracking-[-0.025em]">{t("Campus Services", "校园服务")}</span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">EBIS3013</span>
            </span>
          </button>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <AppButton variant="secondary" compact onClick={toggleLanguage} aria-label={t("Switch to Chinese", "Switch to English")} className="shrink-0">
              <Languages className="size-5" aria-hidden="true" />
              {language === "en" ? "中文" : "English"}
            </AppButton>
            <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-bold">
              <span className="shrink-0">{t("Demo role", "演示角色")}</span>
              <select
                value={role}
                onChange={(event) => go(event.target.value as Role, "home")}
                className="field-input min-w-0 flex-1 sm:w-[250px] sm:flex-none"
                aria-label={t("Demo role", "演示角色")}
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((value) => (
                  <option key={value} value={value}>
                    {language === "zh" ? roleZh[value] : ROLE_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b bg-card px-5 py-4 md:px-8 lg:sticky lg:top-20 lg:flex lg:h-[calc(100dvh-5rem)] lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
          <nav aria-label={`${language === "zh" ? roleZh[role] : ROLE_LABELS[role]} ${t("navigation", "导航")}`} className="flex flex-wrap gap-2 lg:flex-nowrap lg:flex-col">
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
                  {language === "zh" ? item.zh : item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4 lg:mt-auto lg:block lg:pt-6">
            <div>
              <p className="section-label">{t("Demo tools", "演示工具")}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <AppButton variant="ghost" compact className="mt-1 -ml-4">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    {t("Reset demo data", "重置演示数据")}
                  </AppButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl">{t("Reset all demo data?", "重置全部演示数据？")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      {t("This restores the original tickets, found items and claims. Changes made in this demonstration will be removed.", "此操作会恢复初始工单、失物和认领记录，并清除本次演示中的所有修改。")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="min-h-11">{t("Keep changes", "保留修改")}</AlertDialogCancel>
                    <AlertDialogAction onClick={onReset} disabled={resetting} className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                      {resetting ? t("Resetting…", "正在重置……") : t("Reset demo data", "重置演示数据")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="hidden max-w-[190px] text-xs leading-5 text-muted-foreground lg:mt-6 lg:block">
              {t("Integrated Campus Cleaning and Lost-and-Found Management System", "校园清洁与失物招领综合管理系统")}
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
