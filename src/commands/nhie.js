import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, emptyReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("nhie")
  .setDescription("Never Have I Ever... 🙋");

export async function execute(interaction) {
  const question = await getRandomQuestion("nhie");

  if (!question) {
    return interaction.reply(emptyReply("nhie"));
  }

  const embed = buildQuestionEmbed(question, interaction.user);
  return interaction.reply({ embeds: [embed], components: [buildQuestionComponents("nhie")] });
}
