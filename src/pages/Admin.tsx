import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, PackageCheck, RotateCcw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { Claim, DemoData, FoundItem } from "@contracts/types";
import type { DemoActions } from "@/hooks/useDemoActions";
import { formatDate, formatDateTime } from "@/lib/format";
import { go } from "@/lib/router";
import { AppButton } from "@/components/AppButton";
import { BackButton, EmptyState, ItemIcon, PageHeader, StatusBadge } from "@/components/Common";

interface AdminProps {
  parts: string[];
  data: DemoData;
  actions: DemoActions;
}

export function AdminPage({ parts, data, actions }: AdminProps) {
  const [section, id] = parts;
  if (section === "claim" && id) {
    const claim = data.claims.find((entry) => entry.id === id);
    if (!claim) return <AdminNotFound label="This claim is not in the current demo data." />;
    return <AdminClaim data={data} claim={claim} actions={actions} />;
  }
  if (section === "inventory") {
    if (id) {
      const item = data.items.find((entry) => entry.id === id);
      if (!item) return <AdminNotFound label="This item is not in the current demo data." />;
      return <AdminItem data={data} item={item} />;
    }
    return <Inventory data={data} />;
  }
  return <AdminHome data={data} />;
}

function AdminHome({ data }: { data: DemoData }) {
  const pending = data.claims.filter((claim) => claim.status === "Pending verification");
  const awaiting = data.claims.filter((claim) => claim.status === "Approved – ready for collection");
  const returned = data.claims.filter((claim) => claim.status === "Returned");
  const stats = [
    { label: "Pending verification", value: pending.length, note: "Claims needing a decision" },
    { label: "Awaiting collection", value: awaiting.length, note: "Approved and ready to collect" },
    { label: "Returned", value: returned.length, note: "Items returned to owners" },
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Lost-and-Found Administrator home"
        title="Verify claims and coordinate returns"
        description="Compare ownership details privately, make a clear decision, and record each physical handover."
      />
      <div className="grid gap-4 sm:grid-cols-3" aria-label="Service statistics">
        {stats.map((stat) => (
          <section key={stat.label} className="panel p-5">
            <h2 className="text-base font-bold">{stat.label}</h2>
            <p className="mt-3 font-mono text-5xl font-extrabold tracking-[-0.05em] text-primary">{stat.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.note}</p>
          </section>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="pending-claims-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="pending-claims-heading" className="text-2xl font-extrabold tracking-tight md:text-3xl">Claims awaiting verification</h2>
          <span className="text-xl font-extrabold text-primary">{pending.length}</span>
        </div>
        <div className="panel px-5 md:px-6">
          {pending.length ? pending.map((claim) => (
            <AdminClaimRow key={claim.id} claim={claim} item={data.items.find((item) => item.id === claim.itemId)} />
          )) : <EmptyState title="No pending claims" description="New student ownership claims will appear here." />}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="collection-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="collection-heading" className="text-2xl font-extrabold tracking-tight md:text-3xl">Ready for collection</h2>
          <span className="text-xl font-extrabold text-primary">{awaiting.length}</span>
        </div>
        <div className="panel px-5 md:px-6">
          {awaiting.length ? awaiting.map((claim) => (
            <article key={claim.id} className="flex flex-col gap-4 border-b py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="record-id">{claim.id}</span>
                  <span className="text-lg font-bold">{data.items.find((item) => item.id === claim.itemId)?.name}</span>
                </div>
                <p className="mt-1 text-muted-foreground">Approved {claim.decidedAt ? formatDateTime(claim.decidedAt) : ""}</p>
              </div>
              <AppButton variant="secondary" compact onClick={() => go("admin", "claim", claim.id)}>
                Open return record <ArrowRight className="size-4" aria-hidden="true" />
              </AppButton>
            </article>
          )) : <EmptyState title="No approved collections" description="Approved claims will move here." />}
        </div>
      </section>
    </div>
  );
}

function AdminClaimRow({ claim, item }: { claim: Claim; item?: FoundItem }) {
  return (
    <article className="flex flex-col gap-4 border-b py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="record-id">{claim.id}</span>
          <span className="text-lg font-bold">{item?.name ?? claim.itemId}</span>
          <StatusBadge status={claim.status} />
        </div>
        <p className="mt-2 text-muted-foreground">{item?.id} · {item?.location} · Submitted {formatDateTime(claim.submittedAt)}</p>
      </div>
      <AppButton compact onClick={() => go("admin", "claim", claim.id)}>
        Review claim <ArrowRight className="size-4" aria-hidden="true" />
      </AppButton>
    </article>
  );
}

function AdminClaim({ data, claim, actions }: { data: DemoData; claim: Claim; actions: DemoActions }) {
  const item = data.items.find((entry) => entry.id === claim.itemId)!;
  const [showReject, setShowReject] = useState(false);
  const [publicNote, setPublicNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [handler, setHandler] = useState("Alex Morgan");
  const [handlerError, setHandlerError] = useState("");

  const approve = async () => {
    await actions.decideClaim.mutateAsync({ claimId: claim.id, decision: "approve" });
    toast.success(`${claim.id} approved. The student can now collect ${item.id}.`);
  };
  const reject = async () => {
    if (!publicNote.trim()) {
      setRejectError("Please enter an explanation for the applicant.");
      return;
    }
    await actions.decideClaim.mutateAsync({ claimId: claim.id, decision: "reject", publicNote: publicNote.trim() });
    setShowReject(false);
    toast.success(`${claim.id} rejected with a public explanation.`);
  };
  const recordReturn = async (event: FormEvent) => {
    event.preventDefault();
    if (!handler.trim()) {
      setHandlerError("Please enter the handler’s name.");
      return;
    }
    await actions.recordReturn.mutateAsync({ claimId: claim.id, handler: handler.trim() });
    toast.success(`${claim.id} marked as Returned.`);
  };

  return (
    <div>
      <BackButton onClick={() => go("admin", "home")} label="Back to claim review" />
      <PageHeader eyebrow={`Claim verification · ${item.id}`} title={claim.id} description={`${item.name} · ${item.location}`} />
      <section className="mb-7 rounded-xl border border-indigo-200 bg-secondary p-5 md:p-6">
        <p className="section-label mb-3">Current status</p>
        <StatusBadge status={claim.status} />
        {claim.status === "Pending verification" && <p className="mt-3 text-lg font-bold">Next action by Lost-and-Found Administrator.</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2" aria-label="Ownership comparison">
        <section className="panel p-5 md:p-6">
          <p className="section-label">Claimant’s description</p>
          <h2 className="mt-3 text-xl font-extrabold">{claim.claimantName} · {claim.id}</h2>
          <p className="mt-5 text-xl leading-8">{claim.description}</p>
          <p className="mt-5 text-sm text-muted-foreground">Submitted {formatDateTime(claim.submittedAt)}</p>
        </section>
        <section className="rounded-xl border border-indigo-300 bg-secondary p-5 md:p-6">
          <p className="section-label flex items-center gap-2 text-primary"><Eye className="size-4" aria-hidden="true" /> Administrator only</p>
          <h2 className="mt-3 text-xl font-extrabold">Private found-item note</h2>
          <p className="mt-5 text-xl font-bold leading-8">{item.privateNote}</p>
          <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Never copy this identifying note into an applicant-facing reply.
          </p>
        </section>
      </div>

      <section className="mt-7 border-y py-6">
        <h2 className="text-xl font-extrabold">Public item details</h2>
        <p className="mt-2 text-lg">{item.publicDescription}</p>
        <p className="mt-2 text-muted-foreground">Found {formatDate(item.foundDate)} at {item.location}</p>
      </section>

      {claim.status === "Pending verification" && (
        <section className="mt-8 rounded-xl border bg-card p-5 md:p-6" aria-labelledby="decision-heading">
          <h2 id="decision-heading" className="text-2xl font-extrabold">Make a verification decision</h2>
          <p className="mt-1 text-muted-foreground">Approve only when the claimant’s detail matches the private record.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <AppButton onClick={approve} loading={actions.decideClaim.isPending}>
              <Check className="size-5" aria-hidden="true" /> Approve claim
            </AppButton>
            <AppButton variant="danger" onClick={() => setShowReject((value) => !value)} aria-expanded={showReject}>
              <X className="size-5" aria-hidden="true" /> Reject claim
            </AppButton>
          </div>
          {showReject && (
            <div className="mt-6 border-t pt-6">
              <label htmlFor={`public-note-${claim.id}`} className="field-label">Public explanation for the applicant <span className="text-red-800">*</span></label>
              <textarea
                id={`public-note-${claim.id}`}
                className="field-input min-h-32 resize-y"
                value={publicNote}
                aria-invalid={Boolean(rejectError)}
                aria-describedby={rejectError ? `public-note-error-${claim.id}` : undefined}
                onChange={(event) => {
                  setPublicNote(event.target.value);
                  if (event.target.value.trim()) setRejectError("");
                }}
                placeholder="The details provided were insufficient to verify ownership."
                autoFocus
              />
              {rejectError && <p id={`public-note-error-${claim.id}`} role="alert" className="mt-2 font-bold text-red-800">{rejectError}</p>}
              <p className="mt-2 text-sm text-muted-foreground">Do not reveal the correct identifying detail in this message.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <AppButton variant="danger" onClick={reject} loading={actions.decideClaim.isPending}>Confirm rejection</AppButton>
                <AppButton variant="ghost" onClick={() => setShowReject(false)}>Cancel</AppButton>
              </div>
            </div>
          )}
        </section>
      )}

      {claim.decisionNote && claim.status !== "Pending verification" && (
        <section className="mt-7">
          <h2 className="section-label">Applicant-facing decision note</h2>
          <p className="mt-2 rounded-xl border bg-card p-5 text-lg">{claim.decisionNote}</p>
        </section>
      )}

      {claim.status === "Approved – ready for collection" && (
        <form onSubmit={recordReturn} className="mt-8 rounded-xl border bg-card p-5 md:p-6" noValidate>
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-1 size-7 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-extrabold">Record the physical return</h2>
              <p className="mt-1 text-muted-foreground">Use this only after {item.id} has been handed to the claimant.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label htmlFor={`handler-${claim.id}`} className="field-label">Handled by</label>
              <input
                id={`handler-${claim.id}`}
                className="field-input"
                value={handler}
                aria-invalid={Boolean(handlerError)}
                onChange={(event) => {
                  setHandler(event.target.value);
                  if (event.target.value.trim()) setHandlerError("");
                }}
              />
              {handlerError && <p role="alert" className="mt-2 font-bold text-red-800">{handlerError}</p>}
            </div>
            <AppButton type="submit" loading={actions.recordReturn.isPending}>Record return</AppButton>
          </div>
        </form>
      )}

      {claim.status === "Returned" && (
        <section className="mt-8 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 md:p-6">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-1 size-7 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-extrabold">Returned</h2>
              <p className="mt-2 text-lg">{claim.returnedAt ? formatDateTime(claim.returnedAt) : ""} · Handled by {claim.returnedBy}</p>
              <p className="mt-2">The return is complete and cannot be recorded again.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Inventory({ data }: { data: DemoData }) {
  return (
    <div>
      <PageHeader
        eyebrow="Lost-and-Found Administrator"
        title="Found-item records"
        description="Open an item to inspect its public record, private note, claims and return history."
      />
      <div className="panel px-5 md:px-6">
        {data.items.map((item) => (
          <article key={item.id} className="flex flex-col gap-4 border-b py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <ItemIcon item={item} className="mt-1 size-9 shrink-0 text-primary" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="record-id">{item.id}</span>
                  <h2 className="text-lg font-bold">{item.name}</h2>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-muted-foreground">{item.location} · Found {formatDate(item.foundDate)}</p>
              </div>
            </div>
            <AppButton variant="secondary" compact onClick={() => go("admin", "inventory", item.id)}>
              Open item <ArrowRight className="size-4" aria-hidden="true" />
            </AppButton>
          </article>
        ))}
      </div>
    </div>
  );
}

function AdminItem({ data, item }: { data: DemoData; item: FoundItem }) {
  const claims = data.claims.filter((claim) => claim.itemId === item.id);
  const returnedClaim = claims.find((claim) => claim.status === "Returned");
  return (
    <div className="max-w-5xl">
      <BackButton onClick={() => go("admin", "inventory")} label="Back to item records" />
      <PageHeader eyebrow={`Found-item record · ${item.id}`} title={item.name} description={`${item.location} · Found ${formatDate(item.foundDate)}`} />
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex min-h-52 items-center justify-center rounded-xl bg-secondary">
          <ItemIcon item={item} className="size-24 text-primary" />
        </div>
        <div>
          <StatusBadge status={item.status} />
          <section className="mt-6">
            <h2 className="section-label">Public appearance</h2>
            <p className="mt-2 text-lg">{item.publicDescription}</p>
          </section>
          <section className="mt-6 rounded-xl border border-indigo-300 bg-secondary p-5">
            <h2 className="section-label text-primary">Private found-item note · Administrator only</h2>
            <p className="mt-2 text-lg font-bold">{item.privateNote}</p>
          </section>
        </div>
      </div>
      {returnedClaim && (
        <section className="mt-7 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
          <h2 className="text-2xl font-extrabold">Returned</h2>
          <p className="mt-2 text-lg">{returnedClaim.returnedAt ? formatDateTime(returnedClaim.returnedAt) : ""} · Handled by {returnedClaim.returnedBy}</p>
          <p className="mt-1">Return record {returnedClaim.id} · No further return can be registered.</p>
        </section>
      )}
      <section className="mt-9">
        <h2 className="mb-4 text-2xl font-extrabold">Related claims</h2>
        <div className="panel px-5 md:px-6">
          {claims.length ? claims.map((claim) => (
            <AdminClaimRow key={claim.id} claim={claim} item={item} />
          )) : <EmptyState title="No claims for this item" description="Student ownership claims will appear here." />}
        </div>
      </section>
    </div>
  );
}

function AdminNotFound({ label }: { label: string }) {
  return (
    <div>
      <PageHeader eyebrow="Lost-and-Found Administrator" title="Record not found" description={label} />
      <AppButton onClick={() => go("admin", "home")}><RotateCcw className="size-5" aria-hidden="true" /> Back to claim review</AppButton>
    </div>
  );
}
