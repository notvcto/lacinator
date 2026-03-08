import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, buildAndiTaxEmbed, rollAndiTax, resolveNsfw, expireButtons, emptyReply } from "../utils/helpers.js";
import { config } from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("random")
  .setDescription("Get a random question from any category 🎲")
  .addStringOption((opt) =>
    opt.setName("rating").setDescription("Filter by rating (R only works in age-restricted channels)").setRequired(false).addChoices(
      { name: "PG", value: "PG" }, { name: "PG-13", value: "PG-13" }, { name: "R", value: "R" }
    )
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const rating = interaction.options.getString("rating");
  const allowR = await resolveNsfw(interaction);

  const taxQuestion = await rollAndiTax(interaction.user.id, null, allowR);
  if (taxQuestion) {
    await interaction.editReply({ embeds: [buildAndiTaxEmbed(taxQuestion, interaction.user)], components: [buildQuestionComponents("random")] });
    return expireButtons(interaction, config.buttonExpiryMs);
  }

  const question = await getRandomQuestion(null, allowR, rating);
  if (question?.__blocked) return interaction.editReply({ content: "🔞 R-rated questions are only available in age-restricted channels." });
  if (!question) return interaction.editReply(emptyReply(null));

  await interaction.editReply({ embeds: [buildQuestionEmbed(question, interaction.user)], components: [buildQuestionComponents("random")] });
  expireButtons(interaction, config.buttonExpiryMs);
}
