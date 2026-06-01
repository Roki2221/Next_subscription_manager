import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names without conflicting utility collisions. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
