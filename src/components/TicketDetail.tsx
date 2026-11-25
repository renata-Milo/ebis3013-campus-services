import { useEffect, useState } from "react";
import { Check, ClipboardCheck, Play, RotateCcw, Send, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { STAFF_MEMBERS } from "@contracts/demoData";
import type { CleaningTicket, Role } from "@contracts/types";
import { formatDateTime } from "@/lib/format";
import { translateStatus, useI18n, type Language } from "@/lib/i18n";
import type { DemoActions } from "@/hooks/useDemoActions";
import { AppButton } from "./AppButton";
import { StatusBadge } from "./Common";

const DEFAULT_RESOLUTION = {
  en: "Floor dried and warning sign removed.",
  zh: "地面已擦干，警示牌已移除。",
};

function nextAction(ticket: CleaningTicket, language: Language) {
  if (language === "zh") {
    if (ticket.status === "Submitted" || ticket.status === "Awaiting review") return "下一步由清洁主管处理";
    if (ticket.status === "Assigned" || ticket.status === "In progress") return `下一步由清洁员 ${ticket.assignedStaff} 处理`;
    return "无需进一步处理";
  }
  if (ticket.status === "Submitted") return "Next action by Cleaning Supervisor";
  if (ticket.status === "Assigned") return `Next action by Cleaning Staff · ${ticket.assignedStaff}`;
  if (ticket.status === "In progress") return `Next action by Cleaning Staff · ${ticket.assignedStaff}`;
  if (ticket.status === "Awaiting review") return "Next action by Cleaning Supervisor";
  return "No further action required";
}

export function TicketDetail({
  ticket,
  role,
  staffMember,
  actions,
}: {
  ticket: CleaningTicket;
  role: Role;
  staffMember: string;
  actions: DemoActions;
}) {
  const { t, text, language } = useI18n();
  const [selectedStaff, setSelectedStaff] = useState(ticket.assignedStaff ?? STAFF_MEMBERS[0]);
  const [resolution, setResolution] = useState(DEFAULT_RESOLUTION[language]);
  const [showRework, setShowRework] = useState(false);
  const [reworkReason, setReworkReason] = useState("");
  const [reworkError, setReworkError] = useState(false);

  useEffect(() => {
    setSelectedStaff(ticket.assignedStaff ?? STAFF_MEMBERS[0]);
    setResolution(DEFAULT_RESOLUTION[language]);
    setShowRework(false);
    setReworkReason("");
    setReworkError(false);
  }, [ticket.id, ticket.assignedStaff]);

  useEffect(() => {
    setResolution((current) => {
      if (current === DEFAULT_RESOLUTION.en || current === DEFAULT_RESOLUTION.zh) {
        return DEFAULT_RESOLUTION[language];
      }
      return current;
    });
  }, [language]);

  const assign = async () => {
    await actions.assignStaff.mutateAsync({ ticketId: ticket.id, staff: selectedStaff });
    toast.success(t(`${ticket.id} assigned to ${selectedStaff}.`, `工单 ${ticket.id} 已派给 ${selectedStaff}。`));
  };

  const start = async () => {
    await actions.startWork.mutateAsync({ ticketId: ticket.id, staff: staffMember });
    toast.success(t(`${ticket.id} is now in progress.`, `工单 ${ticket.id} 正在处理中。`));
  };

  const submitReview = async () => {
    if (!resolution.trim()) return;
    await actions.submitForReview.mutateAsync({
      ticketId: ticket.id,
      staff: staffMember,
      resolutionNote: resolution.trim(),
    });
    toast.success(t(`${ticket.id} submitted for supervisor review.`, `工单 ${ticket.id} 已提交主管复核。`));
  };

  const approve = async () => {
    await actions.approveCleaning.mutateAsync({ ticketId: ticket.id });
    toast.success(t(`${ticket.id} approved and closed.`, `工单 ${ticket.id} 已复核并关闭。`));
  };

  const returnRework = async () => {
    if (!reworkReason.trim()) {
      setReworkError(true);
      return;
    }
    await actions.returnForRework.mutateAsync({ ticketId: ticket.id, reason: reworkReason.trim() });
    setShowRework(false);
    toast.success(t(`${ticket.id} returned to ${ticket.assignedStaff} for rework.`, `工单 ${ticket.id} 已退回 ${ticket.assignedStaff} 返工。`));
  };

  return (
    <div>
      <section className="mb-7 rounded-xl border border-indigo-200 bg-secondary p-5 md:p-6" aria-label={t("Current status and next action", "当前状态和下一步")}>
        <p className="section-label mb-3">{t("Current status · Next step", "当前状态 · 下一步")}</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <StatusBadge status={ticket.status} />
          <p className="text-lg font-bold md:text-xl">
            {translateStatus(ticket.status, language)} <span className="font-normal text-muted-foreground">·</span> {nextAction(ticket, language)}
          </p>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:gap-12">
        <div>
          <section aria-labelledby="request-details">
            <h2 id="request-details" className="mb-5 text-2xl font-extrabold tracking-tight">{t("Request details", "工单详情")}</h2>
            <dl className="grid gap-x-8 gap-y-5 border-y py-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="section-label mb-1">{t("Location")}</dt>
                <dd className="text-lg font-bold">{ticket.location}</dd>
              </div>
              <div>
                <dt className="section-label mb-1">{t("Issue type")}</dt>
                <dd className="text-lg">{text(ticket.issueType)}</dd>
              </div>
              <div>
                <dt className="section-label mb-1">{t("Submitted")}</dt>
                <dd className="text-lg">{formatDateTime(ticket.submittedAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="section-label mb-1">{t("Description")}</dt>
                <dd className="max-w-[70ch] text-lg leading-7">{text(ticket.description)}</dd>
              </div>
              <div>
                <dt className="section-label mb-1">{language === "zh" ? "负责清洁员" : "Assigned staff"}</dt>
                <dd className="text-lg">{ticket.assignedStaff ?? t("Not assigned yet", "尚未派单")}</dd>
              </div>
            </dl>
          </section>

          {ticket.reworkReason && (
            <section className="mt-6 border-l-2 border-red-700 pl-4" aria-label={t("Rework reason", "返工原因")}>
              <h3 className="font-bold text-red-900">{t("Rework requested", "已要求返工")}</h3>
              <p className="mt-1 text-red-900">{text(ticket.reworkReason)}</p>
            </section>
          )}

          {ticket.resolutionNote && (
            <section className="mt-7" aria-labelledby="resolution-note">
              <h3 id="resolution-note" className="section-label mb-2">{t("Cleaning completion note", "清洁处理备注")}</h3>
              <p className="rounded-xl border bg-card p-5 text-lg leading-7">{text(ticket.resolutionNote)}</p>
            </section>
          )}

          {role === "supervisor" && ticket.status === "Submitted" && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="assign-heading">
              <h2 id="assign-heading" className="text-2xl font-extrabold">{t("Assign this request", "分配此工单")}</h2>
              <p className="mt-1 text-muted-foreground">{t(`The selected staff member will see ${ticket.id} in My assigned tasks.`, `所选清洁员将在“我的任务”中看到工单 ${ticket.id}。`)}</p>
              <label className="field-label mt-5" htmlFor={`assign-${ticket.id}`}>{t("Cleaning staff", "清洁员")}</label>
              <select
                id={`assign-${ticket.id}`}
                className="field-input"
                value={selectedStaff}
                onChange={(event) => setSelectedStaff(event.target.value)}
              >
                {STAFF_MEMBERS.map((staff) => <option key={staff}>{staff}</option>)}
              </select>
              <AppButton className="mt-5 w-full sm:w-auto" onClick={assign} loading={actions.assignStaff.isPending}>
                <UserRoundCheck className="size-5" aria-hidden="true" /> {t("Assign staff", "确认派单")}
              </AppButton>
            </section>
          )}

          {role === "staff" && ticket.status === "Assigned" && ticket.assignedStaff === staffMember && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6">
              <h2 className="text-2xl font-extrabold">{t("Ready to begin?", "准备开始处理？")}</h2>
              <p className="mt-1 text-muted-foreground">{t("Start work to update the student and supervisor.", "开始处理后，学生和主管将看到最新进度。")}</p>
              <AppButton className="mt-5 w-full sm:w-auto" onClick={start} loading={actions.startWork.isPending}>
                <Play className="size-5" aria-hidden="true" /> {t("Start work", "开始处理")}
              </AppButton>
            </section>
          )}

          {role === "staff" && ticket.status === "In progress" && ticket.assignedStaff === staffMember && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="complete-heading">
              <h2 id="complete-heading" className="text-2xl font-extrabold">{t("Complete this task", "完成此任务")}</h2>
              <label className="field-label mt-5" htmlFor={`resolution-${ticket.id}`}>{t("Work completion note", "工作完成备注")}</label>
              <textarea
                id={`resolution-${ticket.id}`}
                className="field-input min-h-32 resize-y"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                required
              />
              {resolution.trim() === "" && <p className="mt-2 font-bold text-red-800">{t("Please enter a completion note.", "请填写处理备注。")}</p>}
              <AppButton
                className="mt-5 w-full sm:w-auto"
                onClick={submitReview}
                loading={actions.submitForReview.isPending}
                disabled={!resolution.trim()}
              >
                <Send className="size-5" aria-hidden="true" /> {t("Submit for review", "提交复核")}
              </AppButton>
            </section>
          )}

          {role === "supervisor" && ticket.status === "Awaiting review" && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="review-heading">
              <h2 id="review-heading" className="text-2xl font-extrabold">{t("Review completed work", "复核已完成的工作")}</h2>
              <p className="mt-1 text-muted-foreground">{t("Compare the completion note with the original request.", "请将处理备注与原始工单进行对照。")}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <AppButton onClick={approve} loading={actions.approveCleaning.isPending} className="sm:flex-1">
                  <Check className="size-5" aria-hidden="true" /> {t("Approve and close", "复核并关单")}
                </AppButton>
                <AppButton variant="danger" onClick={() => setShowRework((value) => !value)} aria-expanded={showRework}>
                  <RotateCcw className="size-5" aria-hidden="true" /> {t("Return for rework", "退回返工")}
                </AppButton>
              </div>
              {showRework && (
                <div className="mt-6 border-t pt-5">
                  <label className="field-label" htmlFor={`rework-${ticket.id}`}>{t("Reason for rework", "返工原因")} <span className="text-red-800">{t("(required)", "（必填）")}</span></label>
                  <textarea
                    id={`rework-${ticket.id}`}
                    className="field-input min-h-28 resize-y"
                    value={reworkReason}
                    aria-invalid={reworkError}
                    aria-describedby={reworkError ? `rework-error-${ticket.id}` : undefined}
                    onChange={(event) => {
                      setReworkReason(event.target.value);
                      if (event.target.value.trim()) setReworkError(false);
                    }}
                    placeholder={t("Explain what the cleaning staff needs to correct.", "请说明清洁员需要改正的内容。")}
                    autoFocus
                  />
                  {reworkError && <p id={`rework-error-${ticket.id}`} role="alert" className="mt-2 font-bold text-red-800">{t("Please enter a reason for rework.", "请填写返工原因。")}</p>}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <AppButton variant="danger" onClick={returnRework} loading={actions.returnForRework.isPending}>{t("Confirm return for rework", "确认退回返工")}</AppButton>
                    <AppButton variant="ghost" onClick={() => setShowRework(false)}>{t("Cancel")}</AppButton>
                  </div>
                </div>
              )}
            </section>
          )}

          {ticket.status === "Closed" && (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
              <ClipboardCheck className="mt-1 size-6 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-extrabold">{t("Work approved", "工作已复核")}</h2>
                <p>{t("This request is closed. Its complete history remains available below.", "此工单已关闭，完整处理记录保留在下方。")}</p>
              </div>
            </div>
          )}
        </div>

        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="mb-5 text-2xl font-extrabold tracking-tight">{t("Activity timeline", "处理时间线")}</h2>
          <ol className="ml-2 border-l-2 border-indigo-200">
            {ticket.timeline.map((event, index) => (
              <li key={event.id} className="relative pb-7 pl-6 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background" aria-hidden="true" />
                <h3 className="font-bold leading-6">{text(event.label)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{event.actor} · {formatDateTime(event.timestamp)}</p>
                {event.detail && <p className="mt-2 text-base leading-6">{text(event.detail)}</p>}
                {index === ticket.timeline.length - 1 && <span className="section-label mt-2 inline-block">{t("Latest update", "最新进展")}</span>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
