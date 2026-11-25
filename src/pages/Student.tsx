import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, ClipboardPlus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CAMPUS_LOCATIONS } from "@contracts/demoData";
import type { DemoData } from "@contracts/types";
import type { DemoActions } from "@/hooks/useDemoActions";
import { formatDateTime } from "@/lib/format";
import { go } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AppButton } from "@/components/AppButton";
import {
  BackButton,
  ClaimRow,
  EmptyState,
  ItemIcon,
  ItemMeta,
  PageHeader,
  StatusBadge,
  TicketRow,
} from "@/components/Common";
import { TicketDetail } from "@/components/TicketDetail";

interface StudentProps {
  parts: string[];
  data: DemoData;
  actions: DemoActions;
}

export function StudentPage({ parts, data, actions }: StudentProps) {
  const [section, id, subId] = parts;

  if (section === "cleaning" && id === "new") return <CleaningForm actions={actions} />;
  if (section === "cleaning" && id === "submitted" && subId) {
    return <CleaningSubmitted data={data} ticketId={subId} />;
  }
  if (section === "cleaning" && id) {
    const ticket = data.tickets.find((entry) => entry.id === id);
    if (!ticket) return <NotFound message="This cleaning request is not in the demo data." />;
    return (
      <div>
        <BackButton onClick={() => go("student", "home")} label="Back to my requests" />
        <PageHeader eyebrow="Cleaning request" title={ticket.id} description={ticket.issueType} />
        <TicketDetail ticket={ticket} role="student" staffMember="" actions={actions} />
      </div>
    );
  }
  if (section === "lost" && !id) return <LostItemSearch data={data} />;
  if (section === "lost" && id) {
    const item = data.items.find((entry) => entry.id === id);
    if (!item) return <NotFound message="This found item is not in the demo data." />;
    return <PublicItem item={item} data={data} />;
  }
  if (section === "claim" && id === "new" && subId) {
    const item = data.items.find((entry) => entry.id === subId);
    if (!item) return <NotFound message="This found item is not in the demo data." />;
    return <ClaimForm item={item} actions={actions} />;
  }
  if (section === "claim" && id === "submitted" && subId) return <ClaimSubmitted data={data} claimId={subId} />;
  if (section === "claim" && id) {
    const claim = data.claims.find((entry) => entry.id === id);
    if (!claim) return <NotFound message="This claim is not in the demo data." />;
    return <StudentClaim data={data} claimId={id} />;
  }
  return <StudentHome data={data} />;
}

