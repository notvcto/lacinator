// ============================================================
//  Lacinator Config
// ============================================================

export const config = {
  // Owners: can use ALL commands including /trust add & /trust remove
  // These are always authorized regardless of the DB.
  // Right-click a user in Discord → "Copy User ID" (needs Developer Mode on)
  owners: [""],

  // Default number of questions per page in /list
  listPageSize: 10,

  // Embed colors per question type
  colors: {
    truth: 0x5865f2, // blurple
    dare: 0xed4245, // red
    nhie: 0x57f287, // green
    wyr: 0xfee75c, // yellow
    random: 0xeb459e, // pink
  },

  // Display labels per type
  labels: {
    truth: "Truth 🤔",
    dare: "Dare 😈",
    nhie: "Never Have I Ever 🙋",
    wyr: "Would You Rather 🤷",
  },
};
