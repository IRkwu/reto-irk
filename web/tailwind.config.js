/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-soft": "var(--panel-soft)",
        control: "var(--control)",
        "control-soft": "var(--control-soft)",
        "control-hover": "var(--control-hover)",
        "surface-deep": "var(--surface-deep)",
        text: "var(--text)",
        "text-strong": "var(--text-strong)",
        "text-soft": "var(--text-soft)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "line-hover": "var(--line-hover)",
        accent: "var(--accent)",
        "accent-text": "var(--accent-text)",
        green: "var(--green)",
        "green-dark": "var(--green-dark)",
        red: "var(--red)",
        amber: "var(--amber)",
      },
      boxShadow: {
        app: "var(--shadow)",
      },
      borderRadius: {
        app: "8px",
      },
      fontFamily: {
        sans: ['"Segoe UI"', "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
};
