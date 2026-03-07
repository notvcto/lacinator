import { SlashCommandBuilder } from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("edit")
  .setDescription("Edit an existing question [authorized users only]")
  .addIntegerOption((opt) =>
    opt.setName("id").setDescription("The question ID to edit").setRequired(true).setMinValue(1)
  )
  .addStringOption((opt) =>
    opt.setName("text").setDescription("New question text (leave blank to keep current)").setRequired(false).setMaxLength(500)
  )
  .addStringOption((opt) =>
    opt.setName("type").setDescription("New category (leave blank to keep current)").setRequired(false).addChoices(
      { name: "Truth 🤔",            value: "truth" },
      { name: "Dare 😈",             value: "dare"  },
      { name: "Never Have I Ever 🙋", value: "nhie"  },
      { name: "Would You Rather 🤷", value: "wyr"   }
    )
  )
  .addStringOption((opt) =>
    opt.setName("rating").setDescription("New rating (leave blank to keep current)").setRequired(false).addChoices(
      { name: "PG",    value: "PG"    },
      { name: "PG-13", value: "PG-13" },
      { name: "R",     value: "R"     }
    )
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const questionId = interaction.options.getInteger("id");
  const newText    = interaction.options.getString("text")?.trim();
  const newType    = interaction.options.getString("type");
  const newRating  = interaction.options.getString("rating");

  if (!newText && !newType && !newRating) {
    return interaction.reply({ content: "❌ Provide at least one field to edit.", flags: 64 });
  }

  const question = await Question.findOne({ questionId, active: true });

  if (!question) {
    return interaction.reply({ content: `❌ No active question found with ID **#${questionId}**.`, flags: 64 });
  }

  const before = { text: question.text, type: question.type, rating: question.rating };

  if (newText)   question.text   = newText;
  if (newType)   question.type   = newType;
  if (newRating) question.rating = newRating;

  await question.save();

  const changes = [];
  if (newText)   changes.push(`**text** → ${question.text}`);
  if (newType)   changes.push(`**type** ${before.type} → ${question.type}`);
  if (newRating) changes.push(`**rating** ${before.rating} → ${question.rating}`);

  return interaction.reply({
    content: `✏️ Updated **#${question.questionId}**:\n${changes.map((c) => `• ${c}`).join("\n")}`,
    flags: 64,
  });
}
