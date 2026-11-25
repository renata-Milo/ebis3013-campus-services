import type { DemoData } from "@contracts/types";
import type { DemoActions } from "@/hooks/useDemoActions";
import { go } from "@/lib/router";
import { AppButton } from "@/components/AppButton";
import { BackButton, EmptyState, PageHeader, TicketRow } from "@/components/Common";
import { TicketDetail } from "@/components/TicketDetail";

export function SupervisorPage({ parts, data, actions }: { parts: string[]; data: DemoData; actions: DemoActions }) {
  const [section, id] = parts;
  if (section === "ticket" && id) {
    const ticket = data.tickets.find((entry) => entry.id === id);
    if (!ticket) {
      return (
        <div>
          <PageHeader eyebrow="Cleaning supervisor" title="Request not found" description="This request is not in the current demo data." />
          <AppButton onClick={() => go("supervisor", "home")}>Back to work queues</AppButton>
        </div>
      );
    }
    return (
      <div>
        <BackButton onClick={() => go("supervisor", "home")} label="Back to work queues" />
        <PageHeader eyebrow="Cleaning supervisor · Request" title={ticket.id} description={ticket.issueType} />
        <TicketDetail ticket={ticket} role="supervisor" staffMember="" actions={actions} />
      </div>
    );
  }

  if (section === "all") {
    return (
      <div>
        <PageHeader
          eyebrow="Cleaning supervisor"
          title="All cleaning requests"
          description="Open any ticket to inspect its current status, next action and complete activity timeline."
        />
        <div className="panel px-5 md:px-6">
          {data.tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onClick={() => go("supervisor", "ticket", ticket.id)} />
          ))}
        </div>
      </div>
    );
  }

  const unassigned = data.tickets.filter((ticket) => ticket.status === "Submitted");
  const review = data.tickets.filter((ticket) => ticket.status === "Awaiting review");
  return (
    <div>
      <PageHeader
        eyebrow="Cleaning Supervisor home"
        title="Coordinate cleaning work"
        description="Assign new requests, then review completed work before closing each ticket."
      />
      <section aria-labelledby="unassigned-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="section-label">Queue 01</p>
            <h2 id="unassigned-heading" className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Unassigned requests</h2>
          </div>
          <span className="text-xl font-extrabold text-primary" aria-label={`${unassigned.length} unassigned requests`}>{unassigned.length}</span>
        </div>
        <div className="panel px-5 md:px-6">
          {unassigned.length ? unassigned.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onClick={() => go("supervisor", "ticket", ticket.id)} />
          )) : <EmptyState title="No unassigned requests" description="New student submissions will appear here." />}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="review-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="section-label">Queue 02</p>
            <h2 id="review-heading" className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Awaiting review</h2>
          </div>
          <span className="text-xl font-extrabold text-primary" aria-label={`${review.length} requests awaiting review`}>{review.length}</span>
        </div>
        <div className="panel px-5 md:px-6">
          {review.length ? review.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onClick={() => go("supervisor", "ticket", ticket.id)} />
          )) : <EmptyState title="No work awaiting review" description="Submitted completion notes will appear here." />}
        </div>
      </section>
    </div>
  );
}
