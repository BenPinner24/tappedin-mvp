#!/usr/bin/env node
/* Replace the billing-only FAQ list in src/app/pricing/page.tsx with honest,
   product-focused questions (phones, tapping, single-sided, tap strength,
   collector's asset, no app, QR fallback). No dashes in the copy.
   Backs up to .bak. Touches only src/app/pricing/page.tsx. */
const fs = require("fs");
const p = process.argv[2] || "src/app/pricing/page.tsx";
if (!fs.existsSync(p)) { console.error("Cannot find " + p + " - run from your project root."); process.exit(1); }
let text = fs.readFileSync(p, "utf8");
fs.writeFileSync(p + ".bak", text, "utf8");

const NEW_FAQS = `const FAQS = [
  { q: 'Which phones does it work on?', a: 'Tapped-In works with the NFC reader built into virtually any modern smartphone. On iPhone, hold the top of the phone to the card. On Android, use the centre of the back. There is no app to download, for you or the person you are sharing with.' },
  { q: 'Where exactly do I tap?', a: 'On iPhone, the NFC reader sits at the very top edge, so tap the card there. On Android it is usually the centre of the back. If nothing happens straight away, move the card slowly around that area so it lines up with the reader.' },
  { q: 'Is the Founders Edition single or double-sided?', a: 'The Founders Edition is single-sided by design, with the numbered collector\\u2019s design on one face. The everyday PVC Tapped-In Card is the workhorse, built for the strongest, most reliable tap.' },
  { q: 'Is the Founders tap as strong as the standard card?', a: 'Honestly, no. The PVC Tapped-In Card has the strongest, most reliable tap because its material leaves the antenna unobstructed. The Founders Edition is a premium metal collector\\u2019s card, so its tap can be a little more particular about positioning. For heavy daily use, reach for the PVC. The Founders is the keepsake.' },
  { q: 'What makes the Founders Edition special?', a: 'The Founders Edition is a true collector\\u2019s item. It is the first 100 cards Tapped-In ever made, each individually numbered from 1 to 100. This edition will never be reproduced or restocked, so once all 100 are claimed, no more will ever exist. Owning one isn\\u2019t just a card, it is a permanent piece of the brand\\u2019s origin, held by only 100 people, ever.' },
  { q: 'Do I or the other person need an app?', a: 'No. Neither of you needs to install anything. Your card opens your profile straight in the browser, so anyone can receive it instantly.' },
  { q: 'What if someone\\u2019s phone will not tap?', a: 'You are never stuck. Every profile also has its own QR code and a shareable link, so you can share it even if a tap does not land.' },
]`;

const re = /const FAQS = \[[\s\S]*?\n\]/;

console.log("\n================ PRICING FAQ ================");
if (re.test(text)) {
  text = text.replace(re, () => NEW_FAQS);
  fs.writeFileSync(p, text, "utf8");
  console.log("  PASS  replaced FAQ list with 7 product questions");
  console.log("\n  Backup saved to " + p + ".bak");
} else {
  console.log("  MISS  could not find the FAQS array — nothing written.");
}
console.log("============================================\n");
