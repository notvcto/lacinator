import {
  getRandomQuestion,
  buildQuestionEmbed,
  buildQuestionComponents,
  resolveNsfw,
  rollAndiTax,
  buildAndiTaxEmbed,
} from "../utils/helpers.js";
import { handleListInteraction } from "../utils/listInteractions.js";
import { handleAndiListInteraction } from "../utils/andiListInteractions.js";
import { renderBully } from "../commands/bully.js";
import {
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { config } from "../../config.js";

// btn_random pulls from truth/nhie/wyr only — dares are too action-oriented for a random button
const RANDOM_TYPES = ["truth", "nhie", "wyr"];

const BUTTON_TYPE_MAP = {
  btn_truth: "truth",
  btn_dare: "dare",
  btn_nhie: "nhie",
  btn_wyr: "wyr",
  btn_random: null, // resolved below
};

export const name = "interactionCreate";

export async function execute(interaction, commands) {
  const id = interaction.customId ?? "";

  // ── Andi list interactions ───────────────────────────────────────────────
  if (
    id.startsWith("aln:") ||
    id.startsWith("alsel:") ||
    id.startsWith("alrm:") ||
    id.startsWith("ale:") ||
    id.startsWith("alem:")
  ) {
    return handleAndiListInteraction(interaction);
  }

  // ── List interactions (nav buttons, select menu, edit modal, remove) ─────
  if (
    id.startsWith("lnav:") ||
    id.startsWith("lsel:") ||
    id.startsWith("lrm:") ||
    id.startsWith("le:") ||
    id.startsWith("lem:")
  ) {
    return handleListInteraction(interaction);
  }

  // ── Fight back button ────────────────────────────────────────────────────
  if (id.startsWith("fightback:")) {
    // Andi cannot fight back
    if (interaction.user.id === config.andiUserId) {
      return interaction.reply({
        content: "Old people can't fight back — sorry not sorry 😂",
      });
    }

    await interaction.deferReply();

    // The original bully's ID is encoded in the customId
    const originalBullyId = id.split(":")[1];
    let originalBully;
    try {
      originalBully = await interaction.client.users.fetch(originalBullyId);
    } catch {
      return interaction.editReply({
        content: "❌ Couldn't find the original bully.",
      });
    }

    // Roles are now reversed — button clicker fights back against the original bully
    const buffer = await renderBully(interaction.user, originalBully);
    if (!buffer) {
      return interaction.editReply({ content: "❌ Couldn't load images." });
    }

    const attachment = new AttachmentBuilder(buffer, { name: "fightback.png" });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fightback:${interaction.user.id}`)
        .setLabel("Fight back! 🥊")
        .setStyle(ButtonStyle.Danger),
    );

    return interaction.editReply({ files: [attachment], components: [row] });
  }

  // ── Game buttons ─────────────────────────────────────────────────────────
  if (interaction.isButton() && id in BUTTON_TYPE_MAP) {
    await interaction.deferReply();

    // For btn_random, pick randomly from non-dare types
    const type =
      id === "btn_random"
        ? RANDOM_TYPES[Math.floor(Math.random() * RANDOM_TYPES.length)]
        : BUTTON_TYPE_MAP[id];
    const allowR = await resolveNsfw(interaction);

    // Andi tax check
    const taxQuestion = await rollAndiTax(interaction.user.id, type, allowR);
    if (taxQuestion) {
      return interaction.editReply({
        embeds: [buildAndiTaxEmbed(taxQuestion, interaction.user)],
        components: [buildQuestionComponents(type)],
      });
    }

    const question = await getRandomQuestion(type, allowR);
    if (!question) {
      return interaction.editReply({
        content:
          "😬 No questions found for that category. Use `/add` to stock up!",
      });
    }

    return interaction.editReply({
      embeds: [buildQuestionEmbed(question, interaction.user)],
      components: [buildQuestionComponents(type)],
    });
  }

  // ── Slash commands ────────────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[WARN] Unknown command: ${interaction.commandName}`);
    return interaction.reply({ content: "❓ Unknown command.", flags: 64 });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] /${interaction.commandName}:`, error);
    const msg = {
      content: "💥 Something broke on my end. Try again?",
      flags: 64,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
