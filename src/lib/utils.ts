
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Papa from 'papaparse';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadCsv(data: any[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function safeToDate(date: any): Date | null {
  if (!date) return null;

  // If it's a Firestore Timestamp
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }

  // If it's already a JS Date
  if (date instanceof Date) {
    // Check if the date is valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // If it's a string or number that can be parsed
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return null;
}
