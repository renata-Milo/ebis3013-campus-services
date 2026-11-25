import { STAFF_MEMBERS } from "@contracts/demoData";
import type { DemoData } from "@contracts/types";
import type { DemoActions } from "@/hooks/useDemoActions";
import { go } from "@/lib/router";
import { useI18n } from "@/lib/i18n";
import { AppButton } from "@/components/AppButton";
import { BackButton, EmptyState, PageHeader, TicketRow } from "@/components/Common";
import { TicketDetail } from "@/components/TicketDetail";

interface StaffProps {
  parts: string[];
  data: DemoData;
  actions: DemoActions;
  staffMember: string;
  setStaffMember: (staff: string) => void;
}

function StaffSelect({ staffMember, setStaffMember }: Pick<StaffProps, "staffMember" | "setStaffMember">) {
  const { t } = useI18n();
  return (
    <label className="block min-w-0">
      <span className="section-label mb-2 block">{t("Staff member")}</span>
      <select className="field-input min-w-[220px]" value={staffMember} onChange={(event) => setStaffMember(event.target.value)}>
        {STAFF_MEMBERS.map((staff) => <option key={staff}>{staff}</option>)}
      </select>
    </label>
  );
}

export function StaffPage({ parts, data, actions, staffMember, setStaffMember }: StaffProps) {
  const { t, text } = useI18n();
  const [section, id] = parts;
  if (section === "ticket" && id) {
    const ticket = data.tickets.find((entry) => entry.id === id);
    if (!ticket) {
      return (
        <div>
          <PageHeader eyebrow="Cleaning staff" title="Task not found" description="This task is not in the current demo data." />
          <AppButton onClick={() => go("staff", "home")}>{t("Back to my assigned tasks")}</AppButton>
        </div>
      );
    }
    return (
      <div>
        <BackButton onClick={() => go("staff", "home")} label="Back to my assigned tasks" />
        <PageHeader
          eyebrow="Cleaning Staff · Assigned task"
          title={ticket.id}
          description={text(ticket.issueType)}
          action={<StaffSelect staffMember={staffMember} setStaffMember={setStaffMember} />}
        />
        <TicketDetail ticket={ticket} role="staff" staffMember={staffMember} actions={actions} />
      </div>
    );
  }

  const history = section === "history";
  const tickets = data.tickets.filter((ticket) => {
    if (ticket.assignedStaff !== staffMember) return false;
    return history ? ["Awaiting review", "Closed"].includes(ticket.status) : ["Assigned", "In progress"].includes(ticket.status);
  });
  return (
    <div>
      <PageHeader
        eyebrow="Cleaning Staff home"
        title={history ? "Review your completed work" : "Complete your assigned cleaning work"}
        description={history ? "Submitted and closed requests remain available with their full timelines." : "Start assigned work, record what you completed, and send it to the supervisor for review."}
        action={<StaffSelect staffMember={staffMember} setStaffMember={setStaffMember} />}
      />
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t(history ? "Work history" : "My assigned tasks")}</h2>
        <span className="text-xl font-extrabold text-primary">{tickets.length}</span>
      </div>
      <div className="panel px-5 md:px-6">
        {tickets.length ? tickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} onClick={() => go("staff", "ticket", ticket.id)} />
        )) : (
          <EmptyState
            title={history ? "No completed work yet" : "No assigned tasks"}
            description={history ? t("Submitted and closed work will appear here.") : t(`Tasks assigned to ${staffMember} will appear here.`, `分配给 ${staffMember} 的任务会显示在这里。`)}
          />
        )}
      </div>
    </div>
  );
}
