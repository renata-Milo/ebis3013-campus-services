import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, ClipboardPlus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CLASSROOMS_BY_BUILDING, TEACHING_BUILDINGS } from "@contracts/demoData";
import type { DemoData } from "@contracts/types";
import type { DemoActions } from "@/hooks/useDemoActions";
import { formatDateTime } from "@/lib/format";
import { go } from "@/lib/router";
import { useI18n } from "@/lib/i18n";
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
  const { text } = useI18n();
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
        <PageHeader eyebrow="Cleaning request" title={ticket.id} description={text(ticket.issueType)} />
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
  const { t } = useI18n();
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
          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-0.025em]">{t("Report a cleaning issue")}</h2>
          <p className="mt-3 max-w-md text-lg text-muted-foreground">{t("Tell us where help is needed and follow the request through to completion.")}</p>
          <AppButton className="mt-7 w-full sm:w-auto" onClick={() => go("student", "cleaning", "new")}>
            {t("Report a cleaning issue")} <ArrowRight className="size-5" aria-hidden="true" />
          </AppButton>
        </section>
        <section className="rounded-xl border bg-card p-6 md:col-span-5 md:p-8">
          <Search className="size-9 text-primary" strokeWidth={1.6} aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-0.025em]">{t("Find a lost item")}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t("Search public found-item records and request ownership verification.")}</p>
          <AppButton variant="secondary" className="mt-7 w-full sm:w-auto" onClick={() => go("student", "lost")}>
            {t("Search found items")} <ArrowRight className="size-5" aria-hidden="true" />
          </AppButton>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="my-records-heading">
        <div className="flex flex-col gap-4 border-b sm:flex-row sm:items-end sm:justify-between">
          <h2 id="my-records-heading" className="pb-4 text-2xl font-extrabold tracking-tight md:text-3xl">{t("My requests and claims")}</h2>
          <div className="flex gap-2" role="tablist" aria-label={t("My records", "我的记录")}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "requests"}
              onClick={() => setTab("requests")}
              className={cn("min-h-11 rounded-t-lg border-b-2 px-4 font-bold", tab === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              {t("Requests")} · {data.tickets.length}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "claims"}
              onClick={() => setTab("claims")}
              className={cn("min-h-11 rounded-t-lg border-b-2 px-4 font-bold", tab === "claims" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            >
              {t("Claims")} · {data.claims.length}
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

const DEFAULT_ISSUE_DESCRIPTION = {
  en: "Water has collected near the entrance after the rain.",
  zh: "雨后教室入口附近有积水。",
};

function CleaningForm({ actions }: { actions: DemoActions }) {
  const { t, text, language } = useI18n();
  const [building, setBuilding] = useState("");
  const [classroom, setClassroom] = useState("");
  const location = classroom;
  const [issueType, setIssueType] = useState("Wet floor");
  const [description, setDescription] = useState(DEFAULT_ISSUE_DESCRIPTION[language]);

  useEffect(() => {
    setDescription((current) => {
      if (current === DEFAULT_ISSUE_DESCRIPTION.en || current === DEFAULT_ISSUE_DESCRIPTION.zh) {
        return DEFAULT_ISSUE_DESCRIPTION[language];
      }
      return current;
    });
  }, [language]);
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
    toast.success(t(`Request submitted as ${ticket.id}.`, `工单 ${ticket.id} 提交成功。`));
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
        <fieldset>
          <legend className="field-label">{t("Location")} <span className="text-red-800">*</span></legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cleaning-building" className="sr-only">{t("Teaching building", "教学楼")}</label>
              <select
                id="cleaning-building"
                className="field-input"
                value={building}
                required
                aria-invalid={Boolean(locationError)}
                aria-describedby={locationError ? "location-error" : "classroom-hint"}
                onChange={(event) => {
                  setBuilding(event.target.value);
                  setClassroom("");
                  if (event.target.value) setLocationError("");
                }}
              >
                <option value="">{t("Select teaching building", "选择教学楼")}</option>
                {TEACHING_BUILDINGS.map((entry) => (
                  <option key={entry.id} value={entry.id}>{t(`${entry.id} · Teaching building`, `${entry.id} 教学楼`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cleaning-classroom" className="sr-only">{t("Classroom", "教室")}</label>
              <select
                id="cleaning-classroom"
                className="field-input"
                value={classroom}
                required
                disabled={!building}
                aria-invalid={Boolean(locationError)}
                aria-describedby={locationError ? "location-error" : "classroom-hint"}
                onChange={(event) => {
                  setClassroom(event.target.value);
                  if (event.target.value) setLocationError("");
                }}
              >
                <option value="">{building ? t("Select classroom", "选择教室") : t("Select a building first", "请先选择教学楼")}</option>
                {building && CLASSROOMS_BY_BUILDING[building].map((entry) => <option key={entry}>{entry}</option>)}
              </select>
            </div>
          </div>
          <p id="classroom-hint" className="mt-2 text-sm text-muted-foreground">{t("Classrooms in T1–T8 are available. Demo examples use T4–T8, such as T4-306.", "可选择 T1–T8 的教室；演示示例使用 T4–T8，例如 T4-306。")}</p>
          {locationError && <p id="location-error" role="alert" className="mt-2 font-bold text-red-800">{t(locationError)}</p>}
        </fieldset>
        <div className="mt-6">
          <label htmlFor="issue-type" className="field-label">{t("Issue type")}</label>
          <select id="issue-type" className="field-input" value={issueType} onChange={(event) => setIssueType(event.target.value)}>
            {["Wet floor", "Overflowing bin", "Spilled drink", "Dust and debris", "Washroom supplies", "Other"].map((entry) => (
              <option key={entry} value={entry}>{text(entry)}</option>
            ))}
          </select>
        </div>
        <div className="mt-6">
          <label htmlFor="issue-description" className="field-label">{t("Description")}</label>
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
          {descriptionError && <p id="description-error" role="alert" className="mt-2 font-bold text-red-800">{t(descriptionError)}</p>}
        </div>
        <div className="mt-7 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center">
          <AppButton type="submit" loading={actions.submitCleaning.isPending}>{t("Submit cleaning request")}</AppButton>
          <AppButton variant="ghost" onClick={() => go("student", "home")}>{t("Cancel")}</AppButton>
        </div>
      </form>
    </div>
  );
}

function CleaningSubmitted({ data, ticketId }: { data: DemoData; ticketId: string }) {
  const { t } = useI18n();
  const ticket = data.tickets.find((entry) => entry.id === ticketId);
  if (!ticket) return <NotFound message="This cleaning request is not in the demo data." />;
  return (
    <div className="mx-auto max-w-3xl py-4 md:py-10">
      <CheckCircle2 className="size-14 text-emerald-700" strokeWidth={1.6} aria-hidden="true" />
      <p className="section-label mt-6">{t("Cleaning request")}</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em] md:text-5xl">{t("Request submitted")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("Your request is now visible in the supervisor’s Unassigned requests queue.")}</p>
      <div className="my-8 border-y py-7">
        <p className="section-label mb-2">{t("Ticket number")}</p>
        <p className="font-mono text-4xl font-extrabold tracking-tight text-primary md:text-5xl">{ticket.id}</p>
        <p className="mt-4 text-lg font-bold">{ticket.location}</p>
        <div className="mt-3"><StatusBadge status={ticket.status} /></div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <AppButton onClick={() => go("student", "cleaning", ticket.id)}>
          {t("View progress")} <ArrowRight className="size-5" aria-hidden="true" />
        </AppButton>
        <AppButton variant="secondary" onClick={() => go("supervisor", "home")}>{t("Switch to Cleaning Supervisor")}</AppButton>
      </div>
    </div>
  );
}

function LostItemSearch({ data }: { data: DemoData }) {
  const { t, text } = useI18n();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All locations");
  const [building, setBuilding] = useState("");
  const [classroom, setClassroom] = useState("");
  const [search, setSearch] = useState({ keyword: "", location: "All locations", building: "", classroom: "" });
  const locations = [
    "All locations",
    "Classroom",
    ...Array.from(new Set(data.items.map((item) => item.location).filter((entry) => !entry.startsWith("T")))),
  ];
  const tokens = search.keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = data.items.filter((item) => {
    if (item.status === "Returned") return false;
    if (search.location === "Classroom") {
      if (!item.location.startsWith("T")) return false;
      if (search.building && !item.location.startsWith(`${search.building}-`)) return false;
      if (search.classroom && item.location !== search.classroom) return false;
    } else if (search.location !== "All locations" && item.location !== search.location) {
      return false;
    }
    const haystack = `${item.name} ${item.location} ${item.publicDescription} ${text(item.name)} ${text(item.location)} ${text(item.publicDescription)}`.toLowerCase();
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
          setSearch({ keyword, location, building: location === "Classroom" ? building : "", classroom: location === "Classroom" ? classroom : "" });
        }}
      >
        <div>
          <label htmlFor="item-keyword" className="field-label">{t("Keyword")}</label>
          <input
            id="item-keyword"
            type="search"
            className="field-input"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("Try “blue bottle”", "试试“蓝色水瓶”")}
          />
        </div>
        <div>
          <label htmlFor="item-location" className="field-label">{t("Location")}</label>
          <select
            id="item-location"
            className="field-input"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              setBuilding("");
              setClassroom("");
            }}
          >
            {locations.map((entry) => (
              <option key={entry} value={entry}>
                {entry === "Classroom" ? t("Classroom", "教室") : entry === "All locations" ? t(entry) : text(entry)}
              </option>
            ))}
          </select>
        </div>
        <AppButton type="submit" className="w-full md:w-auto"><Search className="size-5" aria-hidden="true" /> {t("Search")}</AppButton>
        {location === "Classroom" && (
          <fieldset className="grid gap-5 border-t pt-5 sm:grid-cols-2 md:col-span-3">
            <legend className="sr-only">{t("Classroom location", "教室地点")}</legend>
            <div>
              <label htmlFor="item-building" className="field-label">{t("Teaching building", "教学楼")}</label>
              <select
                id="item-building"
                className="field-input"
                value={building}
                onChange={(event) => {
                  setBuilding(event.target.value);
                  setClassroom("");
                }}
              >
                <option value="">{t("All teaching buildings", "全部教学楼")}</option>
                {TEACHING_BUILDINGS.map((entry) => (
                  <option key={entry.id} value={entry.id}>{t(`${entry.id} · Teaching building`, `${entry.id} 教学楼`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="item-classroom" className="field-label">{t("Classroom", "教室")}</label>
              <select
                id="item-classroom"
                className="field-input"
                value={classroom}
                disabled={!building}
                onChange={(event) => setClassroom(event.target.value)}
              >
                <option value="">{building ? t("All classrooms in this building", "该教学楼全部教室") : t("Select a building first", "请先选择教学楼")}</option>
                {building && CLASSROOMS_BY_BUILDING[building].map((entry) => <option key={entry}>{entry}</option>)}
              </select>
            </div>
            <p className="text-sm text-muted-foreground sm:col-span-2">{t("Choose a building to narrow the search to one classroom.", "选择教学楼后，可进一步筛选到具体教室。")}</p>
          </fieldset>
        )}
      </form>

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{t("Found items")}</h2>
        <p className="text-muted-foreground" aria-live="polite">{results.length} {t(results.length === 1 ? "result" : "results", "条结果")}</p>
      </div>
      {results.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {results.map((item) => (
            <article key={item.id} className="panel flex flex-col p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <ItemIcon item={item} className="text-primary" />
                <span className="record-id">{item.id}</span>
              </div>
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight">{text(item.name)}</h3>
              <ItemMeta item={item} />
              <AppButton variant="secondary" className="mt-6 w-full" onClick={() => go("student", "lost", item.id)}>
                {t("View item")} <ArrowRight className="size-5" aria-hidden="true" />
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
  const { t, text } = useI18n();
  const ownClaim = data.claims.find((claim) => claim.itemId === item.id && claim.status !== "Rejected");
  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "lost")} label="Back to search results" />
      <PageHeader eyebrow={`${t("Found item")} · ${item.id}`} title={text(item.name)} description="Public found-item record" />
      <div className="panel grid gap-7 p-6 md:grid-cols-[180px_minmax(0,1fr)] md:p-8">
        <div className="flex h-40 items-center justify-center rounded-xl bg-secondary md:h-full">
          <ItemIcon item={item} className="size-24 text-primary" />
        </div>
        <div>
          <StatusBadge status={item.status} />
          <ItemMeta item={item} />
          <h2 className="section-label mb-2 mt-7">{t("Appearance")}</h2>
          <p className="text-lg leading-7">{text(item.publicDescription)}</p>
          {item.status !== "Returned" && !ownClaim && (
            <AppButton className="mt-7 w-full sm:w-auto" onClick={() => go("student", "claim", "new", item.id)}>
              {t("Claim this item")} <ArrowRight className="size-5" aria-hidden="true" />
            </AppButton>
          )}
          {ownClaim && (
            <AppButton variant="secondary" className="mt-7 w-full sm:w-auto" onClick={() => go("student", "claim", ownClaim.id)}>
              {t("View my claim")} · {ownClaim.id}
            </AppButton>
          )}
        </div>
      </div>
      <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        {t("Additional identifying details are reviewed privately by the Lost-and-Found Administrator.")}
      </p>
    </div>
  );
}

function ClaimForm({ item, actions }: { item: import("@contracts/types").FoundItem; actions: DemoActions }) {
  const { t, text } = useI18n();
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
    toast.success(t(`Claim submitted as ${claim.id}.`, `认领申请 ${claim.id} 提交成功。`));
    go("student", "claim", "submitted", claim.id);
  };
  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "lost", item.id)} label={`Back to ${item.id}`} />
      <PageHeader eyebrow={`${t("Claim", "认领")} · ${item.id}`} title="Claim this item" description={`${text(item.name)} · ${text(item.location)}`} />
      <div className="mb-6 rounded-xl border bg-card p-5">
        <h2 className="font-bold">{t("Public item description")}</h2>
        <p className="mt-1 text-muted-foreground">{text(item.publicDescription)}</p>
      </div>
      <form onSubmit={submit} noValidate className="panel p-5 md:p-8">
        <label htmlFor="claim-description" className="field-label text-lg">
          {t("Describe a detail that can help us verify ownership.")}
        </label>
        <p className="mb-3 text-muted-foreground">{t("Do not include passwords or other sensitive information.")}</p>
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
          placeholder={t("Describe a marking, contents, or another identifying detail.", "描述标记、内含物或其他识别特征。")}
        />
        {error && <p id="claim-description-error" role="alert" className="mt-2 font-bold text-red-800">{t(error)}</p>}
        <AppButton type="submit" className="mt-6" loading={actions.submitClaim.isPending}>{t("Submit ownership claim")}</AppButton>
      </form>
    </div>
  );
}

function ClaimSubmitted({ data, claimId }: { data: DemoData; claimId: string }) {
  const { t, text } = useI18n();
  const claim = data.claims.find((entry) => entry.id === claimId);
  const item = data.items.find((entry) => entry.id === claim?.itemId);
  if (!claim) return <NotFound message="This claim is not in the demo data." />;
  return (
    <div className="mx-auto max-w-3xl py-4 md:py-10">
      <CheckCircle2 className="size-14 text-emerald-700" strokeWidth={1.6} aria-hidden="true" />
      <p className="section-label mt-6">{t("Ownership claim", "所有权认领")}</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em] md:text-5xl">{t("Claim submitted")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("The administrator can now compare your description with the private found-item note.")}</p>
      <div className="my-8 border-y py-7">
        <p className="section-label mb-2">{t("Claim number")}</p>
        <p className="font-mono text-4xl font-extrabold tracking-tight text-primary md:text-5xl">{claim.id}</p>
        <p className="mt-4 text-lg font-bold">{text(item?.name ?? "")} · {text(item?.location ?? "")}</p>
        <div className="mt-3"><StatusBadge status={claim.status} /></div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <AppButton onClick={() => go("student", "claim", claim.id)}>{t("View my claim")} <ArrowRight className="size-5" aria-hidden="true" /></AppButton>
        <AppButton variant="secondary" onClick={() => go("admin", "home")}>{t("Switch to Lost-and-Found Administrator")}</AppButton>
      </div>
    </div>
  );
}

function StudentClaim({ data, claimId }: { data: DemoData; claimId: string }) {
  const { t, text } = useI18n();
  const claim = data.claims.find((entry) => entry.id === claimId)!;
  const item = data.items.find((entry) => entry.id === claim.itemId);
  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => go("student", "home")} label="Back to my claims" />
      <PageHeader eyebrow="My ownership claim" title={claim.id} description={`${text(item?.name ?? claim.itemId)} · ${text(item?.location ?? "")}`} />
      <section className="rounded-xl border border-indigo-200 bg-secondary p-5 md:p-6">
        <p className="section-label mb-3">{t("Current status")}</p>
        <StatusBadge status={claim.status} />
        {claim.status === "Approved – ready for collection" && (
          <p className="mt-4 text-lg font-bold">{t(`Ready for collection at the ${item?.location} service desk. Please bring your student card.`, `请前往${text(item?.location ?? "")}服务台领取，并携带学生卡。`)}</p>
        )}
        {claim.status === "Pending verification" && <p className="mt-4 text-lg">{t("Next action by Lost-and-Found Administrator.")}</p>}
        {claim.status === "Returned" && <p className="mt-4 text-lg font-bold">{t("This item has been returned to you.")}</p>}
      </section>
      <dl className="mt-7 grid gap-6 border-y py-6 sm:grid-cols-2">
        <div>
          <dt className="section-label mb-1">{t("Submitted")}</dt>
          <dd className="text-lg">{formatDateTime(claim.submittedAt)}</dd>
        </div>
        <div>
          <dt className="section-label mb-1">{t("Found item")}</dt>
          <dd className="text-lg">{item?.id} · {text(item?.name ?? "")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="section-label mb-1">{t("Your ownership description")}</dt>
          <dd className="text-lg leading-7">{text(claim.description)}</dd>
        </div>
      </dl>
      {claim.decisionNote && (
        <section className="mt-7">
          <h2 className="text-2xl font-extrabold">{t("Administrator update")}</h2>
          <p className="mt-3 rounded-xl border bg-card p-5 text-lg leading-7">{text(claim.decisionNote)}</p>
          {claim.decidedAt && <p className="mt-2 text-sm text-muted-foreground">{t("Updated", "更新于")} {formatDateTime(claim.decidedAt)}</p>}
        </section>
      )}
      {claim.returnedAt && (
        <section className="mt-7 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
          <h2 className="text-2xl font-extrabold">{t("Return recorded")}</h2>
          <p className="mt-2 text-lg">{formatDateTime(claim.returnedAt)} · {t("Handled by")} {claim.returnedBy}</p>
        </section>
      )}
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <div className="py-10">
      <PageHeader eyebrow="Record unavailable" title="Nothing to show here" description={t(message, "当前演示数据中不存在该记录。")} />
      <AppButton onClick={() => go("student", "home")}>{t("Return to student home")}</AppButton>
    </div>
  );
}
