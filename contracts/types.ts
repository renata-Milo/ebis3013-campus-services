export * from "./errors";

export type Role = "student" | "supervisor" | "staff" | "admin";

export type CleaningStatus =
  | "Submitted"
  | "Assigned"
  | "In progress"
  | "Awaiting review"
  | "Closed";

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string;
  actor: string;
  detail?: string;
}

export interface CleaningTicket {
  id: string;
  location: string;
  issueType: string;
  description: string;
  submittedAt: string;
  status: CleaningStatus;
  assignedStaff?: string;
  resolutionNote?: string;
  reworkReason?: string;
  timeline: TimelineEvent[];
}

export type FoundItemStatus = "Available" | "Awaiting collection" | "Returned";

export interface FoundItem {
  id: string;
  name: string;
  location: string;
  foundDate: string;
  publicDescription: string;
  privateNote: string;
  status: FoundItemStatus;
}

export type ClaimStatus =
  | "Pending verification"
  | "Approved – ready for collection"
  | "Rejected"
  | "Returned";

export interface Claim {
  id: string;
  itemId: string;
  claimantName: string;
  description: string;
  submittedAt: string;
  status: ClaimStatus;
  decisionNote?: string;
  decidedAt?: string;
  returnedAt?: string;
  returnedBy?: string;
}

export interface DemoData {
  tickets: CleaningTicket[];
  items: FoundItem[];
  claims: Claim[];
}
