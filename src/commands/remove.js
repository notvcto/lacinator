import { SlashCommandBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remove a question from Lacinator's pool by its ID [authorized users only]")
  .addStringOption((opt) =>
    opt
      .setName("id")
      .setDescription("The question ID (get it from /list)")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!isAuthorized(interaction.user.id)) {
    return interaction.reply(unauthorizedReply());
  }

  const id = interaction.options.getString("id").trim();

  let question;
  try {
    question = await Question.findOne({ _id: id, active: true });
  } catch {
    return interaction.reply({ content: "❌ Invalid question ID format.", ephemeral: true });
  }

  if (!question) {
    return interaction.reply({ content: "❌ Question not found (or already removed).", ephemeral: true });
  }

  question.active = false;
  await question.save();

  return interaction.reply({
    content: `🗑️ Removed **${question.type}** question:\n> ${question.text}`,
    ephemeral: true,
  });
}
