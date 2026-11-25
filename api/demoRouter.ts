import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CAMPUS_LOCATIONS, createInitialDemoData, STAFF_MEMBERS } from "@contracts/demoData";
import type { DemoData } from "@contracts/types";
import { demoState } from "@db/schema";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

const STATE_ID = 1;

function migrateLegacySamples(data: DemoData) {
  const initial = createInitialDemoData();
  const ticketSamples = new Map(initial.tickets.map((ticket) => [ticket.id, ticket]));
  const itemSamples = new Map(initial.items.map((item) => [item.id, item]));
  let changed = false;
  for (const ticket of data.tickets) {
    const sample = ticketSamples.get(ticket.id);
    if (sample && ticket.location !== sample.location) {
      ticket.location = sample.location;
      ticket.description = sample.description;
      changed = true;
    }
  }
  for (const item of data.items) {
    const sample = itemSamples.get(item.id);
    if (sample && item.location !== sample.location) {
      item.location = sample.location;
      changed = true;
    }
  }
  return changed;
}

async function readState(): Promise<DemoData> {
  const db = getDb();
  const rows = await db.select().from(demoState).where(eq(demoState.id, STATE_ID)).limit(1);
  if (rows[0]) {
    const data = rows[0].data;
    if (migrateLegacySamples(data)) {
      await db
        .update(demoState)
        .set({ data, revision: rows[0].revision + 1, updatedAt: new Date() })
        .where(eq(demoState.id, STATE_ID));
    }
    return data;
  }

  const initial = createInitialDemoData();
  await db.insert(demoState).values({ id: STATE_ID, data: initial });
  return initial;
}

async function mutateState(mutator: (data: DemoData) => void): Promise<DemoData> {
  const current = await readState();
  const next = structuredClone(current);
  mutator(next);
  const db = getDb();
  await db
    .update(demoState)
    .set({ data: next, revision: (await db.select().from(demoState).where(eq(demoState.id, STATE_ID)).limit(1))[0].revision + 1, updatedAt: new Date() })
    .where(eq(demoState.id, STATE_ID));
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
    throw new TRPCError({
      code: "CONFLICT",
      message: `${id} cannot be updated from its current status: ${actual}.`,
    });
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

export const demoRouter = createRouter({
  get: publicQuery.query(() => readState()),

  reset: publicQuery.mutation(async () => {
    const initial = createInitialDemoData();
    await readState();
    await getDb()
      .update(demoState)
      .set({ data: initial, revision: 1, updatedAt: new Date() })
      .where(eq(demoState.id, STATE_ID));
    return initial;
  }),

  submitCleaning: publicQuery
    .input(
      z.object({
        location: z.enum(CAMPUS_LOCATIONS as [string, ...string[]]),
        issueType: z.string().min(1),
        description: z.string().min(1).max(1000),
      }),
    )
    .mutation(({ input }) =>
      mutateState((data) => {
        const id = nextId(data.tickets, "CL");
        const timestamp = new Date().toISOString();
        data.tickets.unshift({
          id,
          ...input,
          submittedAt: timestamp,
          status: "Submitted",
          timeline: [
            {
              id: `${id}-1`,
              label: "Request submitted",
              timestamp,
              actor: "Jamie Lee",
            },
          ],
        });
      }),
    ),

  assignStaff: publicQuery
    .input(z.object({ ticketId: z.string(), staff: z.enum(STAFF_MEMBERS as [string, ...string[]]) }))
    .mutation(({ input }) =>
      mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "Submitted", ticket.id);
        ticket.status = "Assigned";
        ticket.assignedStaff = input.staff;
        ticket.reworkReason = undefined;
        ticket.timeline.push(timeline(ticket.id, `Assigned to ${input.staff}`, "Morgan Reed"));
      }),
    ),

  startWork: publicQuery.input(z.object({ ticketId: z.string(), staff: z.string() })).mutation(({ input }) =>
    mutateState((data) => {
      const ticket = getTicket(data, input.ticketId);
      requireStatus(ticket.status, "Assigned", ticket.id);
      ticket.status = "In progress";
      ticket.timeline.push(timeline(ticket.id, "Work started", input.staff));
    }),
  ),

  submitForReview: publicQuery
    .input(z.object({ ticketId: z.string(), staff: z.string(), resolutionNote: z.string().min(1).max(1000) }))
    .mutation(({ input }) =>
      mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "In progress", ticket.id);
        ticket.status = "Awaiting review";
        ticket.resolutionNote = input.resolutionNote;
        ticket.timeline.push(
          timeline(ticket.id, "Submitted for review", input.staff, input.resolutionNote),
        );
      }),
    ),

  approveCleaning: publicQuery.input(z.object({ ticketId: z.string() })).mutation(({ input }) =>
    mutateState((data) => {
      const ticket = getTicket(data, input.ticketId);
      requireStatus(ticket.status, "Awaiting review", ticket.id);
      ticket.status = "Closed";
      ticket.timeline.push(timeline(ticket.id, "Approved and closed", "Morgan Reed"));
    }),
  ),

  returnForRework: publicQuery
    .input(z.object({ ticketId: z.string(), reason: z.string().min(1).max(1000) }))
    .mutation(({ input }) =>
      mutateState((data) => {
        const ticket = getTicket(data, input.ticketId);
        requireStatus(ticket.status, "Awaiting review", ticket.id);
        ticket.status = "Assigned";
        ticket.reworkReason = input.reason;
        ticket.timeline.push(timeline(ticket.id, "Returned for rework", "Morgan Reed", input.reason));
      }),
    ),

  submitClaim: publicQuery
    .input(z.object({ itemId: z.string(), description: z.string().min(1).max(1000) }))
    .mutation(({ input }) =>
      mutateState((data) => {
        const item = data.items.find((entry) => entry.id === input.itemId);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "This found item was not found." });
        const id = nextId(data.claims, "CLM");
        const timestamp = new Date().toISOString();
        data.claims.unshift({
          id,
          itemId: item.id,
          claimantName: "Jamie Lee",
          description: input.description,
          submittedAt: timestamp,
          status: "Pending verification",
        });
      }),
    ),

  decideClaim: publicQuery
    .input(
      z.object({
        claimId: z.string(),
        decision: z.enum(["approve", "reject"]),
        publicNote: z.string().max(1000).optional(),
      }),
    )
    .mutation(({ input }) =>
      mutateState((data) => {
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
      }),
    ),

  recordReturn: publicQuery
    .input(z.object({ claimId: z.string(), handler: z.string().min(1).max(100) }))
    .mutation(({ input }) =>
      mutateState((data) => {
        const claim = getClaim(data, input.claimId);
        requireStatus(claim.status, "Approved – ready for collection", claim.id);
        const item = data.items.find((entry) => entry.id === claim.itemId);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "The found item was not found." });
        claim.status = "Returned";
        claim.returnedAt = new Date().toISOString();
        claim.returnedBy = input.handler;
        item.status = "Returned";
      }),
    ),
});
