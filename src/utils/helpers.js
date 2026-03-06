import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Question } from "../models/Question.js";
import { config } from "../../config.js";

/**
 * Fetch a random question of a given type from the DB.
 * @param {string|null} type  — null means any type (used by /random)
 * @returns {Promise<import("../models/Question.js").Question|null>}
 */
export async function getRandomQuestion(type = null) {
  const filter = { active: true };
  if (type) filter.type = type;

  // MongoDB aggregation $sample is the cleanest true-random pull
  const [question] = await Question.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);

  return question ?? null;
}

/**
 * Build a Discord embed matching the ToD bot style:
 * - Author row: user avatar + "Requested by <username>"
 * - Description: bold question text
 * - Footer: Type | Rating | ID | Added by
 */
export function buildQuestionEmbed(question, requestedBy) {
  const color = config.colors[question.type];
  const typeLabel = question.type.toUpperCase();
  const shortId = question._id.toString().slice(-10); // last 10 chars, matches ToD style

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `Requested by ${requestedBy.username}`,
      iconURL: requestedBy.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(`**${question.text}**`)
    .setFooter({
      text: `Type: ${typeLabel} | Rating: ${question.rating} | ID: ${shortId} | Added by: ${question.addedByUsername}`,
    });
}

/**
 * Build the button row that appears under every question.
 * Shows Truth / Dare / Random for typed commands,
 * or just Random for /random.
 * @param {"truth"|"dare"|"nhie"|"wyr"|"random"} sourceType
 */
export function buildQuestionComponents(sourceType) {
  const row = new ActionRowBuilder();

  if (sourceType !== "random") {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("btn_truth")
        .setLabel("Truth")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("btn_dare")
        .setLabel("Dare")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("btn_random")
        .setLabel("Random")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("btn_random")
        .setLabel("Random Question")
        .setStyle(ButtonStyle.Primary)
    );
  }

  return row;
}

export function isAuthorized(userId) {
  return config.authorizedUsers.includes(userId);
}

/**
 * Standard "not authorized" reply.
 */
export function unauthorizedReply() {
  return {
    content: "❌ You're not on the list, bestie.",
    ephemeral: true,
  };
}

/**
 * Standard "no questions found" reply.
 */
export function emptyReply(type) {
  const label = type ? config.labels[type] : "any category";
  return {
    content: `😬 No questions found for **${label}**. Use \`/add\` to add some!`,
    ephemeral: true,
  };
}
