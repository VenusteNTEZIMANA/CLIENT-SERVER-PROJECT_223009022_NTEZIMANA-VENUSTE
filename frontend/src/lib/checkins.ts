
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export interface CheckIn {
  id: number;
  habit: number;
  completed: boolean;
  note: string;
  date: string;
  created_at: string;
}

export interface StreakAnalytics {
  habit_id: number | null;
  current_streak: number;
  longest_streak: number;
}

export type LongestStreak = StreakAnalytics;

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  if (!session) {
    throw new Error("User not authenticated.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function checkinRequest<T>(
  endpoint = "",
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("Missing VITE_API_URL.");
  }

  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/api/checkins/${endpoint}`,
    {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const errorData: unknown = await response
      .json()
      .catch(() => null);

    const result = errorData as Record<string, unknown> | null;

    throw new Error(
      typeof result?.detail === "string"
        ? result.detail
        : "Check-in request failed."
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// GET ALL CHECK-INS WITH PAGINATION

export async function getCheckIns(): Promise<CheckIn[]> {
  const allCheckIns: CheckIn[] = [];

  let page = 1;

  while (true) {
    const response = await checkinRequest<
      PaginatedResponse<CheckIn> | CheckIn[]
    >(`?page=${page}&page_size=100`);

    if (Array.isArray(response)) {
      allCheckIns.push(...response);
      break;
    }

    allCheckIns.push(...response.results);

    if (!response.next || response.results.length === 0) {
      break;
    }

    page++;
  }

  return allCheckIns;
}

// BACKWARD COMPATIBILITY

export const getCheckins = getCheckIns;

// CREATE CHECK-IN

export async function createCheckIn(
  habitId: number,
  date: string,
  note = ""
): Promise<CheckIn> {
  return checkinRequest<CheckIn>("", {
    method: "POST",
    body: JSON.stringify({
      habit: habitId,
      completed: true,
      note,
      date,
    }),
  });
}

export const createCheckin = createCheckIn;

// DELETE CHECK-IN

export async function deleteCheckin(
  id: number
): Promise<void> {
  await checkinRequest<void>(`${id}/`, {
    method: "DELETE",
  });
}

export const deleteCheckIn = deleteCheckin;

// GET STREAK ANALYTICS FROM DJANGO

export async function getStreakAnalytics(
  habitId?: number
): Promise<StreakAnalytics> {
  const query =
    habitId === undefined
      ? ""
      : `?habit_id=${habitId}`;

  return checkinRequest<StreakAnalytics>(
    `analytics/longest-streak/${query}`
  );
}

// BACKWARD COMPATIBILITY

export async function getLongestStreak(): Promise<LongestStreak> {
  return getStreakAnalytics();
}

// LOCAL DATE

export function getLocalDateString(
  date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
