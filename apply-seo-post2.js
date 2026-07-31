#!/usr/bin/env node
/* SEO pass, post 2: "Digital Business Cards vs Traditional Business Cards".
   Keyword-shaped H2s around "digital business cards", a "The new standard for
   networking" signature section, internal links, an FAQ (with schema via the
   renderer), and all em dashes removed. Edits src/app/insights/articles.ts only.
   Keeps the post's reordered date (2026-06-28). Backs up to .bak. */
const fs = require("fs");
const p = process.argv[2] || "src/app/insights/articles.ts";
if (!fs.existsSync(p)) { console.error("Cannot find " + p + " - run from your project root."); process.exit(1); }
let text = fs.readFileSync(p, "utf8");
fs.writeFileSync(p + ".bak", text, "utf8");

const newPost =
`  {
    slug: "digital-vs-traditional-business-cards",
    title: "Digital Business Cards vs Traditional Business Cards: Which Is Better?",
    description:
      "Digital business cards vs traditional paper cards: which wins? An honest comparison of cost, convenience, follow up and first impressions.",
    date: "2026-06-28",
    readingTime: "5 min read",
    body: [
      {
        type: "p",
        text: "Paper or digital? It's the question every professional reaches eventually, usually while looking at a box of business cards that's already half out of date. Both still have their place, but they're built for different worlds. Here's an honest comparison of digital business cards versus traditional paper ones.",
      },
      { type: "h2", text: "First impressions: paper vs digital" },
      {
        type: "p",
        text: "A paper card makes a familiar, tactile impression, and a good one can feel genuinely premium. But it's a static object, a name and a number frozen in time. A digital business card makes a different kind of impression: the small moment of surprise when someone taps your card and a clean, living profile fills their screen. One asks to be filed away; the other asks to be explored.",
      },
      { type: "h2", text: "Which one stays up to date?" },
      {
        type: "p",
        text: "This is where paper struggles. The moment it's printed, it's committed to one version of you. New role, new number, new company, and every card already handed out is quietly wrong. A digital business card is a live profile: update it once and everyone who's ever received it sees the current version. Nothing to reprint, nothing out of date.",
      },
      { type: "h2", text: "Cost over time: which is cheaper?" },
      {
        type: "p",
        text: "Paper cards have a low starting cost but a recurring one. Every reprint, every detail change, every rebrand means a new order. A digital business card is a single purchase that never needs replacing, because the information lives online rather than in the ink. Over a few years, the maths increasingly favours digital.",
      },
      { type: "h2", text: "Follow up and memory" },
      {
        type: "p",
        text: "A stack of paper cards gets thinned out and binned. A digital profile gets saved: a contact added, a link followed, a portfolio opened there and then. Instead of hoping you're remembered, you've given someone a reason and a way to follow up immediately.",
      },
      { type: "h2", text: "So which is better, digital or traditional?" },
      {
        type: "p",
        text: "For an occasional, low tech context, paper still does a job. But for anyone networking regularly, who wants to look current, save money over time, and actually be followed up with, a digital business card like TAPPED-IN is simply the more capable tool. It isn't that paper is bad. It's that the world it was designed for has moved on.",
      },
      { type: "h2", text: "The new standard for networking" },
      {
        type: "p",
        text: "A traditional card introduces you once, then slowly goes out of date. A digital one introduces you and keeps introducing you: always current, always one tap away. That's the new standard for networking.",
      },
      {
        type: "faq",
        items: [
          { q: "Are digital business cards better than paper ones?", a: "For anyone who networks regularly, yes. A digital business card stays up to date, costs nothing to change, and lands straight on the other person's phone ready to save. Paper still suits the occasional handover, but it starts going out of date the moment it's printed." },
          { q: "Do digital business cards cost more than paper?", a: "More up front for a single card, but nothing after that. Paper has a low starting price and a recurring one: every reprint, role change or rebrand means another order. Over a couple of years, digital usually works out cheaper." },
          { q: "Can I use a digital business card without an app?", a: "Yes. A card like TAPPED-IN opens your profile in the browser with a tap or a QR code, so neither you nor the person you share with needs to install anything." },
        ],
      },
      {
        type: "related",
        heading: "Keep reading",
        items: [
          { label: "How do NFC business cards work?", href: "/insights/how-do-nfc-business-cards-work" },
          { label: "Are smart business cards worth it for small businesses?", href: "/insights/are-smart-business-cards-worth-it-small-business" },
          { label: "See the Tapped-In card and pricing", href: "/pricing" },
        ],
      },
    ],
  },
`;

const re = /  \{\n    slug: "digital-vs-traditional-business-cards",[\s\S]*?\n  \},\n/;

console.log("\n================ SEO POST 2: DIGITAL VS TRADITIONAL ================");
if (re.test(text)) {
  text = text.replace(re, () => newPost);
  fs.writeFileSync(p, text, "utf8");
  console.log("  PASS  rewrote 'Digital vs Traditional' with SEO structure + FAQ + links");
  console.log("\n  Backup saved to " + p + ".bak");
} else {
  console.log("  MISS  could not find the post — nothing written (file unchanged).");
}
console.log("===================================================================\n");
