import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { config } from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("See Lacinator's question pool stats 📊");

export async function execute(interaction) {
  const [byType, byRating, total] = await Promise.all([
    Question.aggregate([
      { $match: { active: true } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    Question.aggregate([
      { $match: { active: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
    Question.countDocuments({ active: true }),
  ]);

  const typeMap   = Object.fromEntries(byType.map((r) => [r._id, r.count]));
  const ratingMap = Object.fromEntries(byRating.map((r) => [r._id, r.count]));

  const typeLines = Object.entries(config.labels)
    .map(([key, label]) => `${label}: **${typeMap[key] ?? 0}**`)
    .join("\n");

  const ratingLines = ["PG", "PG-13", "R"]
    .map((r) => `${r}: **${ratingMap[r] ?? 0}**`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(config.colors.random)
    .setTitle("📊 Lacinator Stats")
    .addFields(
      { name: "By Category", value: typeLines,   inline: true },
      { name: "By Rating",   value: ratingLines, inline: true }
    )
    .setFooter({ text: `${total} total active questions` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
