import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { isAuthorized, isOwner } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("See everything Lacinator can do 📖");

export async function execute(interaction) {
  const authorized = await isAuthorized(interaction.user.id);
  const owner      = isOwner(interaction.user.id);

  // ── Game commands (everyone) ───────────────────────────────────────────
  const gameCommands = [
    ["/truth",  "Get a random Truth question."],
    ["/dare",   "Get a random Dare."],
    ["/nhie",   "Get a Never Have I Ever prompt."],
    ["/wyr",    "Get a Would You Rather question."],
    ["/random", "Get a random question from any category."],
    ["/ship",   "Find out how compatible two people are 💘"],
    ["/bully",  "Deploy the boot 🥾"],
    ["/stats",  "See the question pool breakdown."],
    ["/ping",   "Check if Lacinator is alive."],
  ];

  // ── Mod commands (authorized users) ───────────────────────────────────
  const modCommands = [
    ["/add",    "Add a question to the pool."],
    ["/edit",   "Edit a question by ID."],
    ["/remove", "Remove a question by ID."],
    ["/list",   "Browse the question pool."],
    ["/search",   "Search questions by keyword."],
    ["/andiadd",  "Add a question to the Andi special pool 🎯"],
    ["/andilist", "Browse & manage the Andi pool 🎯"],
  ];

  // ── Owner commands ─────────────────────────────────────────────────────
  const ownerCommands = [
    ["/trust add",    "Grant a user access to manage questions."],
    ["/trust remove", "Revoke a user's access."],
    ["/trust list",   "See all trusted users."],
  ];

  const fmt = (cmds) =>
    cmds.map(([cmd, desc]) => `\`${cmd}\` — ${desc}`).join("\n");

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Lacinator Commands")
    .setDescription(
      "Your chaotic little Truth or Dare bot. Use the buttons after any question to keep the game going!"
    )
    .addFields({ name: "🎮 Game Commands", value: fmt(gameCommands) });

  if (authorized) {
    embed.addFields({ name: "⚙️ Mod Commands", value: fmt(modCommands) });
  }

  if (owner) {
    embed.addFields({ name: "👑 Owner Commands", value: fmt(ownerCommands) });
  }

  if (!authorized) {
    embed.setFooter({ text: "Some commands are restricted to trusted users." });
  }

  return interaction.reply({ embeds: [embed], flags: 64 });
}
