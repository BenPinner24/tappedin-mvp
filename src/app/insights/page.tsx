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

const css = `
.ti-ins{position:relative;min-height:100vh;overflow:hidden;background:#070708;color:#f4f4f6;font-family:var(--font-inter),system-ui,sans-serif;padding:clamp(80px,12vw,120px) 24px 140px;}
.ti-ins *{box-sizing:border-box;}
.ti-ins-glow{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.ti-ins-glow::before{content:"";position:absolute;top:-340px;left:50%;transform:translateX(-50%);width:1100px;height:1100px;max-width:170vw;background:radial-gradient(circle,rgba(255,255,255,0.07),rgba(255,255,255,0) 60%),repeating-radial-gradient(circle,rgba(255,255,255,0.055) 0 1px,rgba(255,255,255,0) 1px 30px);-webkit-mask-image:radial-gradient(circle,#000 0%,transparent 60%);mask-image:radial-gradient(circle,#000 0%,transparent 60%);opacity:.6;}
.ti-ins-wrap{position:relative;max-width:780px;margin:0 auto;}
.ti-ins .ti-eyebrow{display:inline-block;font-family:var(--font-oswald),sans-serif;font-weight:500;text-transform:uppercase;letter-spacing:.34em;font-size:12px;color:#7c7c85;text-decoration:none;transition:color .3s ease;}
.ti-ins a.ti-eyebrow:hover{color:#cfcfd6;}
.ti-ins-title{font-family:var(--font-oswald),sans-serif;font-weight:600;font-size:clamp(38px,7vw,60px);line-height:1.05;letter-spacing:-0.01em;margin:26px 0 22px;color:#fff;max-width:13ch;}
.ti-ins-stand{font-size:clamp(17px,2.4vw,19px);line-height:1.65;color:#a7a7b0;max-width:48ch;font-weight:300;}
.ti-ins-rule{height:1px;background:rgba(255,255,255,0.10);margin:60px 0 0;}
.ti-ins-list{list-style:none;margin:0;padding:0;}
.ti-ins-item{border-top:1px solid rgba(255,255,255,0.09);}
.ti-ins-item:first-child{border-top:none;}
.ti-ins-link{display:block;text-decoration:none;color:inherit;padding:40px 0;transition:padding-left .35s ease;}
.ti-ins-link:hover{padding-left:14px;}
.ti-ins-meta{font-family:var(--font-oswald),sans-serif;text-transform:uppercase;letter-spacing:.18em;font-size:11.5px;color:#6a6a73;}
.ti-ins-h2{font-family:var(--font-oswald),sans-serif;font-weight:600;font-size:clamp(24px,3.4vw,30px);line-height:1.18;color:#f4f4f6;margin:12px 0 14px;transition:color .3s ease;max-width:24ch;}
.ti-ins-link:hover .ti-ins-h2{color:#fff;}
.ti-ins-desc{font-size:16.5px;line-height:1.6;color:#9b9ba4;max-width:60ch;font-weight:300;margin:0;}
.ti-ins-arrow{display:inline-flex;align-items:center;gap:8px;margin-top:20px;font-family:var(--font-oswald),sans-serif;text-transform:uppercase;letter-spacing:.2em;font-size:12px;color:#8a8a92;transition:color .3s ease;}
.ti-ins-link:hover .ti-ins-arrow{color:#fff;}
.ti-ins-arrow b{font-weight:400;transition:transform .3s ease;}
.ti-ins-link:hover .ti-ins-arrow b{transform:translateX(6px);}
.ti-ins-link:focus-visible{outline:2px solid rgba(255,255,255,0.45);outline-offset:6px;border-radius:4px;}
@media (prefers-reduced-motion: reduce){.ti-ins-link,.ti-ins-h2,.ti-ins-arrow,.ti-ins-arrow b{transition:none;}.ti-ins-link:hover{padding-left:0;}.ti-ins-link:hover .ti-ins-arrow b{transform:none;}}
`;

export default function InsightsIndex() {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <main className="ti-ins">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ti-ins-glow" aria-hidden="true" />
      <div className="ti-ins-wrap">
        <Link href="/" className="ti-eyebrow">
          Tapped-In &middot; Insights
        </Link>
        <h1 className="ti-ins-title">
          Notes on the new standard for networking.
        </h1>
        <p className="ti-ins-stand">
          On modern networking, digital identity, and the slow decline of the
          paper business card.
        </p>
        <div className="ti-ins-rule" />

        <ul className="ti-ins-list">
          {sorted.map((a) => (
            <li className="ti-ins-item" key={a.slug}>
              <Link href={`/insights/${a.slug}`} className="ti-ins-link">
                <span className="ti-ins-meta">
                  {formatDate(a.date)} &middot; {a.readingTime}
                </span>
                <h2 className="ti-ins-h2">{a.title}</h2>
                <p className="ti-ins-desc">{a.description}</p>
                <span className="ti-ins-arrow">
                  Read <b>&rarr;</b>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
