import { getRandomQuestion, buildQuestionEmbed, buildQuestionComponents } from "../utils/helpers.js";

const BUTTON_TYPE_MAP = {
  btn_truth:  "truth",
  btn_dare:   "dare",
  btn_nhie:   "nhie",
  btn_wyr:    "wyr",
  btn_random: null,
};

export const name = "interactionCreate";

export async function execute(interaction, commands) {
  // ── Button handler ───────────────────────────────────────────────────────
  if (interaction.isButton()) {
    if (!(interaction.customId in BUTTON_TYPE_MAP)) return;

    await interaction.deferReply();

    const type = BUTTON_TYPE_MAP[interaction.customId];
    const question = await getRandomQuestion(type);

    if (!question) {
      return interaction.editReply({
        content: `😬 No questions found for that category. Use \`/add\` to stock up!`,
      });
    }

    const sourceType = type ?? "random";
    return interaction.editReply({
      embeds: [buildQuestionEmbed(question, interaction.user)],
      components: [buildQuestionComponents(sourceType)],
    });
  }

  // ── Slash command handler ────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[WARN] Unknown command: ${interaction.commandName}`);
    return interaction.reply({ content: "❓ Unknown command.", ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] /${interaction.commandName}:`, error);
    const msg = { content: "💥 Something broke on my end. Try again?", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
