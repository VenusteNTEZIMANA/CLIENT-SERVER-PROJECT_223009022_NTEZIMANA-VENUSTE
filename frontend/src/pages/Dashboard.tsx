
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getProfile, updateProfile, type UserProfile } from "../lib/profile";
import {
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  type Habit,
} from "../lib/habits";
import {
  createCheckIn,
  getCheckIns,
  getStreakAnalytics,
  type CheckIn,
  type StreakAnalytics,
} from "../lib/checkins";
import "./Dashboard.css";

type Page =
  | "Dashboard"
  | "My Habits"
  | "Calendar"
  | "Progress"
  | "Profile"
  | "Settings"
  | "Habit Detail";

const navigation: { name: Page; icon: string }[] = [
  { name: "Dashboard", icon: "⌂" },
  { name: "My Habits", icon: "✓" },
  { name: "Calendar", icon: "▦" },
  { name: "Progress", icon: "▥" },
  { name: "Profile", icon: "👤" },
  { name: "Settings", icon: "⚙" },
];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ActivityHeatmapProps = {
  checkIns: CheckIn[];
  habits: Habit[];
  habitId?: number;
};

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function ActivityHeatmap({ checkIns, habits, habitId }: ActivityHeatmapProps) {
  const todayKey = dateKey(new Date());
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const visibleHabits = habitId === undefined
    ? habits
    : habits.filter((habit) => habit.id === habitId);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - 5 + index);
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const monthCheckIns = checkIns.filter(
    (item) => item.completed && item.date.startsWith(monthPrefix),
  );

  const completedByHabit = new Map<number, Set<string>>();
  monthCheckIns.forEach((item) => {
    const dates = completedByHabit.get(item.habit) ?? new Set<string>();
    dates.add(item.date);
    completedByHabit.set(item.habit, dates);
  });

  const selectedCheckIns = checkIns.filter(
    (item) => item.date === selectedDate && item.completed &&
      (habitId === undefined || item.habit === habitId),
  );
  const selectedMonthLabel = new Date(year, monthIndex, 1).toLocaleDateString(
    "en-US", { month: "long", year: "numeric" },
  );

  const selectMonth = (nextMonth: number) => {
    setMonthIndex(nextMonth);
    const safeDay = Math.min(new Date().getDate(), new Date(year, nextMonth + 1, 0).getDate());
    setSelectedDate(dateKey(new Date(year, nextMonth, safeDay)));
  };

  const selectYear = (nextYear: number) => {
    setYear(nextYear);
    const safeDay = Math.min(new Date().getDate(), new Date(nextYear, monthIndex + 1, 0).getDate());
    setSelectedDate(dateKey(new Date(nextYear, monthIndex, safeDay)));
  };

  const selectedHabitNames = selectedCheckIns.map((item) =>
    habits.find((habit) => habit.id === item.habit)?.name ?? `Habit #${item.habit}`,
  );

  return (
    <div className="dashboard-panel heatmap-panel activity-matrix-panel">
      <div className="heatmap-heading activity-matrix-heading">
        <div>
          <span className="panel-eyebrow">CONSISTENCY</span>
          <h2>Activity calendar</h2>
          <p>Choose a day to see which habits you completed.</p>
        </div>
        <label className="activity-year-picker">
          <span className="visually-hidden">Calendar year</span>
          <select value={year} onChange={(event) => selectYear(Number(event.target.value))}>
            {yearOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="activity-month-tabs" aria-label="Choose calendar month">
        {MONTH_NAMES.map((month, index) => (
          <button
            type="button"
            key={month}
            className={monthIndex === index ? "active" : ""}
            onClick={() => selectMonth(index)}
            aria-pressed={monthIndex === index}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="activity-matrix-scroll">
        <table className="activity-matrix">
          <thead>
            <tr>
              <th className="activity-habit-column">HABIT</th>
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => (
                <th key={day} className="activity-day-heading">{day}</th>
              ))}
              <th className="activity-total-column">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {visibleHabits.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 2} className="activity-empty-row">
                  {habits.length === 0 ? "No habits yet. Add your first habit." : "No matching habit."}
                </td>
              </tr>
            ) : visibleHabits.map((habit) => {
              const completedDates = completedByHabit.get(habit.id) ?? new Set<string>();
              const totalCompleted = completedDates.size;
              const createdDate = habit.created_at?.slice(0, 10) ?? "0000-00-00";
              return (
                <tr key={habit.id}>
                  <th className="activity-habit-name" scope="row">
                    <span>{habit.name}</span>
                    <small>{habit.category}</small>
                  </th>
                  {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                    const cellDate = dateKey(new Date(year, monthIndex, day));
                    const isFuture = cellDate > todayKey;
                    const isExcluded = cellDate < createdDate;
                    const isCompleted = completedDates.has(cellDate);
                    const status = isExcluded ? "excluded" : isFuture ? "future" : isCompleted ? "completed" : "missed";
                    return (
                      <td key={cellDate}>
                        <button
                          type="button"
                          className={`activity-day-cell ${status} ${selectedDate === cellDate ? "selected" : ""}`}
                          disabled={isFuture || isExcluded}
                          onClick={() => setSelectedDate(cellDate)}
                          title={`${habit.name} · ${cellDate} · ${status}`}
                          aria-label={`${habit.name}, ${cellDate}: ${status}`}
                          aria-pressed={selectedDate === cellDate}
                        >
                          {isCompleted ? "✓" : status === "missed" ? "×" : status === "excluded" ? "⊘" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="activity-total-cell">{totalCompleted}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="activity-matrix-legend">
        <span><i className="completed" /> Completed</span>
        <span><i className="missed" /> Missed</span>
        <span><i className="future" /> Future</span>
        <span><i className="excluded" /> Excluded</span>
      </div>

      <div className="heatmap-day-detail">
        <strong>{selectedDate}</strong>
        {selectedHabitNames.length > 0 ? (
          <ul>{selectedHabitNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
        ) : (
          <p>No completed habits recorded on this date.</p>
        )}
      </div>
      <p className="activity-matrix-caption">{selectedMonthLabel} · Green means completed, yellow means no check-in recorded, and grey means the habit had not started yet.</p>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [overallStreak, setOverallStreak] = useState<StreakAnalytics>({
    habit_id: null,
    current_streak: 0,
    longest_streak: 0,
  });
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [habitStreak, setHabitStreak] = useState<StreakAnalytics | null>(null);
  const [streakLoading, setStreakLoading] = useState(false);
  const [checkInBusyId, setCheckInBusyId] = useState<number | null>(null);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState("");
  const [newCategory, setNewCategory] = useState("Personal Growth");
  const [newTime, setNewTime] = useState("08:00");
  const [notification, setNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // LOAD USER HABITS
  const loadHabits = async () => {
    try {
      setError("");
      setLoading(true);
      const [data, savedCheckIns, streaks] = await Promise.all([
        getHabits(),
        getCheckIns(),
        getStreakAnalytics(),
      ]);
      const todayKey = dateKey(new Date());
      setCheckIns(savedCheckIns);
      setOverallStreak(streaks);
      setHabits(data.map((habit) => ({
        ...habit,
        completed: savedCheckIns.some(
          (item) => item.habit === habit.id && item.date === todayKey && item.completed,
        ),
      })));
    } catch (err) {
      console.error("Loading habits failed:", err);
      setError(
        err instanceof Error ? err.message : "Could not load habits."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setError("");
      const profileData = await getProfile();
      setProfile(profileData);
    } catch (err) {
      console.error("Loading profile failed:", err);
      setError(err instanceof Error ? err.message : "Could not load your profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    void loadHabits();
    void loadProfile();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (activePage !== "Habit Detail" || selectedHabitId === null) return;
    let cancelled = false;
    setStreakLoading(true);
    setHabitStreak(null);
    getStreakAnalytics(selectedHabitId)
      .then((result) => {
        if (!cancelled) setHabitStreak(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load habit streak.");
        }
      })
      .finally(() => {
        if (!cancelled) setStreakLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePage, selectedHabitId]);

  // STATISTICS
  const completed = habits.filter((habit) => habit.completed).length;
  const total = habits.length;
  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset + index);
    const key = dateKey(date);
    return {
      date: key,
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: checkIns.filter((item) => item.date === key && item.completed).length,
    };
  });
  const maxWeeklyCount = Math.max(1, ...weekActivity.map((item) => item.count));

  const filteredHabits = useMemo(
    () =>
      habits.filter((habit) =>
        habit.name.toLowerCase().includes(search.toLowerCase())
      ),
    [habits, search]
  );

  // ADD OR EDIT HABIT
  const openAddModal = () => {
    setEditingHabit(null);
    setNewHabit("");
    setNewCategory("Personal Growth");
    setNewTime("08:00");
    setShowModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabit(habit.name);
    setNewCategory(habit.category);
    setNewTime(habit.time);
    setShowModal(true);
  };

  const saveHabit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newHabit.trim() || saving) return;

    try {
      setSaving(true);
      setError("");

      if (editingHabit) {
        const updated = await updateHabit(editingHabit.id, {
          name: newHabit.trim(),
          category: newCategory,
        });

        setHabits((previous) =>
          previous.map((habit) =>
            habit.id === updated.id ? updated : habit
          )
        );
      } else {
        const created = await addHabit({
          name: newHabit.trim(),
          category: newCategory,
          time: newTime,
          icon: "⭐",
          color: "green",
          completed: false,
        });

        setHabits((previous) => [created, ...previous]);
      }

      setShowModal(false);
      setEditingHabit(null);
      setNewHabit("");
    } catch (err) {
      console.error("Saving habit failed:", err);
      setError(
        err instanceof Error ? err.message : "Could not save habit."
      );
    } finally {
      setSaving(false);
    }
  };

  // CHECK IN: completion is stored as a dated CheckIn, never as a Habit update.
  const toggleHabit = async (habit: Habit) => {
    if (habit.completed || checkInBusyId !== null) return;

    const todayKey = dateKey(new Date());
    try {
      setError("");
      setCheckInMessage("");
      setCheckInBusyId(habit.id);
      const created = await createCheckIn(habit.id, todayKey);
      setCheckIns((previous) => [created, ...previous]);
      setHabits((previous) => previous.map((item) =>
        item.id === habit.id ? { ...item, completed: true } : item,
      ));
      setCheckInMessage(`${habit.name} checked in successfully for today.`);
      const streaks = await getStreakAnalytics();
      setOverallStreak(streaks);
      if (selectedHabitId === habit.id) {
        setHabitStreak(await getStreakAnalytics(habit.id));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save this check-in.";
      setError(message);
    } finally {
      setCheckInBusyId(null);
    }
  };

  // DELETE HABIT
  const removeHabit = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) {
      return;
    }

    try {
      setError("");
      await deleteHabit(id);
      setHabits((previous) =>
        previous.filter((habit) => habit.id !== id)
      );
    } catch (err) {
      console.error("Deleting habit failed:", err);
      setError("Could not delete habit.");
    }
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile((previous) => previous ? { ...previous, [field]: value } : previous);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || profileSaving) return;

    try {
      setProfileSaving(true);
      setError("");
      setProfileSuccess("");
      const saved = await updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        location: profile.location,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      });
      setProfile(saved);
      setProfileSuccess("Your profile has been saved successfully.");
    } catch (err) {
      console.error("Saving profile failed:", err);
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || avatarUploading) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The profile picture must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setAvatarUploading(true);
      setError("");
      setProfileSuccess("");
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const updated = await updateProfile({ avatar_url: data.publicUrl });
      setProfile(updated);
      setProfileSuccess("Profile picture updated successfully.");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError(err instanceof Error ? err.message : "Could not upload your profile picture.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const renderAvatar = (className: string) => (
    <div className={className}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="Profile" />
      ) : (
        (profile?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase()
      )}
    </div>
  );

  // LOGOUT
  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const changePage = (page: Page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setSearch("");
  };

  const openHabitDetail = (habit: Habit) => {
    setSelectedHabitId(habit.id);
    setHabitStreak(null);
    setActivePage("Habit Detail");
    setSidebarOpen(false);
  };

  // HABIT COMPONENT
  const renderHabit = (habit: Habit) => (
    <div className="dashboard-habit" key={habit.id}>
      <div className={`habit-icon-box ${habit.color}`}>
        <span>{habit.icon}</span>
      </div>

      <div className="dashboard-habit-info">
        <button type="button" className="habit-name-link" onClick={() => openHabitDetail(habit)}>
          {habit.name}
        </button>
        <span>{habit.category}</span>
      </div>

      <div className="habit-time">
        <span>◷</span>
        {habit.time}
      </div>

      <button
        type="button"
        className={`habit-toggle ${habit.completed ? "checked" : ""}`}
        onClick={() => void toggleHabit(habit)}
        disabled={habit.completed || checkInBusyId === habit.id}
        aria-label={habit.completed ? "Completed today" : "Check in today"}
        title={habit.completed ? "Completed today" : "Record today's check-in"}
      >
        {checkInBusyId === habit.id ? "…" : habit.completed ? "✓" : ""}
      </button>

      <button
        type="button"
        onClick={() => openEditModal(habit)}
        title="Edit habit"
        aria-label="Edit habit"
      >
        ✎
      </button>

      <button
        type="button"
        onClick={() => void removeHabit(habit.id)}
        title="Delete habit"
        aria-label="Delete habit"
      >
        🗑
      </button>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="dashboard-welcome">
        <div>
          <div className="dashboard-date-label">
            <span>◷</span>
            {formattedDate}
          </div>

          <h1>
            Good day! <span>👋</span>
          </h1>

          <p>
            Welcome back, {user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              user?.email?.split("@")[0] ||
              "User"}!
            Keep building your best self.
          </p>
        </div>

        <button
          className="dashboard-primary-button"
          onClick={openAddModal}
        >
          ＋ Add New Habit
        </button>
      </div>

      {checkInMessage && <p className="checkin-success" role="status">{checkInMessage}</p>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-label">Total Habits</span>
          <strong className="stat-value">{total}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Completed Today</span>
          <strong className="stat-value">
            {completed}/{total}
          </strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Daily Progress</span>
          <strong className="stat-value">{percentage}%</strong>
          <div className="stat-progress">
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Longest Streak</span>
          <strong className="stat-value">{overallStreak.longest_streak}</strong>
          <span className="stat-description">Days · calculated by Django</span>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">YOUR ROUTINE</span>
            <h2>Today's Habits</h2>
            <p>Track your daily activities.</p>
          </div>

          <button
            className="panel-action"
            onClick={() => changePage("My Habits")}
          >
            View All →
          </button>
        </div>

        <div className="habit-items">
          {loading ? (
            <p>Loading your habits...</p>
          ) : habits.length > 0 ? (
            habits.slice(0, 5).map(renderHabit)
          ) : (
            <p>No habits yet. Add your first habit!</p>
          )}
        </div>

        <button className="add-habit-link" onClick={openAddModal}>
          ＋ Add another habit
        </button>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">YOUR PERFORMANCE</span>
            <h2>Weekly Activity</h2>
          </div>
        </div>

        <div className="weekly-chart">
          {weekActivity.map((item) => (
            <div className="chart-column" key={item.date}>
              <div className="chart-bar-area">
                <div
                  className={`chart-bar ${item.date === dateKey(today) ? "chart-bar-highlight" : ""}`}
                  style={{ height: `${item.count === 0 ? 4 : (item.count / maxWeeklyCount) * 100}%` }}
                  title={`${item.count} completed check-ins`}
                />
              </div>
              <span>{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderProfile = () => (
    <div className="dashboard-page-section">
      <div className="dashboard-welcome">
        <div>
          <span className="panel-eyebrow">YOUR ACCOUNT</span>
          <h1>My Profile</h1>
          <p>Manage your personal information and profile picture.</p>
        </div>
      </div>

      {profileSuccess && <div className="profile-success" role="status">{profileSuccess}</div>}

      {profileLoading ? (
        <div className="dashboard-panel"><p>Loading your profile...</p></div>
      ) : profile ? (
        <div className="dashboard-panel profile-page-panel">
          <div className="profile-upload-section">
            {renderAvatar("profile-large-avatar")}
            <div className="profile-upload-info">
              <h2>Profile Picture</h2>
              <p>Upload a JPG, PNG, or WEBP image. Maximum size: 5MB.</p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                hidden
              />
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? "Uploading..." : "Change Profile Picture"}
              </button>
            </div>
          </div>

          <h2>Personal Information</h2>
          <p className="profile-form-description">Update your information below.</p>
          <form className="profile-form" onSubmit={saveProfile}>
            <label htmlFor="profile-full-name">Full Name</label>
            <input id="profile-full-name" type="text" value={profile.full_name} onChange={(event) => handleProfileChange("full_name", event.target.value)} placeholder="Enter your full name" />

            <label htmlFor="profile-phone">Phone Number</label>
            <input id="profile-phone" type="tel" value={profile.phone} onChange={(event) => handleProfileChange("phone", event.target.value)} placeholder="Enter your phone number" />

            <label htmlFor="profile-date-of-birth">Date of Birth</label>
            <input id="profile-date-of-birth" type="date" value={profile.date_of_birth} onChange={(event) => handleProfileChange("date_of_birth", event.target.value)} />

            <label htmlFor="profile-gender">Gender</label>
            <select id="profile-gender" value={profile.gender} onChange={(event) => handleProfileChange("gender", event.target.value)}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>

            <label htmlFor="profile-location">Location</label>
            <input id="profile-location" type="text" value={profile.location} onChange={(event) => handleProfileChange("location", event.target.value)} placeholder="Enter your location" />

            <label htmlFor="profile-bio">About Me</label>
            <textarea id="profile-bio" rows={5} value={profile.bio} onChange={(event) => handleProfileChange("bio", event.target.value)} placeholder="Tell us something about yourself..." />

            <button type="submit" className="dashboard-primary-button habit-submit" disabled={profileSaving}>
              {profileSaving ? "Saving Profile..." : "Save Profile"}
            </button>
          </form>
        </div>
      ) : (
        <div className="dashboard-panel">
          <p>Profile could not be loaded.</p>
          <button type="button" onClick={() => void loadProfile()}>Try Again</button>
        </div>
      )}
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();

      case "My Habits":
        return (
          <div className="dashboard-page-section">
            <div className="dashboard-welcome">
              <div>
                <span className="panel-eyebrow">YOUR ROUTINE</span>
                <h1>My Habits</h1>
                <p>Manage your personal habits.</p>
              </div>

              <button
                className="dashboard-primary-button"
                onClick={openAddModal}
              >
                ＋ Add Habit
              </button>
            </div>

            <div className="dashboard-panel all-habits-panel">
              <h2>All Your Habits ({total})</h2>

              <div className="habit-items">
                {loading ? (
                  <p>Loading habits...</p>
                ) : filteredHabits.length > 0 ? (
                  filteredHabits.map(renderHabit)
                ) : (
                  <p>No habits found.</p>
                )}
              </div>
            </div>
          </div>
        );

      case "Calendar":
        return (
          <div className="dashboard-page-section">
            <div className="dashboard-welcome">
              <div>
                <span className="panel-eyebrow">YOUR CONSISTENCY</span>
                <h1>Habit Calendar</h1>
                <p>Every square is based on real check-in records from Django.</p>
              </div>
            </div>
            {loading ? <div className="dashboard-panel">Loading check-in history...</div> : (
              <ActivityHeatmap checkIns={checkIns} habits={habits} />
            )}
          </div>
        );

      case "Habit Detail": {
        const selectedHabit = habits.find((habit) => habit.id === selectedHabitId);
        if (!selectedHabit) {
          return (
            <div className="dashboard-page-section">
              <h1>Habit not found</h1>
              <button className="panel-action" onClick={() => changePage("My Habits")}>Back to My Habits</button>
            </div>
          );
        }
        const habitCheckIns = checkIns.filter(
          (item) => item.habit === selectedHabit.id && item.completed,
        );
        return (
          <div className="dashboard-page-section">
            <button className="detail-back-button" onClick={() => changePage("My Habits")}>← Back to My Habits</button>
            <div className="dashboard-welcome">
              <div>
                <span className="panel-eyebrow">HABIT DETAILS</span>
                <h1>{selectedHabit.name}</h1>
                <p>{selectedHabit.category} · {habitCheckIns.length} recorded check-in(s)</p>
              </div>
              <button className="dashboard-primary-button" onClick={() => void toggleHabit(selectedHabit)} disabled={selectedHabit.completed || checkInBusyId === selectedHabit.id}>
                {selectedHabit.completed ? "✓ Completed today" : checkInBusyId === selectedHabit.id ? "Saving..." : "＋ Check in today"}
              </button>
            </div>
            <div className="detail-stats-grid">
              <div className="stat-card"><span className="stat-label">Current Streak</span><strong className="stat-value">{streakLoading ? "..." : habitStreak?.current_streak ?? 0} days</strong></div>
              <div className="stat-card"><span className="stat-label">Longest Streak</span><strong className="stat-value">{streakLoading ? "..." : habitStreak?.longest_streak ?? 0} days</strong></div>
              <div className="stat-card"><span className="stat-label">Total Check-ins</span><strong className="stat-value">{habitCheckIns.length}</strong></div>
            </div>
            <ActivityHeatmap checkIns={checkIns} habits={habits} habitId={selectedHabit.id} />
          </div>
        );
      }

      case "Progress":
        return (
          <div className="dashboard-page-section">
            <h1>Progress Overview</h1>
            <div className="dashboard-panel progress-detail-panel">
              <h2>Current Progress</h2>
              <strong className="progress-large">{percentage}%</strong>
              <div className="stat-progress">
                <span style={{ width: `${percentage}%` }} />
              </div>
              <p>
                Completed {completed} out of {total} habits today.
              </p>
              <p>Longest streak across your habits: {overallStreak.longest_streak} days (from Django).</p>
            </div>
          </div>
        );

      case "Profile":
        return renderProfile();

      case "Settings":
        return (
          <div className="dashboard-page-section">
            <h1>Settings</h1>

            <div className="dashboard-panel settings-panel">
              <div className="settings-profile-icon">⚙</div>
              <h2>Account Settings</h2>

              <span>Email</span>
              <strong>{user?.email || "No email available"}</strong>

              <span>Habits created</span>
              <strong>{total}</strong>

              <button
                className="settings-logout"
                onClick={() => void handleLogout()}
                disabled={logoutLoading}
              >
                {logoutLoading ? "Signing out..." : "Logout"}
              </button>
            </div>
          </div>
        );
    }
  };

  if (authLoading) {
    return <div className="dashboard-content">Checking account...</div>;
  }

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">✓</span>
          <span>Habit<span>Flow</span><sup>PRO</sup></span>
        </div>

        <div className="sidebar-section-label">MENU</div>

        <nav className="dashboard-navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`sidebar-link ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => changePage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            {renderAvatar("profile-avatar")}

            <div className="profile-details">
              <strong>
                {profile?.full_name || user?.email?.split("@")[0] || "User"}
              </strong>
              <span>{user?.email}</span>
            </div>

            <button
              type="button"
              className="logout-icon"
              onClick={() => void handleLogout()}
              disabled={logoutLoading}
              aria-label="Logout"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="dashboard-menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div className="dashboard-breadcrumb">
            <span>Pages</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="dashboard-top-actions">
            <div className="dashboard-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search habits..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (event.target.value) {
                    setActivePage("My Habits");
                  }
                }}
              />
            </div>

            <button
              className="notification-button"
              onClick={() => setNotification(!notification)}
              title="Notifications"
            >
              ♧
            </button>

            {renderAvatar("top-avatar")}
          </div>
        </header>

        <section className="dashboard-content">
          {error && (
            <div role="alert" style={{ color: "#dc2626", marginBottom: 15 }}>
              {error}
              <button onClick={() => activePage === "Profile" ? void loadProfile() : void loadHabits()}>
                Retry
              </button>
            </div>
          )}

          {checkInMessage && activePage !== "Dashboard" && (
            <div className="checkin-success" role="status">{checkInMessage}</div>
          )}

          {notification && (
            <div className="dashboard-panel">
              <strong>Notifications</strong>
              <p>Welcome to HabitFlow!</p>
              <button onClick={() => setNotification(false)}>
                Close
              </button>
            </div>
          )}

          {renderPage()}

          <footer className="dashboard-footer">
            <span>© {today.getFullYear()} HabitFlow.</span>
            <span>Build better habits, build a better life. ✦</span>
          </footer>
        </section>
      </main>

      {showModal && (
        <div
          className="habit-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="habit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="habit-modal-close"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <div className="habit-modal-icon">✦</div>
            <span className="panel-eyebrow">BUILD YOUR ROUTINE</span>

            <h2>{editingHabit ? "Edit Habit" : "Create New Habit"}</h2>

            <form onSubmit={saveHabit}>
              <label htmlFor="habit-name">Habit Name</label>
              <input
                id="habit-name"
                type="text"
                placeholder="e.g. Read 20 pages"
                value={newHabit}
                onChange={(event) => setNewHabit(event.target.value)}
                required
                autoFocus
              />

              <label htmlFor="habit-category" style={{ marginTop: 17 }}>
                Category
              </label>

              <select
                id="habit-category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
              >
                <option>Personal Growth</option>
                <option>Health</option>
                <option>Fitness</option>
                <option>Mindfulness</option>
                <option>Productivity</option>
                <option>Education</option>
              </select>

              <label htmlFor="habit-time" style={{ marginTop: 17 }}>
                Reminder Time
              </label>

              <input
                id="habit-time"
                type="time"
                value={newTime}
                onChange={(event) => setNewTime(event.target.value)}
                required
              />

              <button
                type="submit"
                className="dashboard-primary-button habit-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingHabit
                    ? "Save Changes"
                    : "Create Habit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;