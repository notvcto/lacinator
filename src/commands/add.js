import { SlashCommandBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { Counter } from "../models/Counter.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Add a new question to Lacinator's pool [authorized users only]")
  .addStringOption((opt) =>
    opt.setName("type").setDescription("Category").setRequired(true).addChoices(
      { name: "Truth 🤔",            value: "truth" },
      { name: "Dare 😈",             value: "dare"  },
      { name: "Never Have I Ever 🙋", value: "nhie"  },
      { name: "Would You Rather 🤷", value: "wyr"   }
    )
  )
  .addStringOption((opt) =>
    opt.setName("question").setDescription("The question text (max 500 chars)").setRequired(true).setMaxLength(500)
  )
  .addStringOption((opt) =>
    opt.setName("rating").setDescription("Content rating (default: PG)").setRequired(false).addChoices(
      { name: "PG — Clean",         value: "PG"    },
      { name: "PG-13 — Mildly spicy", value: "PG-13" },
      { name: "R — No minors 👀",   value: "R"     }
    )
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const type   = interaction.options.getString("type");
  const text   = interaction.options.getString("question").trim();
  const rating = interaction.options.getString("rating") ?? "PG";

  if (!text) {
    return interaction.reply({ content: "❌ Question text can't be empty.", ephemeral: true });
  }

  const existing = await Question.findOne({
    text: { $regex: new RegExp(`^${escapeRegex(text)}$`, "i") },
    active: true,
  });

  if (existing) {
    return interaction.reply({
      content: `⚠️ That question already exists in the **${existing.type}** pool (ID: #${existing.questionId}).`,
      ephemeral: true,
    });
  }

  const questionId = await Counter.nextValue("questionId");

  const question = await Question.create({
    questionId,
    type,
    text,
    rating,
    addedBy: interaction.user.id,
    addedByUsername: interaction.user.username,
  });

  const poolCount = await Question.countDocuments({ type, active: true });

  return interaction.reply({
    content: `✅ Added **${type}** [${question.rating}] as ID **#${question.questionId}**!\n> ${question.text}\n\n📦 There are now **${poolCount}** questions in the ${type} pool.`,
    ephemeral: true,
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
