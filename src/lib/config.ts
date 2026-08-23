// ─────────────────────────────────────────────────────────────────────────────
// TAPPED-IN · SITE CONFIG
// SOLD_OUT: master switch for card stock status.
//   false = normal — "Get your card" buttons go to Stripe checkout.
//   true  = sold out — buttons become "Join the waitlist" and open the waitlist form.
// To flip: change the value below, save, then deploy (git push). All pages update together.
// ─────────────────────────────────────────────────────────────────────────────
export const SOLD_OUT = false