import type { DemoData, TimelineEvent } from "./types";

export const STAFF_MEMBERS = ["Maya Chen", "Leo Martins", "Priya Nair"];

export const CAMPUS_LOCATIONS = [
  "Library – Level 2 Entrance",
  "Student Centre – North Lobby",
  "Innovation Hub – Studio 3",
  "Science Block – Lab 1 Corridor",
  "Sports Hall – Changing Room B",
];

const event = (
  id: string,
  label: string,
  timestamp: string,
  actor: string,
  detail?: string,
): TimelineEvent => ({ id, label, timestamp, actor, detail });

export function createInitialDemoData(): DemoData {
  return {
    tickets: [
      {
        id: "CL-104",
        location: "Sports Hall – Changing Room B",
        issueType: "Wet floor",
        description: "Water was tracked in from the pool corridor.",
        submittedAt: "2026-11-24T09:10:00.000Z",
        status: "Awaiting review",
        assignedStaff: "Maya Chen",
        resolutionNote: "Floor dried and warning sign removed.",
        timeline: [
          event("CL-104-1", "Request submitted", "2026-11-24T09:10:00.000Z", "Jamie Lee"),
          event("CL-104-2", "Assigned to Maya Chen", "2026-11-24T09:18:00.000Z", "Morgan Reed"),
          event("CL-104-3", "Work started", "2026-11-24T09:31:00.000Z", "Maya Chen"),
          event(
            "CL-104-4",
            "Submitted for review",
            "2026-11-24T09:52:00.000Z",
            "Maya Chen",
            "Floor dried and warning sign removed.",
          ),
        ],
      },
      {
        id: "CL-103",
        location: "Science Block – Lab 1 Corridor",
        issueType: "Dust and debris",
        description: "Packaging debris is scattered beside the lab entrance.",
        submittedAt: "2026-11-24T08:35:00.000Z",
        status: "In progress",
        assignedStaff: "Maya Chen",
        timeline: [
          event("CL-103-1", "Request submitted", "2026-11-24T08:35:00.000Z", "Jamie Lee"),
          event("CL-103-2", "Assigned to Maya Chen", "2026-11-24T08:44:00.000Z", "Morgan Reed"),
          event("CL-103-3", "Work started", "2026-11-24T08:58:00.000Z", "Maya Chen"),
        ],
      },
      {
        id: "CL-102",
        location: "Student Centre – North Lobby",
        issueType: "Overflowing bin",
        description: "The recycling bin beside the lockers is full.",
        submittedAt: "2026-11-24T08:05:00.000Z",
        status: "Assigned",
        assignedStaff: "Maya Chen",
        timeline: [
          event("CL-102-1", "Request submitted", "2026-11-24T08:05:00.000Z", "Jamie Lee"),
          event("CL-102-2", "Assigned to Maya Chen", "2026-11-24T08:15:00.000Z", "Morgan Reed"),
        ],
      },
      {
        id: "CL-101",
        location: "Innovation Hub – Studio 3",
        issueType: "Spilled drink",
        description: "A drink has spilled under the shared worktable.",
        submittedAt: "2026-11-24T07:50:00.000Z",
        status: "Submitted",
        timeline: [
          event("CL-101-1", "Request submitted", "2026-11-24T07:50:00.000Z", "Jamie Lee"),
        ],
      },
      {
        id: "CL-100",
        location: "Library – Level 2 Entrance",
        issueType: "Wet floor",
        description: "Rainwater collected inside the main entrance.",
        submittedAt: "2026-11-23T15:20:00.000Z",
        status: "Closed",
        assignedStaff: "Leo Martins",
        resolutionNote: "Entrance dried and mat repositioned.",
        timeline: [
          event("CL-100-1", "Request submitted", "2026-11-23T15:20:00.000Z", "Jamie Lee"),
          event("CL-100-2", "Assigned to Leo Martins", "2026-11-23T15:28:00.000Z", "Morgan Reed"),
          event("CL-100-3", "Work started", "2026-11-23T15:40:00.000Z", "Leo Martins"),
          event("CL-100-4", "Submitted for review", "2026-11-23T15:55:00.000Z", "Leo Martins"),
          event("CL-100-5", "Approved and closed", "2026-11-23T16:05:00.000Z", "Morgan Reed"),
        ],
      },
    ],
    items: [
      {
        id: "LF-024",
        name: "Blue water bottle",
        location: "Library",
        foundDate: "2026-11-24",
        publicDescription: "Reusable blue metal bottle with a narrow neck and black cap.",
        privateNote: "Small star sticker on the bottom",
        status: "Available",
      },
      {
        id: "LF-025",
        name: "Black umbrella",
        location: "Student Centre",
        foundDate: "2026-11-24",
        publicDescription: "Compact black folding umbrella with a curved handle.",
        privateNote: "Red thread tied inside the handle",
        status: "Available",
      },
      {
        id: "LF-022",
        name: "Grey wireless earbuds",
        location: "Innovation Hub",
        foundDate: "2026-11-22",
        publicDescription: "Grey earbuds in a small rounded charging case.",
        privateNote: "Initials J L etched inside the case",
        status: "Awaiting collection",
      },
      {
        id: "LF-018",
        name: "Green notebook",
        location: "Library",
        foundDate: "2026-11-18",
        publicDescription: "A5 green notebook with lined pages and an elastic band.",
        privateNote: "A train ticket is tucked into the back cover",
        status: "Returned",
      },
    ],
    claims: [
      {
        id: "CLM-018",
        itemId: "LF-025",
        claimantName: "Jamie Lee",
        description: "There is red thread tied inside the handle.",
        submittedAt: "2026-11-24T10:20:00.000Z",
        status: "Pending verification",
      },
      {
        id: "CLM-017",
        itemId: "LF-022",
        claimantName: "Jamie Lee",
        description: "My initials J L are etched inside the charging case.",
        submittedAt: "2026-11-23T11:10:00.000Z",
        status: "Approved – ready for collection",
        decisionNote: "Ownership verified. Please bring your student card.",
        decidedAt: "2026-11-23T11:45:00.000Z",
      },
      {
        id: "CLM-011",
        itemId: "LF-018",
        claimantName: "Jamie Lee",
        description: "There is a train ticket in the back cover.",
        submittedAt: "2026-11-19T09:00:00.000Z",
        status: "Returned",
        decisionNote: "Ownership verified.",
        decidedAt: "2026-11-19T09:20:00.000Z",
        returnedAt: "2026-11-19T13:30:00.000Z",
        returnedBy: "Alex Morgan",
      },
    ],
  };
}
