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
import { AndiQuestion } from "../models/AndiQuestion.js";
import { isAuthorized } from "./helpers.js";
import { config } from "../../config.js";

const PAGE_SIZE = config.listPageSize;

// CustomId prefix: al = "andi list"
// aln:{n|p}:{page}:{type|_}
// alsel:{page}:{type|_}
// alrm:{questionId}
// ale:{questionId}
// alem:{questionId}

const ANDI_COLOR = 0xff6b00;

export async function buildAndiListMessage(page, type) {
  const filter = { active: true };
  if (type) filter.type = type;

  const total      = await AndiQuestion.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage   = Math.min(Math.max(1, page), totalPages);

  const questions = await AndiQuestion.find(filter)
    .sort({ questionId: 1 })
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  const typeLabel = type ? config.labels[type] : "All Categories";

  const embed = new EmbedBuilder()
    .setColor(ANDI_COLOR)
    .setTitle(`🎯 Andi Special Pool — ${typeLabel}`)
    .setDescription(
      questions.length
        ? questions.map((q) => `\`#${q.questionId}\` **[${q.type}]** [${q.rating}] ${q.text}`).join("\n\n")
        : "*No Andi questions yet. Use `/andiadd` to load the cannon.*"
    )
    .setFooter({ text: `Page ${safePage}/${totalPages} · ${total} total Andi questions` });

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aln:p:${safePage}:${type ?? "_"}`)
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 1),
    new ButtonBuilder()
      .setCustomId(`aln:n:${safePage}:${type ?? "_"}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages)
  );

  const components = [navRow];

  if (questions.length) {
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`alsel:${safePage}:${type ?? "_"}`)
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

function buildAndiDetailMessage(question) {
  const embed = new EmbedBuilder()
    .setColor(ANDI_COLOR)
    .setTitle(`🎯 Andi Question #${question.questionId}`)
    .setDescription(`**${question.text}**`)
    .addFields(
      { name: "Type",     value: question.type,            inline: true },
      { name: "Rating",   value: question.rating,          inline: true },
      { name: "Added by", value: question.addedByUsername, inline: true }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ale:${question.questionId}`).setLabel("✏️ Edit").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`alrm:${question.questionId}`).setLabel("🗑️ Remove").setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row], flags: 64 };
}

function buildAndiEditModal(question) {
  return new ModalBuilder()
    .setCustomId(`alem:${question.questionId}`)
    .setTitle(`Edit Andi Question #${question.questionId}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("text").setLabel("Question text").setStyle(TextInputStyle.Paragraph).setValue(question.text).setMaxLength(500).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("type").setLabel("Type (truth / dare / nhie / wyr)").setStyle(TextInputStyle.Short).setValue(question.type).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("rating").setLabel("Rating (PG / PG-13 / R)").setStyle(TextInputStyle.Short).setValue(question.rating).setRequired(true)
      )
    );
}

export async function handleAndiListInteraction(interaction) {
  const id = interaction.customId;

  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply({ content: "❌ You're not on the list, bestie.", flags: 64 });
  }

  if (id.startsWith("aln:")) {
    const [, dir, pageStr, rawType] = id.split(":");
    const type = rawType === "_" ? null : rawType;
    const nextPage = dir === "n" ? parseInt(pageStr) + 1 : parseInt(pageStr) - 1;
    await interaction.deferUpdate();
    return interaction.editReply(await buildAndiListMessage(nextPage, type));
  }

  if (id.startsWith("alsel:")) {
    const questionId = parseInt(interaction.values[0]);
    const question   = await AndiQuestion.findOne({ questionId, active: true });
    if (!question) return interaction.reply({ content: "❌ That question no longer exists.", flags: 64 });
    return interaction.reply(buildAndiDetailMessage(question));
  }

  if (id.startsWith("alrm:")) {
    const questionId = parseInt(id.split(":")[1]);
    const question   = await AndiQuestion.findOne({ questionId, active: true });
    if (!question) return interaction.reply({ content: "❌ Question not found or already removed.", flags: 64 });
    question.active = false;
    await question.save();
    return interaction.update({ content: `🗑️ Removed Andi question **#${questionId}**: ${question.text}`, embeds: [], components: [] });
  }

  if (id.startsWith("ale:")) {
    const questionId = parseInt(id.split(":")[1]);
    const question   = await AndiQuestion.findOne({ questionId, active: true });
    if (!question) return interaction.reply({ content: "❌ Question not found.", flags: 64 });
    return interaction.showModal(buildAndiEditModal(question));
  }

  if (id.startsWith("alem:")) {
    const questionId = parseInt(id.split(":")[1]);
    const question   = await AndiQuestion.findOne({ questionId, active: true });
    if (!question) return interaction.reply({ content: "❌ Question not found.", flags: 64 });

    const newText   = interaction.fields.getTextInputValue("text").trim();
    const newType   = interaction.fields.getTextInputValue("type").trim().toLowerCase();
    const newRating = interaction.fields.getTextInputValue("rating").trim().toUpperCase();

    if (!["truth", "dare", "nhie", "wyr"].includes(newType)) return interaction.reply({ content: "❌ Invalid type.", flags: 64 });
    if (!["PG", "PG-13", "R"].includes(newRating)) return interaction.reply({ content: "❌ Invalid rating.", flags: 64 });

    question.text   = newText;
    question.type   = newType;
    question.rating = newRating;
    await question.save();

    return interaction.reply({ content: `✏️ Updated Andi question **#${question.questionId}** — ${question.text}`, flags: 64 });
  }
}
