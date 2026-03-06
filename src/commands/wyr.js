import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, emptyReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("wyr")
  .setDescription("Would You Rather... 🤷");

export async function execute(interaction) {
  const question = await getRandomQuestion("wyr");

  if (!question) {
    return interaction.reply(emptyReply("wyr"));
  }

  const embed = buildQuestionEmbed(question, interaction.user);
  return interaction.reply({ embeds: [embed], components: [buildQuestionComponents("wyr")] });
}
