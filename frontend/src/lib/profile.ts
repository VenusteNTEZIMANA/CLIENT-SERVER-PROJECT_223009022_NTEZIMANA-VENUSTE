import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  location: string;
  bio: string;
  avatar_url: string;
}

const PROFILE_FIELDS = "id, full_name, phone, date_of_birth, gender, location, bio, avatar_url";

function emptyProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): UserProfile {
  const metadataName = user.user_metadata?.full_name;
  return {
    id: user.id,
    full_name: typeof metadataName === "string" ? metadataName : (user.email?.split("@")[0] ?? ""),
    phone: "",
    date_of_birth: "",
    gender: "",
    location: "",
    bio: "",
    avatar_url: "",
  };
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be logged in to manage your profile.");
  return data.user;
}

export async function getProfile(): Promise<UserProfile> {
  const user = await getCurrentUser();
  const fallback = emptyProfile(user);

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return fallback;

  return {
    ...fallback,
    ...data,
    full_name: data.full_name ?? fallback.full_name,
    phone: data.phone ?? "",
    date_of_birth: data.date_of_birth ?? "",
    gender: data.gender ?? "",
    location: data.location ?? "",
    bio: data.bio ?? "",
    avatar_url: data.avatar_url ?? "",
  } as UserProfile;
}

export async function updateProfile(
  updates: Partial<Omit<UserProfile, "id">>,
): Promise<UserProfile> {
  const user = await getCurrentUser();
  const current = await getProfile();
  const payload: UserProfile = {
    ...current,
    ...updates,
    id: user.id,
  };

  const databasePayload = {
    ...payload,
    date_of_birth: payload.date_of_birth || null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(databasePayload, { onConflict: "id" })
    .select(PROFILE_FIELDS)
    .single();

  if (error) throw error;
  return {
    ...payload,
    ...data,
    date_of_birth: data.date_of_birth ?? "",
    phone: data.phone ?? "",
    gender: data.gender ?? "",
    location: data.location ?? "",
    bio: data.bio ?? "",
    avatar_url: data.avatar_url ?? "",
  } as UserProfile;
}
