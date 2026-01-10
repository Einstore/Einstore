module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["IBM Plex Sans", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#151318",
        sand: "#f6efe6",
        mist: "#e7f0ee",
        coral: "#e0704f",
        teal: "#2a9d8f",
        cocoa: "#4b2f26",
      },
      boxShadow: {
        float: "0 24px 60px -32px rgba(21, 19, 24, 0.45)",
      },
    },
  },
  plugins: [],
};
