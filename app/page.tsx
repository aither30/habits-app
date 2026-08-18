"use client";

import { useEffect, useMemo, useState } from "react";

type Habit = {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  createdAt: string;
};

type CompletionMap = Record<string, number[]>;

type NotesMap = Record<string, string>;

type Tab =
  | "today"
  | "statistics"
  | "history"
  | "goals"
  | "focus"
  | "notes";

const HABITS_KEY = "habitflow-habits-v3";
const COMPLETIONS_KEY = "habitflow-completions-v3";
const NOTES_KEY = "habitflow-notes-v3";
const THEME_KEY = "habitflow-theme-v3";

const DEFAULT_HABITS: Habit[] = [
  {
    id: 1,
    name: "Bangun pagi",
    description: "Bangun sebelum jam 07.00",
    category: "Health",
    icon: "☀️",
    color: "blue",
    createdAt: "2026-08-01",
  },
  {
    id: 2,
    name: "Minum air",
    description: "Minum air yang cukup sepanjang hari",
    category: "Health",
    icon: "💧",
    color: "cyan",
    createdAt: "2026-08-01",
  },
  {
    id: 3,
    name: "Belajar coding",
    description: "Belajar programming minimal 1 jam",
    category: "Study",
    icon: "💻",
    color: "indigo",
    createdAt: "2026-08-01",
  },
  {
    id: 4,
    name: "Bahasa Inggris",
    description: "Belajar vocabulary, listening, atau speaking",
    category: "Study",
    icon: "🇬🇧",
    color: "violet",
    createdAt: "2026-08-03",
  },
  {
    id: 5,
    name: "Olahraga",
    description: "Bergerak atau olahraga minimal 30 menit",
    category: "Fitness",
    icon: "🏃",
    color: "emerald",
    createdAt: "2026-08-05",
  },
  {
    id: 6,
    name: "Baca buku",
    description: "Baca minimal 10 halaman",
    category: "Personal",
    icon: "📚",
    color: "amber",
    createdAt: "2026-08-07",
  },
  {
    id: 7,
    name: "Journaling",
    description: "Tulis refleksi dan evaluasi hari ini",
    category: "Mind",
    icon: "📝",
    color: "pink",
    createdAt: "2026-08-07",
  },
];

const CATEGORIES = [
  "All",
  "Health",
  "Study",
  "Fitness",
  "Personal",
  "Mind",
];

const CATEGORY_ICONS: Record<string, string> = {
  Health: "💚",
  Study: "📖",
  Fitness: "🏃",
  Personal: "✨",
  Mind: "🧠",
};

const ICONS = [
  "✨",
  "☀️",
  "💧",
  "💻",
  "📖",
  "🏃",
  "📚",
  "📝",
  "🧠",
  "❤️",
  "🎯",
  "🔥",
  "💪",
  "🥗",
  "😴",
  "🎵",
];

const pad = (number: number) => String(number).padStart(2, "0");

const getDateKey = (date: Date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;

const getDateFromKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
};

const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const formatLongDate = (date: Date) =>
  date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

const formatDay = (date: Date) =>
  date.toLocaleDateString("id-ID", {
    weekday: "short",
  });

const getLastDays = (amount: number) =>
  Array.from({ length: amount }, (_, index) =>
    addDays(new Date(), index - (amount - 1))
  );

