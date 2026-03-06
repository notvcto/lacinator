import { SlashCommandBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Add a new question to Lacinator's pool [authorized users only]")
  .addStringOption((opt) =>
    opt
      .setName("type")
      .setDescription("Category for this question")
      .setRequired(true)
      .addChoices(
        { name: "Truth 🤔", value: "truth" },
        { name: "Dare 😈", value: "dare" },
        { name: "Never Have I Ever 🙋", value: "nhie" },
        { name: "Would You Rather 🤷", value: "wyr" }
      )
  )
  .addStringOption((opt) =>
    opt
      .setName("question")
      .setDescription("The question or prompt text (max 500 chars)")
      .setRequired(true)
      .setMaxLength(500)
  )
  .addStringOption((opt) =>
    opt
      .setName("rating")
      .setDescription("Content rating (default: PG)")
      .setRequired(false)
      .addChoices(
        { name: "PG — Clean, anyone can answer", value: "PG" },
        { name: "PG-13 — Mildly spicy", value: "PG-13" },
        { name: "R — No minors 👀", value: "R" }
      )
  );

export async function execute(interaction) {
  if (!isAuthorized(interaction.user.id)) {
    return interaction.reply(unauthorizedReply());
  }

  const type = interaction.options.getString("type");
  const text = interaction.options.getString("question").trim();
  const rating = interaction.options.getString("rating") ?? "PG";

  if (!text) {
    return interaction.reply({ content: "❌ Question text can't be empty.", ephemeral: true });
  }

  // Duplicate check — same text (case-insensitive), globally
  const existing = await Question.findOne({
    text: { $regex: new RegExp(`^${escapeRegex(text)}$`, "i") },
    active: true,
  });

  if (existing) {
    return interaction.reply({
      content: `⚠️ That question already exists in the **${existing.type}** pool.`,
      ephemeral: true,
    });
  }

  const question = await Question.create({
    type,
    text,
    rating,
    addedBy: interaction.user.id,
    addedByUsername: interaction.user.username,
  });

  return interaction.reply({
    content: `✅ Added to **${type}** pool! [${question.rating}]\n> ${question.text}`,
    ephemeral: true,
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
