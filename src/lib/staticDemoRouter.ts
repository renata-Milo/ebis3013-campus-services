import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { CAMPUS_LOCATIONS, createInitialDemoData, STAFF_MEMBERS } from "@contracts/demoData";
import type { DemoData } from "@contracts/types";

const STORAGE_KEY = "ebis3013-campus-demo-v1";
const t = initTRPC.create({ transformer: superjson, allowOutsideOfServer: true });

function readState(): DemoData {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved) as DemoData;
  const initial = createInitialDemoData();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function mutateState(mutator: (data: DemoData) => void): DemoData {
  const next = readState();
  mutator(next);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function getTicket(data: DemoData, id: string) {
  const ticket = data.tickets.find((entry) => entry.id === id);
  if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: `Ticket ${id} was not found.` });
  return ticket;
}

function getClaim(data: DemoData, id: string) {
  const claim = data.claims.find((entry) => entry.id === id);
  if (!claim) throw new TRPCError({ code: "NOT_FOUND", message: `Claim ${id} was not found.` });
  return claim;
}

function requireStatus(actual: string, expected: string, id: string) {
  if (actual !== expected) {
    throw new TRPCError({ code: "CONFLICT", message: `${id} cannot be updated from its current status: ${actual}.` });
  }
}

function nextId(records: { id: string }[], prefix: string) {
  const maximum = records.reduce((max, record) => {
    const value = Number(record.id.replace(`${prefix}-`, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}-${String(maximum + 1).padStart(3, "0")}`;
}

function timeline(id: string, label: string, actor: string, detail?: string) {
  return {
    id: `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    timestamp: new Date().toISOString(),
    actor,
    detail,
  };
}

export const staticDemoRouter = t.router({
  demo: t.router({
    get: t.procedure.query(() => readState()),

    reset: t.procedure.mutation(() => {
      const initial = createInitialDemoData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }),

    submitCleaning: t.procedure
      .input(z.object({
        location: z.enum(CAMPUS_LOCATIONS as [string, ...string[]]),
        issueType: z.string().min(1),
        description: z.string().min(1).max(1000),
      }))
      .mutation(({ input }) => mutateState((data) => {
        const id = nextId(data.tickets, "CL");
        const timestamp = new Date().toISOString();
        data.tickets.unshift({
          id,
          ...input,
          submittedAt: timestamp,
          status: "Submitted",
          timeline: [{ id: `${id}-1`, label: "Request submitted", timestamp, actor: "Jamie Lee" }],
        });
      })),

    assignStaff: t.procedure
      .input(z.object({ ticketId: z.string(), staff: z.enum(STAFF_MEMBERS as [string, ...string[]]) }))
      .mutation(({ input }) => mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "Submitted", ticket.id);
        ticket.status = "Assigned";
        ticket.assignedStaff = input.staff;
        ticket.reworkReason = undefined;
        ticket.timeline.push(timeline(ticket.id, `Assigned to ${input.staff}`, "Morgan Reed"));
      })),

    startWork: t.procedure
      .input(z.object({ ticketId: z.string(), staff: z.string() }))
      .mutation(({ input }) => mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "Assigned", ticket.id);
        ticket.status = "In progress";
        ticket.timeline.push(timeline(ticket.id, "Work started", input.staff));
      })),

    submitForReview: t.procedure
      .input(z.object({ ticketId: z.string(), staff: z.string(), resolutionNote: z.string().min(1).max(1000) }))
      .mutation(({ input }) => mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "In progress", ticket.id);
        ticket.status = "Awaiting review";
        ticket.resolutionNote = input.resolutionNote;
        ticket.timeline.push(timeline(ticket.id, "Submitted for review", input.staff, input.resolutionNote));
      })),

    approveCleaning: t.procedure
      .input(z.object({ ticketId: z.string() }))
      .mutation(({ input }) => mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "Awaiting review", ticket.id);
        ticket.status = "Closed";
        ticket.timeline.push(timeline(ticket.id, "Approved and closed", "Morgan Reed"));
      })),

    returnForRework: t.procedure
      .input(z.object({ ticketId: z.string(), reason: z.string().min(1).max(1000) }))
      .mutation(({ input }) => mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "Awaiting review", ticket.id);
        ticket.status = "Assigned";
        ticket.reworkReason = input.reason;
        ticket.timeline.push(timeline(ticket.id, "Returned for rework", "Morgan Reed", input.reason));
      })),

    submitClaim: t.procedure
      .input(z.object({ itemId: z.string(), description: z.string().min(1).max(1000) }))
      .mutation(({ input }) => mutateState((data) => {
        const item = data.items.find((entry) => entry.id === input.itemId);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "This found item was not found." });
        const id = nextId(data.claims, "CLM");
        data.claims.unshift({
          id,
          itemId: item.id,
          claimantName: "Jamie Lee",
          description: input.description,
          submittedAt: new Date().toISOString(),
          status: "Pending verification",
        });
      })),

    decideClaim: t.procedure
      .input(z.object({
        claimId: z.string(),
        decision: z.enum(["approve", "reject"]),
        publicNote: z.string().max(1000).optional(),
      }))
      .mutation(({ input }) => mutateState((data) => {
        const claim = getClaim(data, input.claimId);
        requireStatus(claim.status, "Pending verification", claim.id);
        const item = data.items.find((entry) => entry.id === claim.itemId);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "The found item was not found." });
        claim.decidedAt = new Date().toISOString();
        if (input.decision === "approve") {
          claim.status = "Approved – ready for collection";
          claim.decisionNote = input.publicNote || "Ownership verified. Please bring your student card.";
          item.status = "Awaiting collection";
        } else {
          if (!input.publicNote?.trim()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Please enter a public explanation." });
          }
          claim.status = "Rejected";
          claim.decisionNote = input.publicNote;
        }
      })),

    recordReturn: t.procedure
      .input(z.object({ claimId: z.string(), handler: z.string().min(1).max(100) }))
      .mutation(({ input }) => mutateState((data) => {
        const claim = getClaim(data, input.claimId);
        requireStatus(claim.status, "Approved – ready for collection", claim.id);
        const item = data.items.find((entry) => entry.id === claim.itemId);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "The found item was not found." });
        claim.status = "Returned";
        claim.returnedAt = new Date().toISOString();
        claim.returnedBy = input.handler;
        item.status = "Returned";
      })),
  }),
});
