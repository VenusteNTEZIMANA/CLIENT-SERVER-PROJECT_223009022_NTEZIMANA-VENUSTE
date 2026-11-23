
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

export interface Habit {
  id: number;
  user_id: string;
  title: string;
  description: string;
  frequency: string;
  created_at: string;
  updated_at: string;

  name: string;
  category: string;
  time: string;
  icon: string;
  color: string;
  completed: boolean;
}

async function getAuthHeaders() {
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

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("Missing VITE_API_URL.");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/api/habits/${endpoint}`,
    {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));

    throw new Error(
      result.detail ||
      result.message ||
      "Habit request failed."
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function formatHabit(data: {
  id: number;
  user_id: string;
  title: string;
  description: string;
  frequency: string;
  created_at: string;
  updated_at: string;
}): Habit {
  return {
    ...data,
    name: data.title,
    category: data.frequency,
    time: "08:00",
    icon: "⭐",
    color: "green",
    completed: false,
  };
}

// GET HABITS
export async function getHabits(): Promise<Habit[]> {
  const data = await apiRequest<Array<{
    id: number;
    user_id: string;
    title: string;
    description: string;
    frequency: string;
    created_at: string;
    updated_at: string;
  }>>("");

  return data.map(formatHabit);
}

// ADD HABIT
export async function addHabit(
  habit: Pick<
    Habit,
    "name" | "category" | "time" | "icon" | "color" | "completed"
  >
): Promise<Habit> {
  const data = await apiRequest<{
    id: number;
    user_id: string;
    title: string;
    description: string;
    frequency: string;
    created_at: string;
    updated_at: string;
  }>("", {
    method: "POST",
    body: JSON.stringify({
      title: habit.name,
      description: "",
      frequency: habit.category,
    }),
  });

  return formatHabit(data);
}

// UPDATE HABIT
export async function updateHabit(
  id: number,
  updates: Partial<
    Pick<Habit, "name" | "category" | "completed">
  >
): Promise<Habit> {
  if (updates.completed !== undefined) {
    throw new Error(
      "Completion must be saved through the CheckIn API."
    );
  }

  const body: Record<string, string> = {};

  if (updates.name !== undefined) {
    body.title = updates.name;
  }

  if (updates.category !== undefined) {
    body.frequency = updates.category;
  }

  const data = await apiRequest<{
    id: number;
    user_id: string;
    title: string;
    description: string;
    frequency: string;
    created_at: string;
    updated_at: string;
  }>(`${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  return formatHabit(data);
}

// DELETE HABIT
export async function deleteHabit(id: number): Promise<void> {
  await apiRequest<void>(`${id}/`, {
    method: "DELETE",
  });
}