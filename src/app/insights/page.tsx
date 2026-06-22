import type { Metadata } from "next";
import Link from "next/link";
import { articles, formatDate } from "./articles";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Ideas on modern networking, digital identity, and the end of the paper business card — from TAPPED-IN.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Insights | TAPPED-IN",
    description:
      "Ideas on modern networking, digital identity, and the end of the paper business card.",
    url: "https://tappedin.uk/insights",
    type: "website",
  },
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0a0b",
  color: "#ededed",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  padding: "96px 24px 120px",
};
const container: React.CSSProperties = { maxWidth: 760, margin: "0 auto" };
const kicker: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  fontSize: 13,
  color: "#8a8a90",
  textDecoration: "none",
};
const h1: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontSize: 52,
  lineHeight: 1.05,
  margin: "20px 0 14px",
  color: "#ffffff",
  fontWeight: 600,
};
const sub: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.6,
  color: "#a2a2a8",
  maxWidth: 560,
  margin: 0,
};
const list: React.CSSProperties = {
  marginTop: 56,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};
const card: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "26px 28px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0))",
};
const cardTitle: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  fontSize: 24,
  lineHeight: 1.2,
  margin: "0 0 10px",
  color: "#ffffff",
  fontWeight: 600,
};
const cardDesc: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.6,
  color: "#a2a2a8",
  margin: "0 0 16px",
};
const cardMeta: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#6f6f76",
};

export default function InsightsIndex() {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <main style={page}>
      <div style={container}>
        <Link href="/" style={kicker}>
          TAPPED-IN
        </Link>
        <h1 style={h1}>Insights</h1>
        <p style={sub}>
          Ideas on modern networking, digital identity, and the end of the
          paper business card.
        </p>

        <div style={list}>
          {sorted.map((a) => (
            <Link key={a.slug} href={`/insights/${a.slug}`} style={card}>
              <h2 style={cardTitle}>{a.title}</h2>
              <p style={cardDesc}>{a.description}</p>
              <span style={cardMeta}>
                {formatDate(a.date)} &middot; {a.readingTime}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
