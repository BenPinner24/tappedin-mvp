// Content for the TAPPED-IN Insights/Blogs section.
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
  {
    slug: "how-do-nfc-business-cards-work",
    title: "How Do NFC Business Cards Work? Everything You Need to Know",
    description:
      "How do NFC business cards work? One tap shares your details instantly — no app, no typing. Here's what's inside the card and exactly what happens when it meets a phone.",
    date: "2026-06-24",
    readingTime: "4 min read",
    body: [
      {
        type: "p",
        text: "An NFC business card looks like an ordinary premium card — until you hold it against a phone and someone's screen fills with your profile. No app, no typing, no fumbling for a number. It can feel like magic, but it's a simple, proven technology finally put to elegant use. Here's exactly how an NFC business card works.",
      },
      { type: "h2", text: "What's inside the card" },
      {
        type: "p",
        text: "Built into the card is a tiny NFC chip — Near Field Communication, the same technology behind contactless payments and travel cards. It has no battery and no moving parts. It sits dormant until a phone comes within a few centimetres, at which point the phone's own NFC field quietly powers it. That's why an NFC card never needs charging and never wears out.",
      },
      { type: "h2", text: "What happens when you tap" },
      {
        type: "p",
        text: "Stored on that chip is a single piece of information: a secure web link to your TAPPED-IN profile. When a phone reads the card, it offers to open that link, and your profile appears in the browser in about a second. The other person sees your name, your links and your contact details — whatever you've chosen to share — and can save you to their phone on the spot.",
      },
      { type: "h2", text: "The clever part: the card points to a profile, not your details" },
      {
        type: "p",
        text: "This is what separates a proper NFC card from a gimmick. The card itself doesn't store your phone number or your job title — it stores a permanent link to a profile you control. Change roles, add a new project, update your number, and you edit the profile once. Every card you've ever handed out instantly shows the new version. The card never changes; the profile behind it is always current.",
      },
      { type: "h2", text: "Do you need an app?" },
      {
        type: "p",
        text: "No — and that's the whole point. The person you're sharing with needs nothing installed. Every iPhone from the iPhone XS (2018) onward reads a tap automatically, and most modern Android phones have done so for years. For older handsets, or anyone without NFC, the same profile opens instantly from a QR code or a plain link, so no one is ever left out.",
      },
      {
        type: "p",
        text: "That's the entire trick: a passive chip, a permanent link, and a living profile behind it. Simple to use, impossible to run out of, and always up to date.",
      },
    ],
  },
  {
    slug: "digital-vs-traditional-business-cards",
    title: "Digital Business Cards vs Traditional Business Cards: Which Is Better?",
    description:
      "Digital business cards vs traditional paper cards — which wins? An honest comparison of cost, convenience, follow-up and first impressions for 2026.",
    date: "2026-06-26",
    readingTime: "5 min read",
    body: [
      {
        type: "p",
        text: "Paper or digital? It's the question every professional reaches eventually — usually while looking at a box of business cards that's already half out of date. Both still have their place, but they're built for different worlds. Here's an honest comparison of digital business cards versus traditional ones.",
      },
      { type: "h2", text: "First impressions" },
      {
        type: "p",
        text: "A paper card makes a familiar, tactile impression, and a good one can feel genuinely premium. But it's a static object — a name and a number, frozen in time. A digital card makes a different kind of impression: the small moment of surprise when someone taps your card and a clean, living profile fills their screen. One asks to be filed away; the other asks to be explored.",
      },
      { type: "h2", text: "Staying up to date" },
      {
        type: "p",
        text: "This is where paper struggles. The moment it's printed, it's committed to one version of you. New role, new number, new company — and every card already handed out is quietly wrong. A digital card is a live profile: update it once and everyone who's ever received it sees the current version. Nothing to reprint, nothing out of date.",
      },
      { type: "h2", text: "Cost over time" },
      {
        type: "p",
        text: "Paper cards have a low up-front cost but a recurring one — every reprint, every detail change, every rebrand means a new order. A digital card is a one-off: a single card that never needs replacing, because the information lives online rather than in the ink. Over a few years, the maths increasingly favours digital.",
      },
      { type: "h2", text: "Follow-up and memory" },
      {
        type: "p",
        text: "A stack of paper cards gets thinned out and binned. A digital profile gets saved — a contact added, a link followed, a portfolio opened there and then. Instead of hoping you're remembered, you've given someone a reason and a way to follow up immediately.",
      },
      { type: "h2", text: "So which is better?" },
      {
        type: "p",
        text: "For a one-off, low-tech context, paper still does a job. But for anyone networking regularly — who wants to look current, save money over time, and actually be followed up with — a digital card like TAPPED-IN is simply the more capable tool. It isn't that paper is bad. It's that the world it was designed for has moved on.",
      },
    ],
  },
  {
    slug: "are-smart-business-cards-worth-it-small-business",
    title: "Are Smart Business Cards Worth It for Small Businesses?",
    description:
      "Are smart business cards worth it for a small business in the UK? A practical look at the real costs, benefits and return before you buy.",
    date: "2026-06-27",
    readingTime: "4 min read",
    body: [
      {
        type: "p",
        text: "If you run a small business, every spend has to earn its place. So it's a fair question: is a smart business card actually worth it, or is it just a gadget? Here's a practical look, without the hype.",
      },
      { type: "h2", text: "What you're actually paying for" },
      {
        type: "p",
        text: "A smart (NFC) business card is a one-off cost for a physical card plus a digital profile. Unlike paper, you don't reorder it when your details change — you update the profile online and the same card keeps working. For a small business, that alone removes a recurring cost and a recurring hassle.",
      },
      { type: "h2", text: "Where it earns its keep" },
      {
        type: "p",
        text: "The real value is in conversion. A paper card relies on someone keeping it, finding it later, and typing your details in. A smart card drops your full profile onto their phone in one tap — website, booking link, socials, contact — ready to save or act on immediately. For a small business chasing every lead, removing that friction is where the return shows up.",
      },
      {
        type: "ul",
        items: [
          "One design for the whole team, each card linked to its own profile",
          "No reprinting when a number, role or offer changes",
          "Direct links to booking, your online shop, reviews or socials",
          "A modern, credible first impression that punches above your size",
        ],
      },
      { type: "h2", text: "The honest caveats" },
      {
        type: "p",
        text: "A smart card won't win you business on its own — it's a tool, not magic. It works best when your profile is set up well and you actually use it. And if you only hand out a card once a year, paper may be enough. But if you network, attend events, or meet customers regularly, the cost is small and the upside is real.",
      },
      { type: "h2", text: "The verdict" },
      {
        type: "p",
        text: "For most small businesses in the UK, a smart business card pays for itself quickly — not because it's clever, but because it removes the friction between meeting someone and being remembered. Spend a little, look current, and make every introduction easier to act on.",
      },
    ],
  },
  {
    slug: "nfc-business-cards-for-sales-teams",
    title: "Why Sales Teams Are Switching to NFC Business Cards",
    description:
      "NFC business cards for sales teams: faster lead capture, instant follow-up and a consistent brand on every rep. Here's why sales teams are making the switch.",
    date: "2026-06-28",
    readingTime: "4 min read",
    body: [
      {
        type: "p",
        text: "Sales runs on two things: first impressions and follow-up speed. Paper cards quietly undermine both. That's why a growing number of sales teams are moving to NFC business cards — and why it's about far more than looking modern.",
      },
      { type: "h2", text: "Faster lead capture" },
      {
        type: "p",
        text: "Every second between meeting someone and capturing their interest is a second to lose them. An NFC card collapses that gap: one tap puts your profile — and a way to reach you — straight onto a prospect's phone while the conversation is still warm. No 'I'll email you the details', no card that gets lost on the way home.",
      },
      { type: "h2", text: "A consistent brand on every rep" },
      {
        type: "p",
        text: "With paper, every reprint risks a different version — an old title, a wrong number, an off-brand card. With NFC, the whole team runs on profiles you control centrally: same branding, current details, no rogue cards. When someone changes role, you update their profile, not their print order.",
      },
      { type: "h2", text: "Follow-up that actually happens" },
      {
        type: "p",
        text: "The best lead is worthless if the follow-up slips. An NFC profile can point straight to a booking link, a calendar or an enquiry form — turning a handshake into a booked call without the prospect having to chase. You meet them where their attention already is: on their phone.",
      },
      { type: "h2", text: "Measurable, not guesswork" },
      {
        type: "p",
        text: "Paper cards vanish into pockets and you never know what happened next. A digital profile can show taps and clicks — which reps are sharing, what's being opened, where interest is real. For a sales manager, that's the difference between hoping and knowing.",
      },
      {
        type: "p",
        text: "Sales teams aren't switching to NFC cards to look slick. They're switching because faster capture, consistent branding and trackable follow-up are exactly the things that move a pipeline — and paper was quietly costing them all three.",
      },
    ],
  },
  {
    slug: "nfc-business-cards-lead-generation-events",
    title: "How NFC Business Cards Improve Lead Generation at Events",
    description:
      "Turn event conversations into captured leads. How NFC business cards speed up exhibition and conference lead capture — and stop great contacts slipping away.",
    date: "2026-06-29",
    readingTime: "4 min read",
    body: [
      {
        type: "p",
        text: "Events are a numbers game with a cruel twist: you meet dozens of promising people, then watch most of them evaporate by the time you're home. The problem is rarely the conversations — it's what happens in the ten seconds after them. NFC business cards are built to fix exactly that.",
      },
      { type: "h2", text: "The follow-up gap" },
      {
        type: "p",
        text: "At a busy stand or conference, the usual ritual — swap paper cards, promise to email — falls apart at scale. Cards get mixed up, names get forgotten, and the warm moment cools before anyone follows up. Every lost card is a lost lead.",
      },
      { type: "h2", text: "One tap, captured" },
      {
        type: "p",
        text: "An NFC card turns that ten-second window into a clean handoff. Tap, and your full profile lands on their phone, ready to save, with your booking link, site and contact one touch away. Better still, you can point the profile at a short form or a lead magnet, so a quick chat becomes a captured contact rather than a maybe.",
      },
      { type: "h2", text: "Faster than a queue" },
      {
        type: "p",
        text: "On an exhibition floor, speed wins. There's no app to open, no scanner to fetch, no details to write down while three more people wait. A tap takes a second — which means more real conversations, and still capturing every one.",
      },
      { type: "h2", text: "You learn what worked" },
      {
        type: "p",
        text: "Because everything runs through a digital profile, you can see the activity an event generated — which days, which moments, which links landed. Instead of guessing whether a show was worth it, you have a record of the interest it created.",
      },
      {
        type: "p",
        text: "Events are expensive and exhausting. NFC cards make sure the part that matters — turning conversations into contacts you can actually follow up — doesn't come down to a pocket full of paper and a good memory.",
      },
    ],
  },
  {
    slug: "nfc-business-cards-for-estate-agents",
    title: "NFC Business Cards for Estate Agents: The Complete Guide",
    description:
      "NFC business cards for estate agents: share listings, book viewings and capture buyers in one tap — at valuations, viewings and open houses. The complete guide.",
    date: "2026-06-30",
    readingTime: "5 min read",
    body: [
      {
        type: "p",
        text: "Estate agency is a contact sport. Valuations, viewings, open houses, the chance conversation outside a property — every one is a moment to capture a buyer or win an instruction. An NFC business card is built for exactly these moments, and it fits an agent's day better than paper ever did.",
      },
      { type: "h2", text: "At a valuation" },
      {
        type: "p",
        text: "First impressions win instructions. Tapping a sleek card that opens a polished profile — your recent sales, your reviews, and a direct line to book — tells a seller you're modern, organised and worth trusting with their biggest asset. It's a small moment that quietly sets you apart from the agent who left a paper card on the kitchen worktop.",
      },
      { type: "h2", text: "At viewings and open houses" },
      {
        type: "p",
        text: "A viewing is full of warm leads who'll go cold by the weekend. With a tap, a buyer leaves with your profile saved, a link to similar listings, and a one-tap way to book another viewing or register their interest. Instead of hoping they call, you've given them an easy way to act while the property is still fresh in their mind.",
      },
      { type: "h2", text: "Capturing buyers, not just sharing details" },
      {
        type: "p",
        text: "The real win is turning footfall into a database. Point your profile at a quick registration link and every tap can become a qualified buyer on your books — their requirements captured, ready to match against new instructions. That's a mailing list built one handshake at a time.",
      },
      { type: "h2", text: "One brand across the whole branch" },
      {
        type: "ul",
        items: [
          "Every agent on a consistent, on-brand profile",
          "Update a number, photo or patch without reprinting",
          "Link straight to your portal listings, reviews and booking",
          "A premium feel that reflects the homes you sell",
        ],
      },
      {
        type: "p",
        text: "For estate agents, the value isn't the novelty of the tap — it's that it slots into the moments you already work: the valuation, the viewing, the doorstep chat. It makes you look the part, and it makes sure the people you meet don't slip away.",
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
