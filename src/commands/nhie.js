import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, buildAndiTaxEmbed, rollAndiTax, resolveNsfw, emptyReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("nhie")
  .setDescription("Never Have I Ever 🙋")
  .addStringOption((opt) =>
    opt.setName("rating").setDescription("Filter by rating (R only works in age-restricted channels)").setRequired(false).addChoices(
      { name: "PG", value: "PG" }, { name: "PG-13", value: "PG-13" }, { name: "R", value: "R" }
    )
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const rating = interaction.options.getString("rating");
  const allowR = await resolveNsfw(interaction);

  const taxQuestion = await rollAndiTax(interaction.user.id, "nhie", allowR);
  if (taxQuestion) {
    return interaction.editReply({
      embeds: [buildAndiTaxEmbed(taxQuestion, interaction.user)],
      components: [buildQuestionComponents("nhie")],
    });
  }

  const question = await getRandomQuestion("nhie", allowR, rating);
  if (question?.__blocked) return interaction.editReply({ content: "🔞 R-rated questions are only available in age-restricted channels." });
  if (!question) return interaction.editReply(emptyReply("nhie"));

  return interaction.editReply({
    embeds: [buildQuestionEmbed(question, interaction.user)],
    components: [buildQuestionComponents("nhie")],
  });
}
