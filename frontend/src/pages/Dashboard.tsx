
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  type Habit,
} from "../lib/habits";
import "./Dashboard.css";

type Page =
  | "Dashboard"
  | "My Habits"
  | "Calendar"
  | "Progress"
  | "Settings";

const navigation: { name: Page; icon: string }[] = [
  { name: "Dashboard", icon: "⌂" },
  { name: "My Habits", icon: "✓" },
  { name: "Calendar", icon: "▦" },
  { name: "Progress", icon: "▥" },
  { name: "Settings", icon: "⚙" },
];

const week = [
  { day: "Mon", value: 45 },
  { day: "Tue", value: 70 },
  { day: "Wed", value: 55 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 65 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 75 },
];

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
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
      const data = await getHabits();
      setHabits(data);
    } catch (err) {
      console.error("Loading habits failed:", err);
      setError(
        err instanceof Error ? err.message : "Could not load habits."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    void loadHabits();
  }, [user, authLoading, navigate]);

  // STATISTICS
  const completed = habits.filter((habit) => habit.completed).length;
  const total = habits.length;
  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

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

  const saveHabit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newHabit.trim() || saving) return;

    try {
      setSaving(true);
      setError("");

      if (editingHabit) {
        const updated = await updateHabit(editingHabit.id, {
          name: newHabit.trim(),
          category: newCategory,
          time: newTime,
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

  // COMPLETE HABIT
  const toggleHabit = async (habit: Habit) => {
    try {
      setError("");

      const updated = await updateHabit(habit.id, {
        completed: !habit.completed,
      });

      setHabits((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    } catch (err) {
      console.error("Updating habit failed:", err);
      setError("Could not update habit.");
    }
  };

  // DELETE HABIT
  const removeHabit = async (id: string) => {
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

  // HABIT COMPONENT
  const renderHabit = (habit: Habit) => (
    <div className="dashboard-habit" key={habit.id}>
      <div className={`habit-icon-box ${habit.color}`}>
        <span>{habit.icon}</span>
      </div>

      <div className="dashboard-habit-info">
        <strong>{habit.name}</strong>
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
        aria-label={habit.completed ? "Mark incomplete" : "Mark complete"}
      >
        {habit.completed ? "✓" : ""}
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
          <span className="stat-label">Remaining</span>
          <strong className="stat-value">
            {total - completed}
          </strong>
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
          {week.map((item, index) => (
            <div className="chart-column" key={item.day}>
              <div className="chart-bar-area">
                <div
                  className={`chart-bar ${
                    index === today.getDay() - 1
                      ? "chart-bar-highlight"
                      : ""
                  }`}
                  style={{ height: `${item.value}%` }}
                />
              </div>
              <span>{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </>
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
            <h1>Habit Calendar</h1>
            <p>Keep track of your daily consistency.</p>
            <div className="dashboard-panel">
              <h2>
                {today.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <p>Calendar history requires daily check-in records.</p>
            </div>
          </div>
        );

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
                Completed {completed} out of {total} habits.
              </p>
            </div>
          </div>
        );

      case "Settings":
        return (
          <div className="dashboard-page-section">
            <h1>Settings</h1>

            <div className="dashboard-panel settings-panel">
              <div className="settings-profile-icon">👤</div>
              <h2>Profile Settings</h2>

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
            <div className="profile-avatar">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>
                {user?.user_metadata?.full_name ||
                  user?.user_metadata?.name ||
                  user?.email?.split("@")[0] ||
                  "User"}
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

            <div className="top-avatar">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          {error && (
            <div role="alert" style={{ color: "#dc2626", marginBottom: 15 }}>
              {error}
              <button onClick={() => void loadHabits()}>
                Retry
              </button>
            </div>
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