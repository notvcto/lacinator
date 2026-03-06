import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, emptyReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("truth")
  .setDescription("Get a random Truth question from Lacinator 🤔");

export async function execute(interaction) {
  const question = await getRandomQuestion("truth");

  if (!question) {
    return interaction.reply(emptyReply("truth"));
  }

  const embed = buildQuestionEmbed(question, interaction.user);
  return interaction.reply({ embeds: [embed], components: [buildQuestionComponents("truth")] });
}
