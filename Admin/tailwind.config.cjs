module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#111827",
        sand: "#F5F6F8",
        mist: "#EDE9FE",
        coral: "#EF4444",
        teal: "#10B981",
        cocoa: "#6B7280",
        mint: "#C8F7A1",
        lavender: "#B18CFF",
        lavenderDeep: "#8F6DFF",
        slate: "#9CA3AF",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0, 0, 0, 0.06)",
        float: "0 20px 40px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "18px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
