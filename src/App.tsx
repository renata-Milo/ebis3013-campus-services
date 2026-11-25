import { useState } from "react";
import { LoaderCircle, WifiOff } from "lucide-react";
import { toast, Toaster } from "sonner";
import { STAFF_MEMBERS } from "@contracts/demoData";
import { useDemoActions } from "@/hooks/useDemoActions";
import { useI18n } from "@/lib/i18n";
import { go, useRoute } from "@/lib/router";
import { trpc } from "@/providers/trpc";
import { AppButton } from "@/components/AppButton";
import { Layout } from "@/components/Layout";
import { AdminPage } from "@/pages/Admin";
import { StaffPage } from "@/pages/Staff";
import { StudentPage } from "@/pages/Student";
import { SupervisorPage } from "@/pages/Supervisor";

export default function App() {
  const route = useRoute();
  const { t } = useI18n();
  const demo = trpc.demo.get.useQuery();
  const actions = useDemoActions();
  const [staffMember, setStaffMember] = useState(STAFF_MEMBERS[0]);

  const reset = async () => {
    await actions.reset.mutateAsync();
    go(route.role, "home");
    toast.success(t("Demo data restored to the original sample.", "演示数据已恢复为初始样例。"));
  };

  let content;
  if (demo.isLoading) {
    content = (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center" role="status">
        <LoaderCircle className="size-9 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-extrabold">{t("Loading the shared demo…", "正在加载共享演示数据……")}</h1>
        <p className="mt-2 text-muted-foreground">{t("Preparing tickets, found items and claims.", "正在准备工单、拾获物品和认领记录。")}</p>
      </div>
    );
  } else if (demo.isError || !demo.data) {
    content = (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center">
        <WifiOff className="size-10 text-red-800" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-extrabold">{t("The demo data could not be loaded", "无法加载演示数据")}</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">{demo.error?.message ?? t("Please try again.", "请重试。")}</p>
        <AppButton className="mt-6" onClick={() => demo.refetch()} loading={demo.isFetching}>{t("Try again", "重试")}</AppButton>
      </div>
    );
  } else {
    const props = { parts: route.parts, data: demo.data, actions };
    if (route.role === "supervisor") content = <SupervisorPage {...props} />;
    else if (route.role === "staff") {
      content = <StaffPage {...props} staffMember={staffMember} setStaffMember={setStaffMember} />;
    } else if (route.role === "admin") content = <AdminPage {...props} />;
    else content = <StudentPage {...props} />;
  }

  return (
    <>
      <Layout role={route.role} active={route.parts[0]} onReset={reset} resetting={actions.reset.isPending}>
        {content}
      </Layout>
      <Toaster position="top-center" closeButton toastOptions={{ className: "text-base" }} />
    </>
  );
}
