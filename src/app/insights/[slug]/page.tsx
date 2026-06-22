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

const css = `
.ti-art{position:relative;min-height:100vh;overflow:hidden;background:#070708;color:#f4f4f6;font-family:var(--font-inter),system-ui,sans-serif;padding:clamp(64px,9vw,84px) 24px 140px;}
.ti-art *{box-sizing:border-box;}
.ti-art-glow{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.ti-art-glow::before{content:"";position:absolute;top:-380px;left:50%;transform:translateX(-50%);width:1100px;height:1100px;max-width:170vw;background:radial-gradient(circle,rgba(255,255,255,0.06),rgba(255,255,255,0) 60%),repeating-radial-gradient(circle,rgba(255,255,255,0.05) 0 1px,rgba(255,255,255,0) 1px 30px);-webkit-mask-image:radial-gradient(circle,#000 0%,transparent 60%);mask-image:radial-gradient(circle,#000 0%,transparent 60%);opacity:.55;}
.ti-art-wrap{position:relative;max-width:680px;margin:0 auto;}
.ti-art .ti-eyebrow{display:inline-block;font-family:var(--font-oswald),sans-serif;font-weight:500;text-transform:uppercase;letter-spacing:.28em;font-size:12px;color:#7c7c85;text-decoration:none;transition:color .3s ease;}
.ti-art a.ti-eyebrow:hover{color:#cfcfd6;}
.ti-art-title{font-family:var(--font-oswald),sans-serif;font-weight:600;font-size:clamp(34px,5.4vw,46px);line-height:1.1;letter-spacing:-0.01em;margin:30px 0 18px;color:#fff;}
.ti-art-meta{font-family:var(--font-oswald),sans-serif;text-transform:uppercase;letter-spacing:.18em;font-size:12px;color:#6a6a73;margin:0 0 46px;}
.ti-art-p{font-size:clamp(17px,2.3vw,18px);line-height:1.78;color:#cdcdd4;margin:0 0 24px;font-weight:300;}
.ti-art-p.ti-lead{font-size:clamp(20px,3vw,22px);line-height:1.62;color:#eaeaef;margin-bottom:30px;}
.ti-art-h2{font-family:var(--font-oswald),sans-serif;font-weight:600;font-size:clamp(22px,3vw,25px);line-height:1.25;color:#fff;margin:44px 0 16px;}
.ti-art-ul{margin:0 0 24px;padding-left:22px;color:#cdcdd4;font-size:18px;line-height:1.78;font-weight:300;}
.ti-art-ul li{margin-bottom:8px;}
.ti-art-cta{margin-top:70px;padding-top:42px;border-top:1px solid rgba(255,255,255,0.10);text-align:center;}
.ti-cta-line{font-family:var(--font-oswald),sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:clamp(17px,2.6vw,19px);color:#f4f4f6;margin:0 0 26px;}
.ti-cta-btn{display:inline-block;text-decoration:none;font-family:var(--font-oswald),sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:13px;color:#070708;background:#fff;padding:15px 32px;border-radius:999px;transition:transform .25s ease,background .25s ease;}
.ti-cta-btn:hover{transform:translateY(-2px);background:#e9e9ee;}
.ti-cta-btn:focus-visible,.ti-art a.ti-eyebrow:focus-visible{outline:2px solid rgba(255,255,255,0.45);outline-offset:5px;}
@media (prefers-reduced-motion: reduce){.ti-cta-btn{transition:none;}.ti-cta-btn:hover{transform:none;}}
`;

function renderBlock(block: Block, i: number) {
  if (block.type === "h2") return <h2 key={i} className="ti-art-h2">{block.text}</h2>;
  if (block.type === "ul")
    return (
      <ul key={i} className="ti-art-ul">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  return (
    <p key={i} className={i === 0 ? "ti-art-p ti-lead" : "ti-art-p"}>
      {block.text}
    </p>
  );
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
    author: { "@type": "Organization", name: "TAPPED-IN", url: "https://tappedin.uk" },
    publisher: { "@type": "Organization", name: "TAPPED-IN", url: "https://tappedin.uk" },
    mainEntityOfPage: `https://tappedin.uk/insights/${article.slug}`,
  };

  return (
    <main className="ti-art">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ti-art-glow" aria-hidden="true" />
      <article className="ti-art-wrap">
        <Link href="/insights" className="ti-eyebrow">
          &larr; Insights
        </Link>
        <h1 className="ti-art-title">{article.title}</h1>
        <p className="ti-art-meta">
          {formatDate(article.date)} &middot; {article.readingTime}
        </p>

        {article.body.map((block, i) => renderBlock(block, i))}

        <div className="ti-art-cta">
          <p className="ti-cta-line">One identity, one tap, always current.</p>
          <Link href="/" className="ti-cta-btn">
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
