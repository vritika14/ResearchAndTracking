export type SubmissionType = "Abstract" | "Full paper";

export interface ConferenceSubmission {
  id: string;
  acronym: string;
  name: string;
  location: string;
  submissionDue: string;
  daysRemaining: number;
  conferenceDates: string;
  type: SubmissionType;
  linkedPapers: string[];
}

/** Placeholder rows until the conferences API lands — shapes the dashboard table for the UI pass. */
export const conferenceSubmissions: ConferenceSubmission[] = [
  {
    id: "c1",
    acronym: "ASM",
    name: "ASM Microbe 2027",
    location: "Los Angeles, USA",
    submissionDue: "Aug 1, 2026",
    daysRemaining: 3,
    conferenceDates: "Jun 4–8, 2027",
    type: "Abstract",
    linkedPapers: ["PRJ-101", "PRJ-105"],
  },
  {
    id: "c2",
    acronym: "AACR",
    name: "AACR Annual Meeting 2027",
    location: "Chicago, USA",
    submissionDue: "Aug 5, 2026",
    daysRemaining: 7,
    conferenceDates: "Apr 10–14, 2027",
    type: "Full paper",
    linkedPapers: ["PRJ-102"],
  },
  {
    id: "c3",
    acronym: "SFN",
    name: "SfN Annual Meeting 2026",
    location: "San Diego, USA",
    submissionDue: "Aug 12, 2026",
    daysRemaining: 14,
    conferenceDates: "Nov 14–18, 2026",
    type: "Abstract",
    linkedPapers: ["PRJ-103", "PRJ-108"],
  },
  {
    id: "c4",
    acronym: "ASHG",
    name: "ASHG Annual Meeting 2026",
    location: "Boston, USA",
    submissionDue: "Aug 20, 2026",
    daysRemaining: 22,
    conferenceDates: "Oct 20–24, 2026",
    type: "Full paper",
    linkedPapers: ["PRJ-104"],
  },
  {
    id: "c5",
    acronym: "KEY",
    name: "Keystone Symposia: Enzyme Structure & Function",
    location: "Banff, Canada",
    submissionDue: "Sep 10, 2026",
    daysRemaining: 43,
    conferenceDates: "Jan 17–21, 2027",
    type: "Abstract",
    linkedPapers: ["PRJ-101"],
  },
  {
    id: "c6",
    acronym: "ACS",
    name: "ACS Fall National Meeting 2027",
    location: "Washington, D.C., USA",
    submissionDue: "Oct 1, 2026",
    daysRemaining: 64,
    conferenceDates: "Aug 16–20, 2027",
    type: "Full paper",
    linkedPapers: ["PRJ-105", "PRJ-106"],
  },
];
