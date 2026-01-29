import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                /* ===============================
                   BASE SURFACES (GoodNotes-style)
                =============================== */
                background: {
                    DEFAULT: "#F7F8FA",     // soft paper white
                    dark: "#121417",        // ink-friendly dark
                },
                surface: {
                    DEFAULT: "#FFFFFF",     // cards / sheets
                    dark: "#1A1D21",        // raised surfaces
                },
                canvas: {
                    DEFAULT: "#FCFCFD",     // writing canvas
                    dark: "#16191D",        // dark canvas
                },

                /* ===============================
                   TEXT / INK COLORS
                =============================== */
                ink: {
                    primary: "#1F2937",     // main text
                    secondary: "#6B7280",   // hints, labels
                    muted: "#9CA3AF",       // placeholders
                    dark: {
                        primary: "#E5E7EB",
                        secondary: "#9CA3AF",
                        muted: "#6B7280",
                    },
                },

                /* ===============================
                   PRIMARY ACCENT (GoodNotes Blue)
                =============================== */
                primary: {
                    DEFAULT: "#3B82F6",     // calm blue
                    hover: "#2563EB",
                    soft: "#E8F0FE",
                    dark: "#60A5FA",
                },

                /* ===============================
                   SECONDARY ACCENTS
                =============================== */
                graphite: {
                    DEFAULT: "#4B5563",     // toolbars
                    soft: "#E5E7EB",
                    dark: "#9CA3AF",
                },

                moss: {
                    DEFAULT: "#4D7C5B",     // success / subtle green
                    soft: "#E6F2EA",
                    dark: "#86B39A",
                },

                amber: {
                    DEFAULT: "#D97706",     // warnings / highlights
                    soft: "#FEF3C7",
                    dark: "#FBBF24",
                },

                coral: {
                    DEFAULT: "#F97316",     // destructive / delete
                    soft: "#FFEDD5",
                    dark: "#FDBA74",
                },

                /* ===============================
                   BORDERS & DIVIDERS
                =============================== */
                border: {
                    DEFAULT: "#E5E7EB",
                    dark: "#2A2F36",
                },

                ring: {
                    DEFAULT: "#93C5FD",
                    dark: "#2563EB",
                },
            },
        },
    },
    plugins: [],
};

export default config;
