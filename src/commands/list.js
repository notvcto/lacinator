import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";
import { config } from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Browse the question pool [authorized users only]")
  .addStringOption((opt) =>
    opt.setName("type").setDescription("Filter by category").setRequired(false).addChoices(
      { name: "Truth 🤔",            value: "truth" },
      { name: "Dare 😈",             value: "dare"  },
      { name: "Never Have I Ever 🙋", value: "nhie"  },
      { name: "Would You Rather 🤷", value: "wyr"   }
    )
  )
  .addIntegerOption((opt) =>
    opt.setName("page").setDescription("Page number (default: 1)").setRequired(false).setMinValue(1)
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const type     = interaction.options.getString("type");
  const page     = interaction.options.getInteger("page") ?? 1;
  const pageSize = config.listPageSize;

  const filter = { active: true };
  if (type) filter.type = type;

  const total     = await Question.countDocuments(filter);
  const questions = await Question.find(filter)
    .sort({ questionId: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  if (!questions.length) {
    return interaction.reply({ content: "😬 No questions found with those filters.", ephemeral: true });
  }

  const totalPages = Math.ceil(total / pageSize);
  const typeLabel  = type ? config.labels[type] : "All Categories";
  const color      = type ? config.colors[type] : config.colors.random;

  const lines = questions.map(
    (q) => `\`#${q.questionId}\` **[${q.type}]** [${q.rating}] ${q.text}`
  );

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`📋 Lacinator Question Pool — ${typeLabel}`)
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: `Page ${page}/${totalPages} · ${total} total questions` });

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
