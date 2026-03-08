// ============================================================
//  Lacinator Config
// ============================================================

export const config = {
  // Owners: can use ALL commands including /trust add & /trust remove
  // These are always authorized regardless of the DB.
  // Right-click a user in Discord → "Copy User ID" (needs Developer Mode on)
  owners: ["1080137111287640144"],

  // ── Andi Tax ──────────────────────────────────────────────────────────────
  // Andi's Discord user ID — the victim
  andiUserId: "562950696119566336",

  // Probability (0–1) that Andi's question pulls from the special pool
  // 0.20 = 20% chance. Set to 1.0 for full chaos.
  andiTaxRate: 0.2,

  // How long before question buttons auto-disable (ms). Default: 5 minutes.
  buttonExpiryMs: 5 * 60 * 1000,

  // Default number of questions per page in /list
  listPageSize: 10,

  // Embed colors per question type
  colors: {
    truth: 0x5865f2, // blurple
    dare: 0xed4245, // red
    nhie: 0x57f287, // green
    wyr: 0xfee75c, // yellow
    random: 0xeb459e, // pink
    andi: 0xff0000,
  },

  // Display labels per type
  labels: {
    truth: "Truth 🤔",
    dare: "Dare 😈",
    nhie: "Never Have I Ever 🙋",
    wyr: "Would You Rather 🤷",
  },
};
