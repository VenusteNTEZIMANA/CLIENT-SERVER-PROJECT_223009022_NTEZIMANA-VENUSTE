
import Link from "next/link";

const features = [
  {
    icon: "🎯",
    title: "Track Your Habits",
    description:
      "Create daily habits and keep track of your personal routines.",
  },
  {
    icon: "🔥",
    title: "Build Your Streak",
    description:
      "Stay consistent and monitor your longest and current streaks.",
  },
  {
    icon: "📊",
    title: "See Your Progress",
    description:
      "Use activity calendars and analytics to understand your progress.",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fffaf6",
        padding: "28px 5%",
      }}
    >
      <nav
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#282326",
            fontSize: "24px",
            fontWeight: 800,
            fontFamily: "Manrope, sans-serif",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "42px",
              height: "42px",
              display: "grid",
              placeItems: "center",
              background: "#a50e2d",
              color: "white",
              borderRadius: "12px",
            }}
          >
            ✓
          </span>
          Habit<span style={{ color: "#a50e2d" }}>Flow</span>
        </Link>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/login"
            className="secondary-button"
          >
            Log In
          </Link>

          <Link
            href="/signup"
            className="primary-button"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section
        style={{
          maxWidth: "1000px",
          margin: "105px auto 90px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: "30px",
            background: "#f8e9ed",
            color: "#a50e2d",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          BUILD BETTER HABITS EVERY DAY
        </span>

        <h1
          style={{
            margin: "25px 0 18px",
            fontFamily: "Manrope, sans-serif",
            fontSize: "clamp(38px, 6vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          Small Steps.
          <br />
          <span style={{ color: "#a50e2d" }}>
            Big Changes.
          </span>
        </h1>

        <p
          style={{
            maxWidth: "650px",
            margin: "0 auto 32px",
            color: "#81777a",
            fontSize: "17px",
            lineHeight: 1.8,
          }}
        >
          Build powerful daily routines, track your progress,
          maintain your streaks, and become the best version
          of yourself with HabitFlow.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/signup"
            className="primary-button"
            style={{
              padding: "14px 25px",
              fontSize: "15px",
            }}
          >
            Start Building Habits →
          </Link>

          <Link
            href="/login"
            className="secondary-button"
            style={{
              padding: "14px 25px",
              fontSize: "15px",
            }}
          >
            I Already Have an Account
          </Link>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "22px",
        }}
      >
        {features.map((feature) => (
          <article
            key={feature.title}
            className="card"
            style={{ padding: "28px" }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                display: "grid",
                placeItems: "center",
                background: "#f8e9ed",
                borderRadius: "13px",
                fontSize: "25px",
              }}
            >
              {feature.icon}
            </div>

            <h2 style={{ margin: "22px 0 10px", fontSize: "19px" }}>
              {feature.title}
            </h2>

            <p style={{ color: "#81777a", lineHeight: 1.7 }}>
              {feature.description}
            </p>
          </article>
        ))}
      </section>

      <footer
        style={{
          borderTop: "1px solid #f0e5e7",
          padding: "25px 0",
          textAlign: "center",
          color: "#81777a",
          fontSize: "13px",
        }}
      >
        © {new Date().getFullYear()} HabitFlow.
        Build better habits, build a better life.
      </footer>
    </main>
  );
}
