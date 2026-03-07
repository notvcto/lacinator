import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents, resolveNsfw } from "../utils/helpers.js";
import { handleListInteraction } from "../utils/listInteractions.js";

const BUTTON_TYPE_MAP = {
  btn_truth:  "truth",
  btn_dare:   "dare",
  btn_nhie:   "nhie",
  btn_wyr:    "wyr",
  btn_random: null,
};

export const name = "interactionCreate";

export async function execute(interaction, commands) {

  // ── List interactions (nav buttons, select menu, edit modal, remove) ─────
  const id = interaction.customId ?? "";
  if (
    id.startsWith("lnav:") ||
    id.startsWith("lsel:") ||
    id.startsWith("lrm:")  ||
    id.startsWith("le:")   ||
    id.startsWith("lem:")
  ) {
    return handleListInteraction(interaction);
  }

  // ── Game buttons ─────────────────────────────────────────────────────────
  if (interaction.isButton() && id in BUTTON_TYPE_MAP) {
    await interaction.deferReply();

    const type     = BUTTON_TYPE_MAP[id];
    const allowR   = await resolveNsfw(interaction);
    const question = await getRandomQuestion(type, allowR);

    if (!question) {
      return interaction.editReply({
        content: "😬 No questions found for that category. Use `/add` to stock up!",
      });
    }

    return interaction.editReply({
      embeds: [buildQuestionEmbed(question, interaction.user)],
      components: [buildQuestionComponents(type ?? "random")],
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
    const msg = { content: "💥 Something broke on my end. Try again?", flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
