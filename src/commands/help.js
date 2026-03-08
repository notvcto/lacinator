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
    ["/truth",  "Get a random Truth question. Buttons let you keep going without retyping."],
    ["/dare",   "Get a random Dare."],
    ["/nhie",   "Get a Never Have I Ever prompt."],
    ["/wyr",    "Get a Would You Rather question."],
    ["/random", "Get a random question from any category (no dares)."],
    ["/ship",   "Find out how compatible two people are 💘"],
    ["/bully",  "Deploy the boot on someone 🥾 (defaults to Andi)"],
    ["/stats",  "See the question pool breakdown by type and rating."],
    ["/ping",   "Check bot, API, and database status."],
    ["/help",   "This menu."],
  ];

  // ── Mod commands (authorized users) ───────────────────────────────────
  const modCommands = [
    ["/add",      "Add a question to the main pool."],
    ["/edit",     "Edit a question by ID."],
    ["/remove",   "Remove a question by ID."],
    ["/list",     "Browse the main pool — paginated with inline edit/remove."],
    ["/search",   "Search questions by keyword."],
    ["/andiadd",  "Add a question to the Andi special pool 🎯"],
    ["/andilist", "Browse & manage the Andi pool 🎯"],
  ];

  // ── Owner commands ─────────────────────────────────────────────────────
  const ownerCommands = [
    ["/trust add",    "Grant a user mod-level access."],
    ["/trust remove", "Revoke a user's access."],
    ["/trust list",   "See all currently trusted users."],
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
