export interface ParsedDateRange {
  start: Date;
  end: Date;
  rangeType: "today" | "7d" | "30d" | "custom";
  buckets: Array<{ date: string; label: string }>;
}

export function parseDateRange(
  range?: string,
  startDate?: string,
  endDate?: string
): ParsedDateRange {
  const now = new Date();
  const rangeType = (range as "today" | "7d" | "30d" | "custom") || "7d";

  let start: Date;
  let end: Date = new Date(now);

  if (rangeType === "today") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (rangeType === "30d") {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
  } else if (rangeType === "custom" && startDate && endDate) {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
      start = parsedStart;
      start.setHours(0, 0, 0, 0);
      end = parsedEnd;
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    }
  } else {
    // default 7d
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
  }

  // Generate date buckets
  const buckets: Array<{ date: string; label: string }> = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const label = current.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!buckets.some((b) => b.date === dateStr)) {
      buckets.push({ date: dateStr, label });
    }
    current.setDate(current.getDate() + 1);
  }

  return { start, end, rangeType, buckets };
}

