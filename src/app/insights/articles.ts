// Content for the TAPPED-IN Insights section.
// To add a new article, add an object to the `articles` array below.
// Body is a simple list of blocks so there are no extra dependencies.

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date, e.g. "2026-06-22"
  readingTime: string;
  body: Block[];
};

export const articles: Article[] = [
  {
    slug: "the-new-standard-for-networking",
    title: "The New Standard for Networking",
    description:
      "For a century, networking meant handing over paper and hoping it survived the week. TAPPED-IN replaces it with a single tap — and a profile that is always current.",
    date: "2026-06-22",
    readingTime: "2 min read",
    body: [
      {
        type: "p",
        text: "For a hundred years, networking has run on the same tired ritual: reach into a pocket, hand over a small rectangle of card, and hope it survives the week. Most don't. The paper card was never the problem — the problem was that it died the moment it was printed. A job change, a new number, a rebrand, and it's already a lie in someone's drawer.",
      },
      {
        type: "p",
        text: "TAPPED-IN replaces the ritual with a single motion. A tap. No app to download, no number to type, no friction. In the half-second it takes to touch a phone, you've handed someone everything that matters — and handed it to them in a way they'll actually keep.",
      },
      {
        type: "p",
        text: "But the tap is just the surface. What you're really sharing isn't contact details; it's a living profile that belongs to you. Update it once and everyone who's ever met you sees the current version. Your latest work, your real links, the way you want to be seen today — not the version you committed to cardstock two years ago. It doesn't get lost, it doesn't run out, and it never goes out of date.",
      },
      {
        type: "p",
        text: "This is the part the old world never understood: a first impression isn't a piece of information. It's a feeling. The way someone reacts when their phone lights up with something clean, considered, and unmistakably yours — that's the moment a connection actually starts. Paper asks to be filed. TAPPED-IN asks to be remembered.",
      },
      {
        type: "p",
        text: "We didn't build a better business card. We retired the idea of one. The future of networking isn't something you print and replace — it's something you own, carry, and grow. One identity, one tap, always current.",
      },
      { type: "p", text: "That's the new standard. Welcome to it." },
    ],
  },
  {
    slug: "from-paper-to-profile",
    title: "From Paper to Profile: Why Your First Impression Should Be Alive",
    description:
      "A printed business card is out of date the moment it's made. Here's why your first impression should be a living digital profile you control — not a paper rectangle.",
    date: "2026-06-22",
    readingTime: "3 min read",
    body: [
      {
        type: "p",
        text: "The business card has barely changed in a century. A name, a number, a logo — frozen onto a piece of card and handed over in the hope it survives the journey to someone's desk. It rarely does. And even when it does, it's often already out of date.",
      },
      { type: "h2", text: "The problem isn't paper. It's permanence." },
      {
        type: "p",
        text: "The moment you print a card, you've committed to a single version of yourself. Change roles, move companies, launch something new, and every card already out in the world is quietly wrong. You're being represented — to the exact people you wanted to impress — by information that's no longer true.",
      },
      {
        type: "p",
        text: "A digital profile doesn't have that problem. It isn't a snapshot; it's a live page that you control. Update it once and every person who has ever tapped your card sees the current you. New role, new project, new link — it's there instantly, everywhere, without reprinting a thing.",
      },
      { type: "h2", text: "A first impression worth keeping" },
      {
        type: "p",
        text: "Then there's the matter of what people actually keep. A stack of paper cards gets thinned out and thrown away. A profile gets saved — a name added to contacts, a link followed, a portfolio opened on the spot. Instead of hoping you're remembered, you've given someone a reason to be.",
      },
      {
        type: "p",
        text: "And because the profile is yours, it can be far more than a phone number. Your work, your socials, the way you want to be seen — gathered in one place and presented the way you'd present yourself in person: deliberately.",
      },
      { type: "h2", text: "From handing out to being added" },
      {
        type: "p",
        text: "This is the quiet shift TAPPED-IN is built around. Networking stops being about distributing paper and starts being about being added — to a contact list, to someone's memory, to the short list of people they'll actually follow up with.",
      },
      {
        type: "p",
        text: "Your card shouldn't be something you run out of. It should be the one introduction that's always you, always current, and always worth keeping.",
      },
    ],
  },
  {
    slug: "will-it-work-on-their-phone",
    title: "Will It Work on Their Phone? Tap-to-Share on iPhone and Android",
    description:
      "Will a tap work on their phone? On virtually every modern iPhone and Android it opens your profile instantly — no app needed. Here's exactly how, plus the backup.",
    date: "2026-06-22",
    readingTime: "3 min read",
    body: [
      {
        type: "p",
        text: "It's the first question everyone asks, and it's a fair one: if you tap your card on someone's phone, will it actually do anything? The short answer is yes — on virtually every modern smartphone, and without anyone downloading a thing.",
      },
      { type: "h2", text: "On iPhone" },
      {
        type: "p",
        text: "Every iPhone from the iPhone XS onward — that's 2018 and later — reads a tap automatically. Hold the card near the top of the phone, a notification appears, and one touch opens your profile. No app, no setup, nothing to switch on. It simply works.",
      },
      {
        type: "p",
        text: "Slightly older iPhones — the 7, 8 and X — can open your card too; they just need the built-in NFC reader opened first, which takes a second from the Control Centre. In practice, almost everyone you hand a card to is already on a phone that handles it instantly.",
      },
      { type: "h2", text: "On Android" },
      {
        type: "p",
        text: "Most modern Android phones have had NFC built in for years, and they read a tap the same effortless way — touch the card to the back of the phone and your profile opens in the browser. No app, no friction, the same clean moment.",
      },
      { type: "h2", text: "And when a phone can't tap" },
      {
        type: "p",
        text: "A small number of older or budget phones don't have NFC at all — and even then, no one is left out. Your TAPPED-IN profile is also reachable by QR code and a simple link, so anyone can open it in seconds, tap or no tap.",
      },
      { type: "h2", text: "The point of all this" },
      {
        type: "p",
        text: "You should never have to wonder whether your card will work when it matters. It's built to do one thing flawlessly: open your profile on whatever phone is in front of you, the moment it's needed. That quiet confidence — that it just works — is the whole point.",
      },
    ],
  },
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
