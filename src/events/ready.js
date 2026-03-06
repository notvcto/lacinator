export const name = "ready";
export const once = true;

export function execute(client) {
  console.log(`[LACINATOR] Logged in as ${client.user.tag} — let's get weird 🎲`);
  client.user.setActivity("/random | Lacinator", { type: 2 }); // 2 = LISTENING
}
