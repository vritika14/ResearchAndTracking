export interface DailyActivity {
  day: string;
  tasksCompleted: number;
  notesWritten: number;
}

/** Placeholder rows until the activity API lands — shapes the dashboard chart for the UI pass. */
export const weeklyActivity: DailyActivity[] = [
  { day: "Mon", tasksCompleted: 8, notesWritten: 3 },
  { day: "Tue", tasksCompleted: 6, notesWritten: 4 },
  { day: "Wed", tasksCompleted: 10, notesWritten: 5 },
  { day: "Thu", tasksCompleted: 14, notesWritten: 4 },
  { day: "Fri", tasksCompleted: 9, notesWritten: 6 },
  { day: "Sat", tasksCompleted: 18, notesWritten: 7 },
  { day: "Sun", tasksCompleted: 13, notesWritten: 3 },
];

export const ACTIVITY_Y_MAX = 18;
export const ACTIVITY_Y_TICKS = [0, 9, 18] as const;
