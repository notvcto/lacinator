import { SlashCommandBuilder } from "discord.js";
import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, resolveNsfw, emptyReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("random")
  .setDescription("Get a random question from any category 🎲")
  .addStringOption((opt) =>
    opt.setName("rating").setDescription("Filter by rating (R only works in age-restricted channels)").setRequired(false).addChoices(
      { name: "PG", value: "PG" }, { name: "PG-13", value: "PG-13" }, { name: "R", value: "R" }
    )
  );

export async function execute(interaction) {
  const rating   = interaction.options.getString("rating");
  const allowR   = await resolveNsfw(interaction);
  const question = await getRandomQuestion(null, allowR, rating);

  if (question?.__blocked) {
    return interaction.reply({ content: "🔞 R-rated questions are only available in age-restricted channels.", flags: 64 });
  }
  if (!question) return interaction.reply(emptyReply(null));

  return interaction.reply({
    embeds: [buildQuestionEmbed(question, interaction.user)],
    components: [buildQuestionComponents("random")],
  });
}