function StudentHome({ data }: { data: DemoData }) {
  const [tab, setTab] = useState<"requests" | "claims">("requests");
  return (
    <div>
      <PageHeader
        eyebrow="Student home"
        title="How can we help on campus today?"
        description="Report a cleaning problem or search for something you have lost. Your updates stay in one place."
      />

      <div className="grid gap-5 md:grid-cols-12">
        <section className="rounded-xl border border-indigo-200 bg-secondary p-6 md:col-span-7 md:p-8">
          <ClipboardPlus className="size-9 text-primary" strokeWidth={1.6} aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-0.025em]">Report a cleaning issue</h2>
          <p className="mt-3 max-w-md text-lg text-muted-foreground">Tell us where help is needed and follow the request through to completion.</p>
          <AppButton className="mt-7 w-full sm:w-auto" onClick={() => go("student", "cleaning", "new")}>
            Report a cleaning issue <ArrowRight className="size-5" aria-hidden="true" />
          </AppButton>
        </section>
        <section className="rounded-xl border bg-card p-6 md:col-span-5 md:p-8">
          <Search className="size-9 text-primary" strokeWidth={1.6} aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-0.025em]">Find a lost item</h2>
          <p className="mt-3 text-lg text-muted-foreground">Search public found-item records and request ownership verification.</p>
          <AppButton variant="secondary" className="mt-7 w-full sm:w-auto" onClick={() => go("student", "lost")}>
            Search found items <ArrowRight className="size-5" aria-hidden="true" />
          </AppButton>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="my-records-heading">
        <div className="flex flex-col gap-4 border-b sm:flex-row sm:items-end sm:justify-between">
          <h2 id="my-records-heading" className="pb-4 text-2xl font-extrabold tracking-tight md:text-3xl">My requests and claims</h2>
          <div className="flex gap-2" role="tablist" aria-label="My records">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "requests"}
              onClick={() => setTab("requests")}
              className={cn("min-h-11 rounded-t-lg border-b-2 px-4 font-bold", tab === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Requests · {data.tickets.length}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "claims"}
              onClick={() => setTab("claims")}
              className={cn("min-h-11 rounded-t-lg border-b-2 px-4 font-bold", tab === "claims" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              Claims · {data.claims.length}
            </button>
          </div>
        </div>
        <div role="tabpanel" className="panel mt-5 px-5 md:px-6">
          {tab === "requests" ? (
            data.tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} onClick={() => go("student", "cleaning", ticket.id)} />
            ))
          ) : (
            data.claims.map((claim) => (
              <ClaimRow
                key={claim.id}
                claim={claim}
                item={data.items.find((item) => item.id === claim.itemId)}
                onClick={() => go("student", "claim", claim.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function CleaningForm({ actions }: { actions: DemoActions }) {
  const [location, setLocation] = useState("");
  const [issueType, setIssueType] = useState("Wet floor");
  const [description, setDescription] = useState("Water has collected near the entrance after the rain.");
  const [locationError, setLocationError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    let valid = true;
    if (!location) {
      setLocationError("Please select a location.");
      valid = false;
    }
    if (!description.trim()) {
      setDescriptionError("Please describe the issue.");
      valid = false;
    }
    if (!valid) return;

    const updated = await actions.submitCleaning.mutateAsync({
      location,
      issueType,
      description: description.trim(),
    });
    const ticket = updated.tickets[0];
    toast.success(`Request submitted as ${ticket.id}.`);
    go("student", "cleaning", "submitted", ticket.id);
  };

  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "home")} label="Back to overview" />
      <PageHeader
        eyebrow="Student · Cleaning"
        title="Report a cleaning issue"
        description="Give the cleaning team enough detail to find and resolve the problem."
      />
      <form onSubmit={submit} noValidate className="panel p-5 md:p-8">
        <div>
          <label htmlFor="cleaning-location" className="field-label">Location <span className="text-red-800">*</span></label>
          <select
            id="cleaning-location"
            className="field-input"
            value={location}
            required
            aria-invalid={Boolean(locationError)}
            aria-describedby={locationError ? "location-error" : undefined}
            onChange={(event) => {
              setLocation(event.target.value);
              if (event.target.value) setLocationError("");
            }}
          >
            <option value="">Select a location</option>
            {CAMPUS_LOCATIONS.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
          {locationError && <p id="location-error" role="alert" className="mt-2 font-bold text-red-800">{locationError}</p>}
        </div>
        <div className="mt-6">
          <label htmlFor="issue-type" className="field-label">Issue type</label>
          <select id="issue-type" className="field-input" value={issueType} onChange={(event) => setIssueType(event.target.value)}>
            {["Wet floor", "Overflowing bin", "Spilled drink", "Dust and debris", "Washroom supplies", "Other"].map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </div>
        <div className="mt-6">
          <label htmlFor="issue-description" className="field-label">Description</label>
          <textarea
            id="issue-description"
            className="field-input min-h-36 resize-y"
            value={description}
            aria-invalid={Boolean(descriptionError)}
            aria-describedby={descriptionError ? "description-error" : undefined}
            onChange={(event) => {
              setDescription(event.target.value);
              if (event.target.value.trim()) setDescriptionError("");
            }}
          />
          {descriptionError && <p id="description-error" role="alert" className="mt-2 font-bold text-red-800">{descriptionError}</p>}
        </div>
        <div className="mt-7 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center">
          <AppButton type="submit" loading={actions.submitCleaning.isPending}>Submit cleaning request</AppButton>
          <AppButton variant="ghost" onClick={() => go("student", "home")}>Cancel</AppButton>
        </div>
      </form>
    </div>
  );
}

function CleaningSubmitted({ data, ticketId }: { data: DemoData; ticketId: string }) {
  const ticket = data.tickets.find((entry) => entry.id === ticketId);
  if (!ticket) return <NotFound message="This cleaning request is not in the demo data." />;
  return (
    <div className="mx-auto max-w-3xl py-4 md:py-10">
      <CheckCircle2 className="size-14 text-emerald-700" strokeWidth={1.6} aria-hidden="true" />
      <p className="section-label mt-6">Cleaning request</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em] md:text-5xl">Request submitted</h1>
      <p className="mt-4 text-lg text-muted-foreground">Your request is now visible in the supervisor’s Unassigned requests queue.</p>
      <div className="my-8 border-y py-7">
        <p className="section-label mb-2">Ticket number</p>
        <p className="font-mono text-4xl font-extrabold tracking-tight text-primary md:text-5xl">{ticket.id}</p>
        <p className="mt-4 text-lg font-bold">{ticket.location}</p>
        <div className="mt-3"><StatusBadge status={ticket.status} /></div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <AppButton onClick={() => go("student", "cleaning", ticket.id)}>
          View progress <ArrowRight className="size-5" aria-hidden="true" />
        </AppButton>
        <AppButton variant="secondary" onClick={() => go("supervisor", "home")}>Switch to Cleaning Supervisor</AppButton>
      </div>
    </div>
  );
}

function LostItemSearch({ data }: { data: DemoData }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All locations");
  const [search, setSearch] = useState({ keyword: "", location: "All locations" });
  const locations = ["All locations", ...Array.from(new Set(data.items.map((item) => item.location)))];
  const tokens = search.keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = data.items.filter((item) => {
    if (item.status === "Returned") return false;
    if (search.location !== "All locations" && item.location !== search.location) return false;
    const haystack = `${item.name} ${item.location} ${item.publicDescription}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });

  return (
    <div>
      <BackButton onClick={() => go("student", "home")} label="Back to overview" />
      <PageHeader
        eyebrow="Student · Lost and found"
        title="Find a lost item"
        description="Search public details of items handed in around campus. Identifying notes stay private until verification."
      />
      <form
        className="panel grid gap-5 p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(200px,0.8fr)_auto] md:items-end md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch({ keyword, location });
        }}
      >
        <div>
          <label htmlFor="item-keyword" className="field-label">Keyword</label>
          <input
            id="item-keyword"
            type="search"
            className="field-input"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Try “blue bottle”"
          />
        </div>
        <div>
          <label htmlFor="item-location" className="field-label">Location</label>
          <select id="item-location" className="field-input" value={location} onChange={(event) => setLocation(event.target.value)}>
            {locations.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </div>
        <AppButton type="submit" className="w-full md:w-auto"><Search className="size-5" aria-hidden="true" /> Search</AppButton>
      </form>

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">Found items</h2>
        <p className="text-muted-foreground" aria-live="polite">{results.length} {results.length === 1 ? "result" : "results"}</p>
      </div>
      {results.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {results.map((item) => (
            <article key={item.id} className="panel flex flex-col p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <ItemIcon item={item} className="text-primary" />
                <span className="record-id">{item.id}</span>
              </div>
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight">{item.name}</h3>
              <ItemMeta item={item} />
              <AppButton variant="secondary" className="mt-6 w-full" onClick={() => go("student", "lost", item.id)}>
                View item <ArrowRight className="size-5" aria-hidden="true" />
              </AppButton>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No matching items" description="Try a different keyword or location." />
      )}
    </div>
  );
}

function PublicItem({ item, data }: { item: import("@contracts/types").FoundItem; data: DemoData }) {
  const ownClaim = data.claims.find((claim) => claim.itemId === item.id && claim.status !== "Rejected");
  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "lost")} label="Back to search results" />
      <PageHeader eyebrow={`Found item · ${item.id}`} title={item.name} description="Public found-item record" />
      <div className="panel grid gap-7 p-6 md:grid-cols-[180px_minmax(0,1fr)] md:p-8">
        <div className="flex h-40 items-center justify-center rounded-xl bg-secondary md:h-full">
          <ItemIcon item={item} className="size-24 text-primary" />
        </div>
        <div>
          <StatusBadge status={item.status} />
          <ItemMeta item={item} />
          <h2 className="section-label mb-2 mt-7">Appearance</h2>
          <p className="text-lg leading-7">{item.publicDescription}</p>
          {item.status !== "Returned" && !ownClaim && (
            <AppButton className="mt-7 w-full sm:w-auto" onClick={() => go("student", "claim", "new", item.id)}>
              Claim this item <ArrowRight className="size-5" aria-hidden="true" />
            </AppButton>
          )}
          {ownClaim && (
            <AppButton variant="secondary" className="mt-7 w-full sm:w-auto" onClick={() => go("student", "claim", ownClaim.id)}>
              View my claim · {ownClaim.id}
            </AppButton>
          )}
        </div>
      </div>
      <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        Additional identifying details are reviewed privately by the Lost-and-Found Administrator.
      </p>
    </div>
  );
}

function ClaimForm({ item, actions }: { item: import("@contracts/types").FoundItem; actions: DemoActions }) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!description.trim()) {
      setError("Please describe an identifying detail.");
      return;
    }
    const updated = await actions.submitClaim.mutateAsync({ itemId: item.id, description: description.trim() });
    const claim = updated.claims[0];
    toast.success(`Claim submitted as ${claim.id}.`);
    go("student", "claim", "submitted", claim.id);
  };
  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "lost", item.id)} label={`Back to ${item.id}`} />
      <PageHeader eyebrow={`Claim · ${item.id}`} title="Claim this item" description={`${item.name} · ${item.location}`} />
      <div className="mb-6 rounded-xl border bg-card p-5">
        <h2 className="font-bold">Public item description</h2>
        <p className="mt-1 text-muted-foreground">{item.publicDescription}</p>
      </div>
      <form onSubmit={submit} noValidate className="panel p-5 md:p-8">
        <label htmlFor="claim-description" className="field-label text-lg">
          Describe a detail that can help us verify ownership.
        </label>
        <p className="mb-3 text-muted-foreground">Do not include passwords or other sensitive information.</p>
        <textarea
          id="claim-description"
          className="field-input min-h-40 resize-y"
          value={description}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "claim-description-error" : undefined}
          onChange={(event) => {
            setDescription(event.target.value);
            if (event.target.value.trim()) setError("");
          }}
          placeholder="Describe a marking, contents, or another identifying detail."
        />
        {error && <p id="claim-description-error" role="alert" className="mt-2 font-bold text-red-800">{error}</p>}
        <AppButton type="submit" className="mt-6" loading={actions.submitClaim.isPending}>Submit ownership claim</AppButton>
      </form>
    </div>
  );
}

function ClaimSubmitted({ data, claimId }: { data: DemoData; claimId: string }) {
  const claim = data.claims.find((entry) => entry.id === claimId);
  const item = data.items.find((entry) => entry.id === claim?.itemId);
  if (!claim) return <NotFound message="This claim is not in the demo data." />;
  return (
    <div className="mx-auto max-w-3xl py-4 md:py-10">
      <CheckCircle2 className="size-14 text-emerald-700" strokeWidth={1.6} aria-hidden="true" />
      <p className="section-label mt-6">Ownership claim</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em] md:text-5xl">Claim submitted</h1>
      <p className="mt-4 text-lg text-muted-foreground">The administrator can now compare your description with the private found-item note.</p>
      <div className="my-8 border-y py-7">
        <p className="section-label mb-2">Claim number</p>
        <p className="font-mono text-4xl font-extrabold tracking-tight text-primary md:text-5xl">{claim.id}</p>
        <p className="mt-4 text-lg font-bold">{item?.name} · {item?.location}</p>
        <div className="mt-3"><StatusBadge status={claim.status} /></div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <AppButton onClick={() => go("student", "claim", claim.id)}>View my claim <ArrowRight className="size-5" aria-hidden="true" /></AppButton>
        <AppButton variant="secondary" onClick={() => go("admin", "home")}>Switch to Lost-and-Found Administrator</AppButton>
      </div>
    </div>
  );
}

function StudentClaim({ data, claimId }: { data: DemoData; claimId: string }) {
  const claim = data.claims.find((entry) => entry.id === claimId)!;
  const item = data.items.find((entry) => entry.id === claim.itemId);
  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "home")} label="Back to my claims" />
      <PageHeader eyebrow="My ownership claim" title={claim.id} description={`${item?.name ?? claim.itemId} · ${item?.location ?? ""}`} />
      <section className="rounded-xl border border-indigo-200 bg-secondary p-5 md:p-6">
        <p className="section-label mb-3">Current status</p>
        <StatusBadge status={claim.status} />
        {claim.status === "Approved – ready for collection" && (
          <p className="mt-4 text-lg font-bold">Ready for collection at the {item?.location} service desk. Please bring your student card.</p>
        )}
        {claim.status === "Pending verification" && <p className="mt-4 text-lg">Next action by Lost-and-Found Administrator.</p>}
        {claim.status === "Returned" && <p className="mt-4 text-lg font-bold">This item has been returned to you.</p>}
      </section>
      <dl className="mt-7 grid gap-6 border-y py-6 sm:grid-cols-2">
        <div>
          <dt className="section-label mb-1">Submitted</dt>
          <dd className="text-lg">{formatDateTime(claim.submittedAt)}</dd>
        </div>
        <div>
          <dt className="section-label mb-1">Found item</dt>
          <dd className="text-lg">{item?.id} · {item?.name}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="section-label mb-1">Your ownership description</dt>
          <dd className="text-lg leading-7">{claim.description}</dd>
        </div>
      </dl>
      {claim.decisionNote && (
        <section className="mt-7">
          <h2 className="text-2xl font-extrabold">Administrator update</h2>
          <p className="mt-3 rounded-xl border bg-card p-5 text-lg leading-7">{claim.decisionNote}</p>
          {claim.decidedAt && <p className="mt-2 text-sm text-muted-foreground">Updated {formatDateTime(claim.decidedAt)}</p>}
        </section>
      )}
      {claim.returnedAt && (
        <section className="mt-7 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
          <h2 className="text-2xl font-extrabold">Return recorded</h2>
          <p className="mt-2 text-lg">{formatDateTime(claim.returnedAt)} · Handled by {claim.returnedBy}</p>
        </section>
      )}
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="py-10">
      <PageHeader eyebrow="Record unavailable" title="Nothing to show here" description={message} />
      <AppButton onClick={() => go("student", "home")}>Return to student home</AppButton>
    </div>
  );
}
