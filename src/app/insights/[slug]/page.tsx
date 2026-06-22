import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, formatDate, type Block } from "../articles";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  const url = `https://tappedin.uk/insights/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      title: `${article.title} | TAPPED-IN`,
      description: article.description,
      url,
      type: "article",
      publishedTime: article.date,
    },
  };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0a0b",
  color: "#ededed",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  padding: "72px 24px 120px",
};
const container: React.CSSProperties = { maxWidth: 680, margin: "0 auto" };
const back: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  fontSize: 12,
  color: "#8a8a90",
  textDecoration: "none",
};
const h1: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  fontSize: 42,
  lineHeight: 1.12,
  margin: "28px 0 14px",
  color: "#ffffff",
  fontWeight: 600,
};
const meta: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#6f6f76",
  margin: "0 0 40px",
};
const para: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.75,
  color: "#cfcfd4",
  margin: "0 0 22px",
};
const h2: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  fontSize: 24,
  lineHeight: 1.25,
  color: "#ffffff",
  fontWeight: 600,
  margin: "40px 0 14px",
};
const listWrap: React.CSSProperties = {
  margin: "0 0 22px",
  paddingLeft: 22,
  color: "#cfcfd4",
  fontSize: 18,
  lineHeight: 1.75,
};
const ctaWrap: React.CSSProperties = {
  marginTop: 64,
  paddingTop: 36,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center",
};
const ctaText: React.CSSProperties = {
  fontFamily: "var(--font-oswald), sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: 18,
  color: "#ededed",
  margin: "0 0 20px",
};
const ctaBtn: React.CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  fontFamily: "var(--font-oswald), sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: 14,
  color: "#0a0a0b",
  background: "#ffffff",
  padding: "14px 28px",
  borderRadius: 999,
};

function renderBlock(block: Block, i: number) {
  if (block.type === "h2") return <h2 key={i} style={h2}>{block.text}</h2>;
  if (block.type === "ul")
    return (
      <ul key={i} style={listWrap}>
        {block.items.map((item, j) => (
          <li key={j} style={{ marginBottom: 8 }}>
            {item}
          </li>
        ))}
      </ul>
    );
  return <p key={i} style={para}>{block.text}</p>;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: "TAPPED-IN",
      url: "https://tappedin.uk",
    },
    publisher: {
      "@type": "Organization",
      name: "TAPPED-IN",
      url: "https://tappedin.uk",
    },
    mainEntityOfPage: `https://tappedin.uk/insights/${article.slug}`,
  };

  return (
    <main style={page}>
      <article style={container}>
        <Link href="/insights" style={back}>
          &larr; Insights
        </Link>
        <h1 style={h1}>{article.title}</h1>
        <p style={meta}>
          {formatDate(article.date)} &middot; {article.readingTime}
        </p>

        {article.body.map((block, i) => renderBlock(block, i))}

        <div style={ctaWrap}>
          <p style={ctaText}>One identity, one tap, always current.</p>
          <Link href="/" style={ctaBtn}>
            Explore TAPPED-IN
          </Link>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </main>
  );
}
