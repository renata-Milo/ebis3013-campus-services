import { useEffect, useState } from "react";
import { Check, ClipboardCheck, Play, RotateCcw, Send, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { STAFF_MEMBERS } from "@contracts/demoData";
import type { CleaningTicket, Role } from "@contracts/types";
import { formatDateTime } from "@/lib/format";
import type { DemoActions } from "@/hooks/useDemoActions";
import { AppButton } from "./AppButton";
import { StatusBadge } from "./Common";

function nextAction(ticket: CleaningTicket) {
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
  const [selectedStaff, setSelectedStaff] = useState(ticket.assignedStaff ?? STAFF_MEMBERS[0]);
  const [resolution, setResolution] = useState("Floor dried and warning sign removed.");
  const [showRework, setShowRework] = useState(false);
  const [reworkReason, setReworkReason] = useState("");
  const [reworkError, setReworkError] = useState("");

  useEffect(() => {
    setSelectedStaff(ticket.assignedStaff ?? STAFF_MEMBERS[0]);
    setShowRework(false);
    setReworkReason("");
    setReworkError("");
  }, [ticket.id, ticket.assignedStaff]);

  const assign = async () => {
    await actions.assignStaff.mutateAsync({ ticketId: ticket.id, staff: selectedStaff });
    toast.success(`${ticket.id} assigned to ${selectedStaff}.`);
  };

  const start = async () => {
    await actions.startWork.mutateAsync({ ticketId: ticket.id, staff: staffMember });
    toast.success(`${ticket.id} is now in progress.`);
  };

  const submitReview = async () => {
    if (!resolution.trim()) return;
    await actions.submitForReview.mutateAsync({
      ticketId: ticket.id,
      staff: staffMember,
      resolutionNote: resolution.trim(),
    });
    toast.success(`${ticket.id} submitted for supervisor review.`);
  };

  const approve = async () => {
    await actions.approveCleaning.mutateAsync({ ticketId: ticket.id });
    toast.success(`${ticket.id} approved and closed.`);
  };

  const returnRework = async () => {
    if (!reworkReason.trim()) {
      setReworkError("Please enter a reason for rework.");
      return;
    }
    await actions.returnForRework.mutateAsync({ ticketId: ticket.id, reason: reworkReason.trim() });
    setShowRework(false);
    toast.success(`${ticket.id} returned to ${ticket.assignedStaff} for rework.`);
  };

  return (
    <div>
      <section className="mb-7 rounded-xl border border-indigo-200 bg-secondary p-5 md:p-6" aria-label="Current status and next action">
        <p className="section-label mb-3">Current status · Next step</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <StatusBadge status={ticket.status} />
          <p className="text-lg font-bold md:text-xl">
            {ticket.status} <span className="font-normal text-muted-foreground">·</span> {nextAction(ticket)}
          </p>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:gap-12">
        <div>
          <section aria-labelledby="request-details">
            <h2 id="request-details" className="mb-5 text-2xl font-extrabold tracking-tight">Request details</h2>
            <dl className="grid gap-x-8 gap-y-5 border-y py-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="section-label mb-1">Location</dt>
                <dd className="text-lg font-bold">{ticket.location}</dd>
              </div>
              <div>
                <dt className="section-label mb-1">Issue type</dt>
                <dd className="text-lg">{ticket.issueType}</dd>
              </div>
              <div>
                <dt className="section-label mb-1">Submitted</dt>
                <dd className="text-lg">{formatDateTime(ticket.submittedAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="section-label mb-1">Description</dt>
                <dd className="max-w-[70ch] text-lg leading-7">{ticket.description}</dd>
              </div>
              <div>
                <dt className="section-label mb-1">Assigned staff</dt>
                <dd className="text-lg">{ticket.assignedStaff ?? "Not assigned yet"}</dd>
              </div>
            </dl>
          </section>

          {ticket.reworkReason && (
            <section className="mt-6 border-l-2 border-red-700 pl-4" aria-label="Rework reason">
              <h3 className="font-bold text-red-900">Rework requested</h3>
              <p className="mt-1 text-red-900">{ticket.reworkReason}</p>
            </section>
          )}

          {ticket.resolutionNote && (
            <section className="mt-7" aria-labelledby="resolution-note">
              <h3 id="resolution-note" className="section-label mb-2">Cleaning completion note</h3>
              <p className="rounded-xl border bg-card p-5 text-lg leading-7">{ticket.resolutionNote}</p>
            </section>
          )}

          {role === "supervisor" && ticket.status === "Submitted" && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="assign-heading">
              <h2 id="assign-heading" className="text-2xl font-extrabold">Assign this request</h2>
              <p className="mt-1 text-muted-foreground">The selected staff member will see {ticket.id} in My assigned tasks.</p>
              <label className="field-label mt-5" htmlFor={`assign-${ticket.id}`}>Cleaning staff</label>
              <select
                id={`assign-${ticket.id}`}
                className="field-input"
                value={selectedStaff}
                onChange={(event) => setSelectedStaff(event.target.value)}
              >
                {STAFF_MEMBERS.map((staff) => <option key={staff}>{staff}</option>)}
              </select>
              <AppButton className="mt-5 w-full sm:w-auto" onClick={assign} loading={actions.assignStaff.isPending}>
                <UserRoundCheck className="size-5" aria-hidden="true" /> Assign staff
              </AppButton>
            </section>
          )}

          {role === "staff" && ticket.status === "Assigned" && ticket.assignedStaff === staffMember && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6">
              <h2 className="text-2xl font-extrabold">Ready to begin?</h2>
              <p className="mt-1 text-muted-foreground">Start work to update the student and supervisor.</p>
              <AppButton className="mt-5 w-full sm:w-auto" onClick={start} loading={actions.startWork.isPending}>
                <Play className="size-5" aria-hidden="true" /> Start work
              </AppButton>
            </section>
          )}

          {role === "staff" && ticket.status === "In progress" && ticket.assignedStaff === staffMember && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="complete-heading">
              <h2 id="complete-heading" className="text-2xl font-extrabold">Complete this task</h2>
              <label className="field-label mt-5" htmlFor={`resolution-${ticket.id}`}>Work completion note</label>
              <textarea
                id={`resolution-${ticket.id}`}
                className="field-input min-h-32 resize-y"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                required
              />
              {resolution.trim() === "" && <p className="mt-2 font-bold text-red-800">Please enter a completion note.</p>}
              <AppButton
                className="mt-5 w-full sm:w-auto"
                onClick={submitReview}
                loading={actions.submitForReview.isPending}
                disabled={!resolution.trim()}
              >
                <Send className="size-5" aria-hidden="true" /> Submit for review
              </AppButton>
            </section>
          )}

          {role === "supervisor" && ticket.status === "Awaiting review" && (
            <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="review-heading">
              <h2 id="review-heading" className="text-2xl font-extrabold">Review completed work</h2>
              <p className="mt-1 text-muted-foreground">Compare the completion note with the original request.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <AppButton onClick={approve} loading={actions.approveCleaning.isPending} className="sm:flex-1">
                  <Check className="size-5" aria-hidden="true" /> Approve and close
                </AppButton>
                <AppButton variant="danger" onClick={() => setShowRework((value) => !value)} aria-expanded={showRework}>
                  <RotateCcw className="size-5" aria-hidden="true" /> Return for rework
                </AppButton>
              </div>
              {showRework && (
                <div className="mt-6 border-t pt-5">
                  <label className="field-label" htmlFor={`rework-${ticket.id}`}>Reason for rework <span className="text-red-800">(required)</span></label>
                  <textarea
                    id={`rework-${ticket.id}`}
                    className="field-input min-h-28 resize-y"
                    value={reworkReason}
                    aria-invalid={Boolean(reworkError)}
                    aria-describedby={reworkError ? `rework-error-${ticket.id}` : undefined}
                    onChange={(event) => {
                      setReworkReason(event.target.value);
                      if (event.target.value.trim()) setReworkError("");
                    }}
                    placeholder="Explain what the cleaning staff needs to correct."
                    autoFocus
                  />
                  {reworkError && <p id={`rework-error-${ticket.id}`} role="alert" className="mt-2 font-bold text-red-800">{reworkError}</p>}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <AppButton variant="danger" onClick={returnRework} loading={actions.returnForRework.isPending}>Confirm return for rework</AppButton>
                    <AppButton variant="ghost" onClick={() => setShowRework(false)}>Cancel</AppButton>
                  </div>
                </div>
              )}
            </section>
          )}

          {ticket.status === "Closed" && (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
              <ClipboardCheck className="mt-1 size-6 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-extrabold">Work approved</h2>
                <p>This request is closed. Its complete history remains available below.</p>
              </div>
            </div>
          )}
        </div>

        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="mb-5 text-2xl font-extrabold tracking-tight">Activity timeline</h2>
          <ol className="ml-2 border-l-2 border-indigo-200">
            {ticket.timeline.map((event, index) => (
              <li key={event.id} className="relative pb-7 pl-6 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background" aria-hidden="true" />
                <h3 className="font-bold leading-6">{event.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{event.actor} · {formatDateTime(event.timestamp)}</p>
                {event.detail && <p className="mt-2 text-base leading-6">{event.detail}</p>}
                {index === ticket.timeline.length - 1 && <span className="section-label mt-2 inline-block">Latest update</span>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
