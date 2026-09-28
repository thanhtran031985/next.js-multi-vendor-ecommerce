import type { Metadata } from "next";
import { Instrument_Sans, Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Covet", template: "%s | Covet" },
  description: "One storefront, one checkout, thousands of independent sellers and brands.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sora.variable} ${instrumentSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        {/* The app's only Toaster. Styled with tokens. */}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "font-sans text-14 leading-140",
            // Inline style is needed to override react-hot-toast's own inline defaults.
            style: {
              color: "var(--ink)",
              background: "var(--surface)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--r-control)",
              boxShadow: "var(--shadow-sm)",
            },
            error: { iconTheme: { primary: "var(--error-solid)", secondary: "var(--white)" } },
            success: { iconTheme: { primary: "var(--success-solid)", secondary: "var(--white)" } },
          }}
        />
      </body>
    </html>
  );
}
