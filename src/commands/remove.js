import { SlashCommandBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remove a question by its ID [authorized users only]")
  .addIntegerOption((opt) =>
    opt.setName("id").setDescription("The question ID (e.g. 42 from /list)").setRequired(true).setMinValue(1)
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const questionId = interaction.options.getInteger("id");
  const question = await Question.findOne({ questionId, active: true });

  if (!question) {
    return interaction.reply({ content: `❌ No active question found with ID **#${questionId}**.`, ephemeral: true });
  }

  question.active = false;
  await question.save();

  return interaction.reply({
    content: `🗑️ Removed **${question.type}** question **#${question.questionId}**:\n> ${question.text}`,
    ephemeral: true,
  });
}