export default function Home() {
  const [hydrated, setHydrated] = useState(false);

  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [notes, setNotes] = useState<NotesMap>({});

  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [darkMode, setDarkMode] = useState(false);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(
    null
  );
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(
    null
  );

  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitCategory, setHabitCategory] = useState("Personal");
  const [habitIcon, setHabitIcon] = useState("✨");

  const [historyDate, setHistoryDate] = useState(getDateKey());

  const [noteDate, setNoteDate] = useState(getDateKey());
  const [noteText, setNoteText] = useState("");

  const [focusMode, setFocusMode] = useState<"focus" | "break">(
    "focus"
  );
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem(HABITS_KEY);
      const savedCompletions =
        localStorage.getItem(COMPLETIONS_KEY);
      const savedNotes = localStorage.getItem(NOTES_KEY);
      const savedTheme = localStorage.getItem(THEME_KEY);

      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }

      if (savedCompletions) {
        setCompletions(JSON.parse(savedCompletions));
      }

      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }

      if (savedTheme === "dark") {
        setDarkMode(true);
      }
    } catch {
      // ignore invalid storage
    }

    setHydrated(true);
  }, []);

  /* =========================================================
     SAVE DATA
  ========================================================= */

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      COMPLETIONS_KEY,
      JSON.stringify(completions)
    );
  }, [completions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      THEME_KEY,
      darkMode ? "dark" : "light"
    );
  }, [darkMode, hydrated]);

  /* =========================================================
     FOCUS TIMER
  ========================================================= */

  useEffect(() => {
    if (!focusRunning) return;

    const interval = setInterval(() => {
      setFocusSeconds((current) => {
        if (current <= 1) {
          setFocusRunning(false);

          if (focusMode === "focus") {
            setFocusMode("break");
            return 5 * 60;
          }

          setFocusMode("focus");
          return 25 * 60;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusRunning, focusMode]);

  /* =========================================================
     DATA HELPERS
  ========================================================= */

  const getCompletedIds = (date: string) =>
    completions[date] || [];

  const isCompleted = (habitId: number, date: string) =>
    getCompletedIds(date).includes(habitId);

  /*
   * IMPORTANT:
   * TODAY IS THE ONLY PLACE WHERE NORMAL CHECKLIST
   * INTERACTION HAPPENS.
   */
  const toggleTodayHabit = (habitId: number) => {
    const today = getDateKey();

    setCompletions((current) => {
      const existing = current[today] || [];

      const updated = existing.includes(habitId)
        ? existing.filter((id) => id !== habitId)
        : [...existing, habitId];

      return {
        ...current,
        [today]: updated,
      };
    });
  };

  const today = getDateKey();

  const todayCompleted = getCompletedIds(today);

  const todayCompletedCount = todayCompleted.length;

  const todayProgress =
    habits.length === 0
      ? 0
      : Math.round(
          (todayCompletedCount / habits.length) * 100
        );

  /* =========================================================
     STREAK
  ========================================================= */

  const getCurrentStreak = (habitId: number) => {
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const date = getDateKey(
        addDays(new Date(), -i)
      );

      if (isCompleted(habitId, date)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getBestStreak = (habitId: number) => {
    let best = 0;
    let current = 0;

    for (let i = 364; i >= 0; i--) {
      const date = getDateKey(
        addDays(new Date(), -i)
      );

      if (isCompleted(habitId, date)) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }

    return best;
  };

  const currentBestStreak =
    habits.length > 0
      ? Math.max(
          ...habits.map((habit) =>
            getCurrentStreak(habit.id)
          )
        )
      : 0;

  const overallBestStreak =
    habits.length > 0
      ? Math.max(
          ...habits.map((habit) =>
            getBestStreak(habit.id)
          )
        )
      : 0;

  /* =========================================================
     TOTAL STATISTICS
  ========================================================= */

  const totalCompletions = Object.values(
    completions
  ).reduce((total, ids) => total + ids.length, 0);

  const last7Days = getLastDays(7);

  const weeklyData = last7Days.map((date) => {
    const key = getDateKey(date);
    const count = getCompletedIds(key).length;

    const percentage =
      habits.length === 0
        ? 0
        : Math.round((count / habits.length) * 100);

    return {
      date,
      key,
      count,
      percentage,
    };
  });

  const weeklyCompleted = weeklyData.reduce(
    (total, item) => total + item.count,
    0
  );

  const weeklyPossible = habits.length * 7;

  const weeklyRate =
    weeklyPossible === 0
      ? 0
      : Math.round(
          (weeklyCompleted / weeklyPossible) * 100
        );

  const perfectDays = Object.keys(completions).filter(
    (date) =>
      habits.length > 0 &&
      getCompletedIds(date).length === habits.length
  ).length;

  /* =========================================================
     FILTER HABITS
  ========================================================= */

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      const categoryMatch =
        category === "All" ||
        habit.category === category;

      const searchMatch =
        habit.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        habit.description
          .toLowerCase()
          .includes(search.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [habits, category, search]);

  /* =========================================================
     ADD / EDIT HABIT
  ========================================================= */

  const resetHabitForm = () => {
    setHabitName("");
    setHabitDescription("");
    setHabitCategory("Personal");
    setHabitIcon("✨");
  };

  const openAddHabit = () => {
    resetHabitForm();
    setEditingHabit(null);
    setShowHabitModal(true);
  };

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitDescription(habit.description);
    setHabitCategory(habit.category);
    setHabitIcon(habit.icon);
    setShowHabitModal(true);
  };

  const saveHabit = () => {
    if (!habitName.trim()) return;

    if (editingHabit) {
      setHabits((current) =>
        current.map((habit) =>
          habit.id === editingHabit.id
            ? {
                ...habit,
                name: habitName.trim(),
                description:
                  habitDescription.trim() ||
                  "Habit baru yang ingin kamu bangun",
                category: habitCategory,
                icon: habitIcon,
              }
            : habit
        )
      );
    } else {
      const newHabit: Habit = {
        id: Date.now(),
        name: habitName.trim(),
        description:
          habitDescription.trim() ||
          "Habit baru yang ingin kamu bangun",
        category: habitCategory,
        icon: habitIcon,
        color: "blue",
        createdAt: today,
      };

      setHabits((current) => [...current, newHabit]);
    }

    setShowHabitModal(false);
    setEditingHabit(null);
    resetHabitForm();
  };

  /* =========================================================
     DELETE HABIT
  ========================================================= */

  const deleteHabit = () => {
    if (!deletingHabit) return;

    const id = deletingHabit.id;

    setHabits((current) =>
      current.filter((habit) => habit.id !== id)
    );

    setCompletions((current) => {
      const next: CompletionMap = {};

      Object.entries(current).forEach(
        ([date, completedIds]) => {
          next[date] = completedIds.filter(
            (habitId) => habitId !== id
          );
        }
      );

      return next;
    });

    setDeletingHabit(null);
  };

  /* =========================================================
     NOTES
  ========================================================= */

  useEffect(() => {
    setNoteText(notes[noteDate] || "");
  }, [noteDate, notes]);

  const saveNote = () => {
    setNotes((current) => ({
      ...current,
      [noteDate]: noteText,
    }));
  };

  /* =========================================================
     RESET TODAY
  ========================================================= */

  const resetToday = () => {
    setCompletions((current) => ({
      ...current,
      [today]: [],
    }));
  };

  /* =========================================================
     ACHIEVEMENTS
  ========================================================= */

  const achievements = [
    {
      icon: "🌱",
      title: "First Step",
      description: "Selesaikan habit pertama",
      unlocked: totalCompletions >= 1,
    },
    {
      icon: "🚀",
      title: "Getting Started",
      description: "Selesaikan 10 habit",
      unlocked: totalCompletions >= 10,
    },
    {
      icon: "🔥",
      title: "Consistency",
      description: "Capai streak 7 hari",
      unlocked: overallBestStreak >= 7,
    },
    {
      icon: "💪",
      title: "Discipline",
      description: "Capai streak 14 hari",
      unlocked: overallBestStreak >= 14,
    },
    {
      icon: "🏆",
      title: "Perfect Day",
      description: "Selesaikan semua habit dalam satu hari",
      unlocked: perfectDays >= 1,
    },
    {
      icon: "👑",
      title: "Habit Master",
      description: "Selesaikan 100 habit",
      unlocked: totalCompletions >= 100,
    },
  ];

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigation: {
    id: Tab;
    label: string;
    icon: string;
  }[] = [
    {
      id: "today",
      label: "Today",
      icon: "☀️",
    },
    {
      id: "statistics",
      label: "Statistics",
      icon: "📊",
    },
    {
      id: "history",
      label: "History",
      icon: "📅",
    },
    {
      id: "goals",
      label: "Goals",
      icon: "🎯",
    },
    {
      id: "focus",
      label: "Focus",
      icon: "⏱️",
    },
    {
      id: "notes",
      label: "Notes",
      icon: "📝",
    },
  ];

  /* =========================================================
     THEME
  ========================================================= */

  const pageClass = darkMode
    ? "bg-[#080d18] text-slate-100"
    : "bg-[#f6f8fc] text-slate-900";

  const cardClass = darkMode
    ? "border-slate-800 bg-[#111827]"
    : "border-slate-200 bg-white";

  const mutedClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className={`min-h-screen ${pageClass}`}>
      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          darkMode
            ? "border-slate-800 bg-[#080d18]/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <button
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20">
              ✓
            </div>

            <div className="text-left">
              <div className="font-bold tracking-tight">
                HabitFlow
              </div>

              <div className={`text-xs ${mutedClass}`}>
                Build better days.
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`hidden rounded-xl px-4 py-2 text-sm font-semibold sm:block ${
                darkMode
                  ? "bg-blue-950 text-blue-300"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {todayCompletedCount}/{habits.length} selesai
            </div>

            <button
              onClick={() => setDarkMode((value) => !value)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-100"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button
              onClick={openAddHabit}
              className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 sm:block"
            >
              + Habit
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* SIDEBAR */}
        <aside
          className={`hidden w-60 shrink-0 border-r lg:block ${
            darkMode
              ? "border-slate-800"
              : "border-slate-200"
          }`}
        >
          <div className="sticky top-[73px] p-4">
            <p
              className={`mb-3 px-3 text-[11px] font-bold uppercase tracking-wider ${mutedClass}`}
            >
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : darkMode
                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="my-6 border-t border-slate-200/10" />

            <button
              onClick={openAddHabit}
              className={`flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-sm font-semibold ${
                darkMode
                  ? "border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400"
                  : "border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              <span>＋</span>
              Tambah Habit
            </button>

            <div
              className={`mt-6 rounded-2xl p-4 ${
                darkMode
                  ? "bg-blue-950/40"
                  : "bg-blue-50"
              }`}
            >
              <div className="mb-2 text-xl">💡</div>

              <p
                className={`text-xs leading-5 ${
                  darkMode
                    ? "text-blue-300"
                    : "text-blue-700"
                }`}
              >
                Jangan mengejar sempurna. Kejar konsistensi.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-10">
          {/* =================================================
              TODAY
          ================================================= */}
          {activeTab === "today" && (
            <>
              <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="mb-1 text-sm font-semibold text-blue-600">
                    {formatLongDate(new Date())}
                  </p>

                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Good morning 👋
                  </h1>

                  <p className={`mt-2 text-sm ${mutedClass}`}>
                    Satu per satu. Jangan terlalu dipikirkan.
                  </p>
                </div>

                <button
                  onClick={resetToday}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                    darkMode
                      ? "border-slate-700 hover:bg-slate-800"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Reset hari ini
                </button>
              </div>

              {/* PROGRESS */}
              <div
                className={`mb-6 overflow-hidden rounded-3xl border p-6 ${
                  darkMode
                    ? "border-blue-900 bg-gradient-to-br from-blue-950 to-[#111827]"
                    : "border-blue-100 bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                }`}
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p
                      className={`text-xs font-bold tracking-wider ${
                        darkMode
                          ? "text-blue-400"
                          : "text-blue-100"
                      }`}
                    >
                      TODAY&apos;S PROGRESS
                    </p>

                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-5xl font-bold">
                        {todayProgress}%
                      </span>

                      <span
                        className={`mb-2 text-sm ${
                          darkMode
                            ? "text-slate-400"
                            : "text-blue-100"
                        }`}
                      >
                        {todayCompletedCount} dari{" "}
                        {habits.length}
                      </span>
                    </div>

                    <p
                      className={`mt-3 text-sm ${
                        darkMode
                          ? "text-slate-400"
                          : "text-blue-100"
                      }`}
                    >
                      {todayProgress === 100
                        ? "Semua habit selesai. Mantap banget! 🎉"
                        : todayProgress >= 70
                          ? "Tinggal sedikit lagi. Selesaikan! 🔥"
                          : todayProgress >= 40
                            ? "Progress sudah bagus. Lanjutkan! 💪"
                            : "Mulai dari satu habit kecil. 🚀"}
                    </p>
                  </div>

                  <div className="flex h-32 w-32 shrink-0 items-center justify-center self-center rounded-full bg-white/20">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-center text-blue-600 shadow-xl">
                      <div>
                        <div className="text-2xl font-bold">
                          {todayCompletedCount}/
                          {habits.length}
                        </div>

                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          done
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-6 h-2 overflow-hidden rounded-full ${
                    darkMode
                      ? "bg-blue-900"
                      : "bg-white/20"
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{
                      width: `${todayProgress}%`,
                    }}
                  />
                </div>
              </div>

              {/* QUICK STATS */}
              <div className="mb-8 grid gap-3 sm:grid-cols-3">
                <SmallStat
                  title="Completed"
                  value={todayCompletedCount}
                  icon="✓"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />

                <SmallStat
                  title="Remaining"
                  value={habits.length - todayCompletedCount}
                  icon="○"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />

                <SmallStat
                  title="Current Streak"
                  value={`${currentBestStreak}d`}
                  icon="🔥"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />
              </div>

              {/* HABIT HEADER */}
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    My Habits
                  </h2>

                  <p className={`text-sm ${mutedClass}`}>
                    Checklist hari ini.
                  </p>
                </div>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Cari habit..."
                  className={`rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue-500 ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                />
              </div>

              {/* FILTER */}
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${
                      category === item
                        ? "bg-blue-600 text-white"
                        : darkMode
                          ? "bg-slate-800 text-slate-400"
                          : "bg-white text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* HABIT LIST */}
              <div className="space-y-3">
                {filteredHabits.length === 0 ? (
                  <EmptyState
                    title="Habit tidak ditemukan"
                    description="Coba ubah pencarian atau category."
                    icon="🔎"
                  />
                ) : (
                  filteredHabits.map((habit) => {
                    const done = isCompleted(
                      habit.id,
                      today
                    );

                    const streak = getCurrentStreak(
                      habit.id
                    );

                    const best = getBestStreak(
                      habit.id
                    );

                    return (
                      <div
                        key={habit.id}
                        className={`rounded-2xl border p-4 transition hover:shadow-md ${
                          done
                            ? darkMode
                              ? "border-emerald-900 bg-emerald-950/20"
                              : "border-emerald-200 bg-emerald-50/40"
                            : cardClass
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* CHECKBOX */}
                          <button
                            onClick={() =>
                              toggleTodayHabit(
                                habit.id
                              )
                            }
                            aria-label={`Tandai ${habit.name}`}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-xl transition ${
                              done
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : darkMode
                                  ? "border-slate-700 bg-slate-900 hover:border-blue-500"
                                  : "border-slate-200 bg-slate-50 hover:border-blue-400"
                            }`}
                          >
                            {done ? "✓" : habit.icon}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`font-semibold ${
                                  done
                                    ? "text-slate-400 line-through"
                                    : ""
                                }`}
                              >
                                {habit.name}
                              </h3>

                              <span
                                className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                                  darkMode
                                    ? "bg-slate-800 text-slate-400"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {CATEGORY_ICONS[
                                  habit.category
                                ]}{" "}
                                {habit.category}
                              </span>
                            </div>

                            <p
                              className={`mt-1 text-sm ${mutedClass}`}
                            >
                              {habit.description}
                            </p>

                            <div
                              className={`mt-2 flex flex-wrap gap-3 text-xs ${mutedClass}`}
                            >
                              <span>
                                🔥 {streak} day streak
                              </span>

                              <span>•</span>

                              <span>
                                Best {best} days
                              </span>
                            </div>
                          </div>

                          <div className="hidden items-center gap-2 sm:flex">
                            <button
                              onClick={() =>
                                openEditHabit(habit)
                              }
                              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                darkMode
                                  ? "text-slate-400 hover:bg-slate-800"
                                  : "text-slate-400 hover:bg-slate-100"
                              }`}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                setDeletingHabit(habit)
                              }
                              className="rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2 sm:hidden">
                          <button
                            onClick={() =>
                              openEditHabit(habit)
                            }
                            className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                              darkMode
                                ? "bg-slate-800"
                                : "bg-slate-100"
                            }`}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setDeletingHabit(habit)
                            }
                            className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={openAddHabit}
                className={`mt-4 w-full rounded-2xl border-2 border-dashed py-4 text-sm font-semibold ${
                  darkMode
                    ? "border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-400"
                    : "border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                + Tambahkan habit baru
              </button>
            </>
          )}

          {/* =================================================
              STATISTICS
          ================================================= */}
          {activeTab === "statistics" && (
            <>
              <PageHeader
                title="Statistics"
                description="Semua angka di halaman ini dihitung langsung dari checklist habit kamu."
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Today"
                  value={`${todayProgress}%`}
                  icon="☀️"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />

                <StatCard
                  title="7 Day Rate"
                  value={`${weeklyRate}%`}
                  icon="📈"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />

                <StatCard
                  title="Total Completed"
                  value={String(totalCompletions)}
                  icon="✓"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />

                <StatCard
                  title="Best Streak"
                  value={`${overallBestStreak} days`}
                  icon="🔥"
                  cardClass={cardClass}
                  mutedClass={mutedClass}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* WEEKLY */}
                <div
                  className={`rounded-2xl border p-5 ${cardClass}`}
                >
                  <div className="mb-6">
                    <h2 className="font-bold">
                      Weekly Progress
                    </h2>

                    <p
                      className={`text-sm ${mutedClass}`}
                    >
                      7 hari terakhir.
                    </p>
                  </div>

                  <div className="flex h-64 items-end gap-2">
                    {weeklyData.map((item) => (
                      <div
                        key={item.key}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-xs font-bold text-blue-600">
                          {item.percentage}%
                        </span>

                        <div className="flex h-44 w-full items-end rounded-xl bg-slate-100 dark:bg-slate-900">
                          <div
                            className="w-full rounded-xl bg-blue-600 transition-all"
                            style={{
                              height: `${Math.max(
                                item.percentage,
                                3
                              )}%`,
                            }}
                          />
                        </div>

                        <span
                          className={`text-[10px] ${mutedClass}`}
                        >
                          {formatDay(item.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HABIT PERFORMANCE */}
                <div
                  className={`rounded-2xl border p-5 ${cardClass}`}
                >
                  <h2 className="font-bold">
                    Habit Performance
                  </h2>

                  <p
                    className={`mb-6 text-sm ${mutedClass}`}
                  >
                    Persentase completion 7 hari terakhir.
                  </p>

                  <div className="space-y-5">
                    {habits.map((habit) => {
                      const count = last7Days.filter(
                        (date) =>
                          isCompleted(
                            habit.id,
                            getDateKey(date)
                          )
                      ).length;

                      const percentage = Math.round(
                        (count / 7) * 100
                      );

                      return (
                        <div key={habit.id}>
                          <div className="mb-2 flex justify-between text-sm">
                            <span>
                              {habit.icon} {habit.name}
                            </span>

                            <span className="font-bold text-blue-600">
                              {percentage}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* HEATMAP */}
              <div
                className={`mt-6 rounded-2xl border p-5 ${cardClass}`}
              >
                <h2 className="font-bold">
                  Activity — Last 30 Days
                </h2>

                <p
                  className={`mb-5 text-sm ${mutedClass}`}
                >
                  Semakin penuh berarti semakin banyak habit
                  yang selesai.
                </p>

                <div className="grid grid-cols-10 gap-2 sm:grid-cols-15">
                  {getLastDays(30).map((date) => {
                    const key = getDateKey(date);
                    const count =
                      getCompletedIds(key).length;

                    const percentage =
                      habits.length === 0
                        ? 0
                        : count / habits.length;

                    return (
                      <div
                        key={key}
                        title={`${formatShortDate(
                          date
                        )} — ${count}/${habits.length}`}
                        className={`aspect-square rounded-md ${
                          percentage === 0
                            ? darkMode
                              ? "bg-slate-800"
                              : "bg-slate-100"
                            : percentage < 0.4
                              ? "bg-blue-200"
                              : percentage < 0.8
                                ? "bg-blue-400"
                                : "bg-blue-600"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* =================================================
              HISTORY
          ================================================= */}
          {activeTab === "history" && (
            <>
              <PageHeader
                title="History"
                description="Riwayat habit yang sudah kamu kerjakan. Halaman ini hanya untuk melihat, bukan checklist."
              />

              <div
                className={`mb-6 rounded-2xl border p-5 ${cardClass}`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase ${mutedClass}`}
                    >
                      Selected day
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      {formatLongDate(
                        getDateFromKey(historyDate)
                      )}
                    </h2>
                  </div>

                  <input
                    type="date"
                    value={historyDate}
                    max={today}
                    onChange={(event) =>
                      setHistoryDate(event.target.value)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                </div>
              </div>

              {(() => {
                const completed =
                  getCompletedIds(historyDate);

                const percentage =
                  habits.length === 0
                    ? 0
                    : Math.round(
                        (completed.length /
                          habits.length) *
                          100
                      );

                return (
                  <>
                    <div
                      className={`mb-6 rounded-2xl border p-5 ${cardClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`text-sm ${mutedClass}`}
                          >
                            Daily completion
                          </p>

                          <div className="mt-1 text-4xl font-bold">
                            {percentage}%
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {completed.length}/
                            {habits.length}
                          </div>

                          <p
                            className={`text-xs ${mutedClass}`}
                          >
                            habits completed
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* READ ONLY HABIT HISTORY */}
                    <div className="space-y-3">
                      {habits.map((habit) => {
                        const done = completed.includes(
                          habit.id
                        );

                        return (
                          <div
                            key={habit.id}
                            className={`flex items-center gap-4 rounded-2xl border p-4 ${cardClass}`}
                          >
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                                done
                                  ? "bg-emerald-500 text-white"
                                  : darkMode
                                    ? "bg-slate-800 grayscale"
                                    : "bg-slate-100 grayscale"
                              }`}
                            >
                              {done ? "✓" : habit.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold">
                                {habit.name}
                              </div>

                              <div
                                className={`mt-1 text-xs ${mutedClass}`}
                              >
                                {habit.description}
                              </div>
                            </div>

                            {/* NO CHECKBOX HERE */}
                            <div
                              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                                done
                                  ? "bg-emerald-100 text-emerald-700"
                                  : darkMode
                                    ? "bg-slate-800 text-slate-500"
                                    : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {done
                                ? "Completed"
                                : "Missed"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DAY STREAK */}
                    <div
                      className={`mt-6 rounded-2xl border p-5 ${cardClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                          🔥
                        </div>

                        <div>
                          <h3 className="font-bold">
                            Streak Snapshot
                          </h3>

                          <p
                            className={`text-sm ${mutedClass}`}
                          >
                            Streak dihitung dari riwayat
                            completion.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {habits.map((habit) => (
                          <div
                            key={habit.id}
                            className={`rounded-xl p-3 ${
                              darkMode
                                ? "bg-slate-900"
                                : "bg-slate-50"
                            }`}
                          >
                            <div className="text-sm">
                              {habit.icon} {habit.name}
                            </div>

                            <div className="mt-1 text-lg font-bold">
                              {getCurrentStreak(
                                habit.id
                              )}{" "}
                              days
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* =================================================
              GOALS
          ================================================= */}
          {activeTab === "goals" && (
            <>
              <PageHeader
                title="Goals & Achievements"
                description="Konsistensi kamu menghasilkan progress dan pencapaian."
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`rounded-2xl border p-5 ${cardClass}`}
                  >
                    <div
                      className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
                        achievement.unlocked
                          ? "bg-blue-600"
                          : darkMode
                            ? "bg-slate-800 grayscale"
                            : "bg-slate-100 grayscale"
                      }`}
                    >
                      {achievement.icon}
                    </div>

                    <h3 className="font-bold">
                      {achievement.title}
                    </h3>

                    <p
                      className={`mt-1 text-sm ${mutedClass}`}
                    >
                      {achievement.description}
                    </p>

                    <div className="mt-5">
                      {achievement.unlocked ? (
                        <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                          ✓ Unlocked
                        </span>
                      ) : (
                        <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={`mt-6 rounded-2xl border p-5 ${cardClass}`}
              >
                <h2 className="font-bold">
                  Your Progress Goals
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <GoalCard
                    title="Total Habits"
                    value={habits.length}
                    target={10}
                    icon="🎯"
                    cardClass={cardClass}
                    mutedClass={mutedClass}
                  />

                  <GoalCard
                    title="Completions"
                    value={totalCompletions}
                    target={100}
                    icon="✅"
                    cardClass={cardClass}
                    mutedClass={mutedClass}
                  />

                  <GoalCard
                    title="Best Streak"
                    value={overallBestStreak}
                    target={30}
                    icon="🔥"
                    cardClass={cardClass}
                    mutedClass={mutedClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* =================================================
              FOCUS
          ================================================= */}
          {activeTab === "focus" && (
            <>
              <PageHeader
                title="Focus Mode"
                description="Timer fokus terpisah dari habit checklist."
              />

              <div className="mx-auto max-w-2xl">
                <div
                  className={`rounded-3xl border p-8 text-center shadow-sm ${cardClass}`}
                >
                  <div className="inline-flex rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
                    {focusMode === "focus"
                      ? "🎯 Focus Session"
                      : "☕ Break Time"}
                  </div>

                  <div className="my-10 text-7xl font-bold tabular-nums md:text-8xl">
                    {pad(Math.floor(focusSeconds / 60))}:
                    {pad(focusSeconds % 60)}
                  </div>

                  <p
                    className={`mb-8 text-sm ${mutedClass}`}
                  >
                    {focusMode === "focus"
                      ? "Kerjakan satu hal penting tanpa distraksi."
                      : "Istirahat sebelum kembali fokus."}
                  </p>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() =>
                        setFocusRunning(
                          (current) => !current
                        )
                      }
                      className="rounded-xl bg-blue-600 px-7 py-3 font-bold text-white shadow-lg shadow-blue-600/20"
                    >
                      {focusRunning ? "Pause" : "Start"}
                    </button>

                    <button
                      onClick={() => {
                        setFocusRunning(false);
                        setFocusMode("focus");
                        setFocusSeconds(25 * 60);
                      }}
                      className={`rounded-xl border px-6 py-3 font-bold ${
                        darkMode
                          ? "border-slate-700"
                          : "border-slate-200"
                      }`}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[15, 25, 50].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => {
                          setFocusRunning(false);
                          setFocusMode("focus");
                          setFocusSeconds(
                            minutes * 60
                          );
                        }}
                        className={`rounded-xl py-3 text-sm font-bold ${
                          darkMode
                            ? "bg-slate-800"
                            : "bg-slate-100"
                        }`}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================
              NOTES
          ================================================= */}
          {activeTab === "notes" && (
            <>
              <PageHeader
                title="Daily Notes"
                description="Catat apa yang terjadi dan bagaimana harimu."
              />

              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <div
                  className={`rounded-2xl border p-4 ${cardClass}`}
                >
                  <p className="mb-3 text-sm font-bold">
                    Recent Days
                  </p>

                  <div className="space-y-1">
                    {getLastDays(7)
                      .reverse()
                      .map((date) => {
                        const key = getDateKey(date);

                        return (
                          <button
                            key={key}
                            onClick={() => setNoteDate(key)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                              noteDate === key
                                ? "bg-blue-600 text-white"
                                : darkMode
                                  ? "hover:bg-slate-800"
                                  : "hover:bg-slate-100"
                            }`}
                          >
                            <span>
                              {formatDay(date)}
                            </span>

                            <span>{date.getDate()}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${cardClass}`}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p
                        className={`text-xs ${mutedClass}`}
                      >
                        Daily Note
                      </p>

                      <h2 className="font-bold">
                        {formatLongDate(
                          getDateFromKey(noteDate)
                        )}
                      </h2>
                    </div>

                    <span className="text-2xl">📝</span>
                  </div>

                  <textarea
                    value={noteText}
                    onChange={(event) =>
                      setNoteText(event.target.value)
                    }
                    placeholder="Bagaimana harimu hari ini?"
                    className={`min-h-[320px] w-full resize-none rounded-2xl border p-5 text-sm leading-7 outline-none focus:border-blue-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  />

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={saveNote}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* MOBILE NAV */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 border-t p-2 lg:hidden ${
          darkMode
            ? "border-slate-800 bg-[#111827]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="grid grid-cols-6">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold ${
                activeTab === item.id
                  ? "text-blue-600"
                  : mutedClass
              }`}
            >
              <span className="text-lg">
                {item.icon}
              </span>

              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ADD / EDIT MODAL */}
      {showHabitModal && (
        <Modal
          title={
            editingHabit
              ? "Edit Habit"
              : "Tambah Habit"
          }
          darkMode={darkMode}
          onClose={() => {
            setShowHabitModal(false);
            setEditingHabit(null);
            resetHabitForm();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold">
                Nama habit
              </label>

              <input
                autoFocus
                value={habitName}
                onChange={(event) =>
                  setHabitName(event.target.value)
                }
                placeholder="Contoh: Belajar Next.js"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                  darkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Deskripsi
              </label>

              <textarea
                rows={3}
                value={habitDescription}
                onChange={(event) =>
                  setHabitDescription(
                    event.target.value
                  )
                }
                placeholder="Apa yang harus dilakukan?"
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${
                  darkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Category
              </label>

              <select
                value={habitCategory}
                onChange={(event) =>
                  setHabitCategory(event.target.value)
                }
                className={`w-full rounded-xl border px-4 py-3 text-sm ${
                  darkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                {CATEGORIES.filter(
                  (item) => item !== "All"
                ).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Icon
              </label>

              <div className="grid grid-cols-8 gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setHabitIcon(icon)}
                    className={`flex h-10 items-center justify-center rounded-xl text-lg ${
                      habitIcon === icon
                        ? "bg-blue-600"
                        : darkMode
                          ? "bg-slate-800"
                          : "bg-slate-100"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => {
                  setShowHabitModal(false);
                  setEditingHabit(null);
                  resetHabitForm();
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${
                  darkMode
                    ? "border-slate-700"
                    : "border-slate-200"
                }`}
              >
                Batal
              </button>

              <button
                disabled={!habitName.trim()}
                onClick={saveHabit}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {editingHabit ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {deletingHabit && (
        <Modal
          title="Hapus Habit?"
          darkMode={darkMode}
          onClose={() => setDeletingHabit(null)}
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
              🗑️
            </div>

            <p className={`text-sm ${mutedClass}`}>
              Kamu yakin ingin menghapus{" "}
              <strong>{deletingHabit.name}</strong>?
            </p>

            <p
              className={`mt-2 text-xs ${mutedClass}`}
            >
              Riwayat completion habit ini juga akan
              dihapus.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingHabit(null)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${
                  darkMode
                    ? "border-slate-700"
                    : "border-slate-200"
                }`}
              >
                Batal
              </button>

              <button
                onClick={deleteHabit}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-bold tracking-tight">
        {title}
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function SmallStat({
  title,
  value,
  icon,
  cardClass,
  mutedClass,
}: {
  title: string;
  value: number | string;
  icon: string;
  cardClass: string;
  mutedClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${cardClass}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs ${mutedClass}`}>
          {title}
        </span>

        <span className="text-lg">{icon}</span>
      </div>

      <div className="mt-1 text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  cardClass,
  mutedClass,
}: {
  title: string;
  value: string;
  icon: string;
  cardClass: string;
  mutedClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${cardClass}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm ${mutedClass}`}>
          {title}
        </span>

        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
          {icon}
        </span>
      </div>

      <div className="mt-4 text-3xl font-bold">
        {value}
      </div>
    </div>
  );
}

function GoalCard({
  title,
  value,
  target,
  icon,
  cardClass,
  mutedClass,
}: {
  title: string;
  value: number;
  target: number;
  icon: string;
  cardClass: string;
  mutedClass: string;
}) {
  const percentage = Math.min(
    100,
    Math.round((value / target) * 100)
  );

  return (
    <div
      className={`rounded-2xl border p-4 ${cardClass}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${mutedClass}`}>
            {title}
          </p>

          <p className="mt-1 text-xl font-bold">
            {value}/{target}
          </p>
        </div>

        <span className="text-xl">{icon}</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-3 font-bold">{title}</h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Modal({
  title,
  children,
  darkMode,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  darkMode: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border p-6 shadow-2xl ${
          darkMode
            ? "border-slate-800 bg-[#111827] text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              darkMode
                ? "bg-slate-800"
                : "bg-slate-100"
            }`}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}