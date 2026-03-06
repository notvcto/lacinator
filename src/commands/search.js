import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";
import { config } from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("search")
  .setDescription("Search questions by keyword [authorized users only]")
  .addStringOption((opt) =>
    opt.setName("keyword").setDescription("Word or phrase to search for").setRequired(true).setMaxLength(100)
  )
  .addStringOption((opt) =>
    opt.setName("type").setDescription("Filter by category").setRequired(false).addChoices(
      { name: "Truth 🤔",            value: "truth" },
      { name: "Dare 😈",             value: "dare"  },
      { name: "Never Have I Ever 🙋", value: "nhie"  },
      { name: "Would You Rather 🤷", value: "wyr"   }
    )
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const keyword = interaction.options.getString("keyword").trim();
  const type    = interaction.options.getString("type");

  const filter = {
    active: true,
    text: { $regex: new RegExp(escapeRegex(keyword), "i") },
  };
  if (type) filter.type = type;

  const results = await Question.find(filter).sort({ questionId: 1 }).limit(15);

  if (!results.length) {
    return interaction.reply({
      content: `🔍 No questions found matching **"${keyword}"**.`,
      ephemeral: true,
    });
  }

  const lines = results.map(
    (q) => `\`#${q.questionId}\` **[${q.type}]** [${q.rating}] ${q.text}`
  );

  const embed = new EmbedBuilder()
    .setColor(config.colors.random)
    .setTitle(`🔍 Search results for "${keyword}"`)
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: `${results.length} result${results.length !== 1 ? "s" : ""} (max 15 shown)` });

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
