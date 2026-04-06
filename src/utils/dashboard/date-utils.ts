/**
 * Utility to parse strings or Date objects into a Date object representing the LOCAL date.
 * This avoids the common issue where "2024-05-20" is interpreted as UTC midnight,
 * which in UTC-5 (Peru/EST) becomes 19:00:00 on May 19th.
 */
export function parseLocalDate(dateInput: string | Date | number): Date {
  if (!dateInput) return new Date();
  
  // If it's a string like "YYYY-MM-DD" or "DD/MM/YYYY", manually parse it as local components
  if (typeof dateInput === "string") {
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split("-").map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    // Format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
      const [day, month, year] = dateInput.split("/").map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
  }
  
  const date = new Date(dateInput);
  
  // If the date is exactly midnight UTC (common for database date strings), 
  // it likely originated from a "YYYY-MM-DD" format.
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  
  return date;
}
