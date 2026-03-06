// ============================================================
//  Lacinator Config
//  Add Discord user IDs here to grant /add permissions
// ============================================================

export const config = {
  // Users allowed to add questions via /add
  // Right-click a user in Discord → "Copy User ID" (needs Developer Mode on)
  authorizedUsers: ["1080137111287640144", "1006166882048548924"],

  // Default number of questions returned by /list (admin command)
  listPageSize: 10,

  // Embed color (hex) for each question type
  colors: {
    truth: 0x5865f2, // blurple
    dare: 0xed4245, // red
    nhie: 0x57f287, // green
    wyr: 0xfee75c, // yellow
    random: 0xeb459e, // pink
  },

  // Category display labels
  labels: {
    truth: "Truth 🤔",
    dare: "Dare 😈",
    nhie: "Never Have I Ever 🙋",
    wyr: "Would You Rather 🤷",
  },
};
