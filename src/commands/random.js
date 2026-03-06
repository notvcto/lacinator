import { SlashCommandBuilder } from "discord.js";
import {
  getRandomQuestion,
  buildQuestionEmbed,
  buildQuestionComponents,
  isNsfwChannel,
  emptyReply,
} from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("random")
  .setDescription("Get a completely random question from any category 🎲");

export async function execute(interaction) {
  const question = await getRandomQuestion(
    null,
    isNsfwChannel(interaction.channel),
  );

  if (!question) {
    return interaction.reply(emptyReply(null));
  }

  const embed = buildQuestionEmbed(question, interaction.user);
  return interaction.reply({
    embeds: [embed],
    components: [buildQuestionComponents("random")],
  });
}
