import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, emptyReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("dare")
  .setDescription("Get a random Dare from Lacinator 😈");

export async function execute(interaction) {
  const question = await getRandomQuestion("dare");

  if (!question) {
    return interaction.reply(emptyReply("dare"));
  }

  const embed = buildQuestionEmbed(question, interaction.user);
  return interaction.reply({ embeds: [embed], components: [buildQuestionComponents("dare")] });
}
