import { SlashCommandBuilder } from "discord.js";
import { AndiQuestion } from "../models/AndiQuestion.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("andiadd")
  .setDescription("Add a question to the Andi special pool 🎯 [authorized users only]")
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
      { name: "PG",    value: "PG"    },
      { name: "PG-13", value: "PG-13" },
      { name: "R",     value: "R"     }
    )
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const type   = interaction.options.getString("type");
  const text   = interaction.options.getString("question").trim();
  const rating = interaction.options.getString("rating") ?? "PG";

  const existing = await AndiQuestion.findOne({
    text: { $regex: new RegExp(`^${escapeRegex(text)}$`, "i") },
    active: true,
  });

  if (existing) {
    return interaction.reply({
      content: `⚠️ That question already exists in the Andi pool (ID: #${existing.questionId}).`,
      flags: 64,
    });
  }

  const questionId = await AndiQuestion.nextId();
  const question   = await AndiQuestion.create({
    questionId,
    type,
    text,
    rating,
    addedBy: interaction.user.id,
    addedByUsername: interaction.user.username,
  });

  const poolCount = await AndiQuestion.countDocuments({ type, active: true });

  return interaction.reply({
    content: `🎯 Added to **Andi pool** [${question.type}] [${question.rating}] as ID **#${question.questionId}**!\n> ${question.text}\n\n📦 Andi pool now has **${poolCount}** ${type} questions.`,
    flags: 64,
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
