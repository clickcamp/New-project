import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIST(dateString: string, formatStr: string = "PPP p") {
  if (!dateString) return "";
  try {
    return formatInTimeZone(new Date(dateString), "Asia/Kolkata", formatStr);
  } catch (e) {
    return dateString;
  }
}

export function calculateHours(startStr: string, endStr?: string) {
  if (!startStr) return 0;
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
