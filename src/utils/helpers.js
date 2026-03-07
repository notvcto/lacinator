import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Question } from "../models/Question.js";
import { AndiQuestion } from "../models/AndiQuestion.js";
import { TrustedUser } from "../models/TrustedUser.js";
import { config } from "../../config.js";

/**
 * Fetch a random question of a given type from the DB.
 * @param {string|null}  type    — null means any type (/random)
 * @param {boolean}      allowR  — whether R-rated questions are allowed
 * @param {string|null}  rating  — explicit rating filter (PG / PG-13 / R)
 */
export async function getRandomQuestion(type = null, allowR = false, rating = null) {
  const filter = { active: true };
  if (type) filter.type = type;

  if (rating) {
    // Explicit rating requested — still gate R behind allowR
    if (rating === "R" && !allowR) return { __blocked: true };
    filter.rating = rating;
  } else if (!allowR) {
    filter.rating = { $ne: "R" };
  }

  const [question] = await Question.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);

  return question ?? null;
}

/**
 * Resolve whether the interaction is in an age-restricted channel.
 * interaction.channel is often a partial — always fetch the full object.
 */
export async function resolveNsfw(interaction) {
  try {
    if (!interaction.channel) {
      console.log("[NSFW] No channel on interaction");
      return false;
    }
    const channel = interaction.channel.partial
      ? await interaction.channel.fetch()
      : interaction.channel;
    console.log(`[NSFW] channelId=${channel.id} nsfw=${channel.nsfw} partial=${interaction.channel.partial} type=${channel.type}`);
    return channel?.nsfw === true;
  } catch (err) {
    console.log(`[NSFW] fetch failed: ${err.message}`);
    return false;
  }
}

/**
 * Roll the Andi Tax. Returns an AndiQuestion if triggered, null otherwise.
 * Only fires when the requesting user is Andi AND the pool isn't empty.
 */
export async function rollAndiTax(userId, type = null, allowR = false) {
  if (userId !== config.andiUserId) return null;
  if (Math.random() > config.andiTaxRate) return null;

  const filter = { active: true };
  if (type) filter.type = type;
  if (!allowR) filter.rating = { $ne: "R" };

  const [question] = await AndiQuestion.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);

  return question ?? null;
}

/**
 * Build the special Andi Tax embed — same structure as normal but orange
 * and with a spicy author line.
 */
export function buildAndiTaxEmbed(question, requestedBy) {
  const typeLabel = question.type.toUpperCase();
  const id = `#${question.questionId}`;

  return new EmbedBuilder()
    .setColor(0xff6b00)
    .setAuthor({
      name: `🎯 Andi Tax — Specially Curated for ${requestedBy.username}`,
      iconURL: requestedBy.displayAvatarURL({ dynamic: true }) ?? requestedBy.defaultAvatarURL,
    })
    .setDescription(`**${question.text}**`)
    .setFooter({
      text: `Type: ${typeLabel} | Rating: ${question.rating} | ID: ${id} | Added by: ${question.addedByUsername}`,
    });
}

export function buildQuestionEmbed(question, requestedBy) {
  const color = config.colors[question.type];
  const typeLabel = question.type.toUpperCase();
  const id = question.questionId ? `#${question.questionId}` : question._id.toString().slice(-6);

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `Requested by ${requestedBy.username}`,
      iconURL: requestedBy.displayAvatarURL({ dynamic: true }) ?? requestedBy.defaultAvatarURL,
    })
    .setDescription(`**${question.text}**`)
    .setFooter({
      text: `Type: ${typeLabel} | Rating: ${question.rating} | ID: ${id} | Added by: ${question.addedByUsername}`,
    });
}

/**
 * Buttons under each question — context-aware per type.
 *
 * truth/dare → Truth | Dare | Random
 * nhie       → Another NHIE | Random
 * wyr        → Another WYR | Random
 * random     → Random Question
 */
export function buildQuestionComponents(sourceType) {
  const row = new ActionRowBuilder();

  switch (sourceType) {
    case "truth":
    case "dare":
      row.addComponents(
        new ButtonBuilder().setCustomId("btn_truth").setLabel("Truth").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("btn_dare").setLabel("Dare").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("btn_random").setLabel("Random").setStyle(ButtonStyle.Secondary)
      );
      break;

    case "nhie":
      row.addComponents(
        new ButtonBuilder().setCustomId("btn_nhie").setLabel("Another NHIE").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("btn_random").setLabel("Random").setStyle(ButtonStyle.Secondary)
      );
      break;

    case "wyr":
      row.addComponents(
        new ButtonBuilder().setCustomId("btn_wyr").setLabel("Another WYR").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("btn_random").setLabel("Random").setStyle(ButtonStyle.Secondary)
      );
      break;

    case "random":
    default:
      row.addComponents(
        new ButtonBuilder().setCustomId("btn_random").setLabel("Random Question").setStyle(ButtonStyle.Primary)
      );
      break;
  }

  return row;
}

/**
 * Check if a userId is authorized (owner in config OR trusted in DB).
 */
export async function isAuthorized(userId) {
  if (config.owners.includes(userId)) return true;
  const trusted = await TrustedUser.exists({ userId });
  return !!trusted;
}

/**
 * Check if a userId is an owner (can manage /trust).
 */
export function isOwner(userId) {
  return config.owners.includes(userId);
}

export function unauthorizedReply() {
  return { content: "❌ You're not on the list, bestie.", flags: 64 };
}

export function emptyReply(type) {
  const label = type ? config.labels[type] : "any category";
  return {
    content: `😬 No questions found for **${label}**. Use \`/add\` to add some!`,
    flags: 64,
  };
}
