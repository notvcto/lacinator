import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Question } from "../models/Question.js";
import { isAuthorized } from "./helpers.js";
import { config } from "../../config.js";

const PAGE_SIZE = config.listPageSize;

// ── CustomId scheme ───────────────────────────────────────────────────────────
// lnav:{n|p}:{page}:{type|_}   — page navigation
// lsel:{page}:{type|_}         — select menu (value = questionId)
// lrm:{questionId}             — remove question
// le:{questionId}              — open edit modal
// Modal id: lem:{questionId}

export function encodeNav(dir, page, type) {
  return `lnav:${dir}:${page}:${type ?? "_"}`;
}
export function encodeSelectMenu(page, type) {
  return `lsel:${page}:${type ?? "_"}`;
}

// ── Build the list embed + components ────────────────────────────────────────
export async function buildListMessage(page, type) {
  const filter = { active: true };
  if (type) filter.type = type;

  const total      = await Question.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage   = Math.min(Math.max(1, page), totalPages);

  const questions = await Question.find(filter)
    .sort({ questionId: 1 })
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  const typeLabel = type ? config.labels[type] : "All Categories";
  const color     = type ? config.colors[type] : config.colors.random;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`📋 Lacinator Question Pool — ${typeLabel}`)
    .setDescription(
      questions.length
        ? questions.map((q) => `\`#${q.questionId}\` **[${q.type}]** [${q.rating}] ${q.text}`).join("\n\n")
        : "*No questions found.*"
    )
    .setFooter({ text: `Page ${safePage}/${totalPages} · ${total} total questions` });

  // ── Pagination row ───────────────────────────────────────────────────────
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(encodeNav("p", safePage, type))
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 1),
    new ButtonBuilder()
      .setCustomId(encodeNav("n", safePage, type))
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages)
  );

  // ── Select menu ──────────────────────────────────────────────────────────
  const components = [navRow];

  if (questions.length) {
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(encodeSelectMenu(safePage, type))
        .setPlaceholder("Select a question to edit or remove…")
        .addOptions(
          questions.map((q) => ({
            label: `#${q.questionId} [${q.type}] ${q.text.slice(0, 80)}${q.text.length > 80 ? "…" : ""}`,
            value: String(q.questionId),
          }))
        )
    );
    components.push(selectRow);
  }

  return { embeds: [embed], components };
}

// ── Question detail message (shown after selecting from the menu) ─────────────
export function buildDetailMessage(question) {
  const embed = new EmbedBuilder()
    .setColor(config.colors[question.type])
    .setTitle(`Question #${question.questionId}`)
    .setDescription(`**${question.text}**`)
    .addFields(
      { name: "Type",     value: question.type,             inline: true },
      { name: "Rating",   value: question.rating,           inline: true },
      { name: "Added by", value: question.addedByUsername,  inline: true }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`le:${question.questionId}`)
      .setLabel("✏️ Edit")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`lrm:${question.questionId}`)
      .setLabel("🗑️ Remove")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row], flags: 64 };
}

// ── Edit modal ────────────────────────────────────────────────────────────────
export function buildEditModal(question) {
  return new ModalBuilder()
    .setCustomId(`lem:${question.questionId}`)
    .setTitle(`Edit Question #${question.questionId}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("text")
          .setLabel("Question text")
          .setStyle(TextInputStyle.Paragraph)
          .setValue(question.text)
          .setMaxLength(500)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("type")
          .setLabel("Type (truth / dare / nhie / wyr)")
          .setStyle(TextInputStyle.Short)
          .setValue(question.type)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("rating")
          .setLabel("Rating (PG / PG-13 / R)")
          .setStyle(TextInputStyle.Short)
          .setValue(question.rating)
          .setRequired(true)
      )
    );
}

// ── Main interaction router ───────────────────────────────────────────────────
export async function handleListInteraction(interaction) {
  const id = interaction.customId;

  // Auth check for all list interactions
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply({ content: "❌ You're not on the list, bestie.", flags: 64 });
  }

  // ── Page navigation button ─────────────────────────────────────────────
  if (id.startsWith("lnav:")) {
    const [, dir, pageStr, rawType] = id.split(":");
    const currentPage = parseInt(pageStr);
    const type        = rawType === "_" ? null : rawType;
    const nextPage    = dir === "n" ? currentPage + 1 : currentPage - 1;

    await interaction.deferUpdate();
    const msg = await buildListMessage(nextPage, type);
    return interaction.editReply(msg);
  }

  // ── Select menu — show detail view ─────────────────────────────────────
  if (id.startsWith("lsel:")) {
    const questionId = parseInt(interaction.values[0]);
    const question   = await Question.findOne({ questionId, active: true });

    if (!question) {
      return interaction.reply({ content: "❌ That question no longer exists.", flags: 64 });
    }

    return interaction.reply(buildDetailMessage(question));
  }

  // ── Remove button ───────────────────────────────────────────────────────
  if (id.startsWith("lrm:")) {
    const questionId = parseInt(id.split(":")[1]);
    const question   = await Question.findOne({ questionId, active: true });

    if (!question) {
      return interaction.reply({ content: "❌ Question not found or already removed.", flags: 64 });
    }

    question.active = false;
    await question.save();

    return interaction.update({
      content: `🗑️ Removed **#${questionId}**: ${question.text}`,
      embeds: [],
      components: [],
    });
  }

  // ── Edit button — open modal ────────────────────────────────────────────
  if (id.startsWith("le:")) {
    const questionId = parseInt(id.split(":")[1]);
    const question   = await Question.findOne({ questionId, active: true });

    if (!question) {
      return interaction.reply({ content: "❌ Question not found.", flags: 64 });
    }

    return interaction.showModal(buildEditModal(question));
  }

  // ── Modal submit ────────────────────────────────────────────────────────
  if (id.startsWith("lem:")) {
    const questionId = parseInt(id.split(":")[1]);
    const question   = await Question.findOne({ questionId, active: true });

    if (!question) {
      return interaction.reply({ content: "❌ Question not found.", flags: 64 });
    }

    const newText   = interaction.fields.getTextInputValue("text").trim();
    const newType   = interaction.fields.getTextInputValue("type").trim().toLowerCase();
    const newRating = interaction.fields.getTextInputValue("rating").trim().toUpperCase();

    const validTypes   = ["truth", "dare", "nhie", "wyr"];
    const validRatings = ["PG", "PG-13", "R"];

    if (!validTypes.includes(newType)) {
      return interaction.reply({ content: `❌ Invalid type. Use one of: ${validTypes.join(", ")}`, flags: 64 });
    }
    if (!validRatings.includes(newRating)) {
      return interaction.reply({ content: `❌ Invalid rating. Use one of: ${validRatings.join(", ")}`, flags: 64 });
    }

    question.text   = newText;
    question.type   = newType;
    question.rating = newRating;
    await question.save();

    return interaction.reply({
      content: `✏️ Updated **#${question.questionId}** — ${question.text}`,
      flags: 64,
    });
  }
}
