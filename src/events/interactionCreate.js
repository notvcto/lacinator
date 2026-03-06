import {
  getRandomQuestion,
  buildQuestionEmbed,
  buildQuestionComponents,
} from "../utils/helpers.js";

const BUTTON_TYPE_MAP = {
  btn_truth: "truth",
  btn_dare: "dare",
  btn_random: null, // null = any type
};

export const name = "interactionCreate";

export async function execute(interaction, commands) {
  // ── Button handler ──────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const type = BUTTON_TYPE_MAP[interaction.customId];

    if (!(interaction.customId in BUTTON_TYPE_MAP)) return;

    await interaction.deferReply();

    const question = await getRandomQuestion(type);

    if (!question) {
      return interaction.editReply({
        content: `😬 No questions found for that category. Use \`/add\` to stock up!`,
      });
    }

    // Outside a guild, displayAvatarURL may need a fallback
    const user = interaction.user;
    const embed = buildQuestionEmbed(question, user);
    const sourceType = type ?? "random";
    return interaction.editReply({
      embeds: [embed],
      components: [buildQuestionComponents(sourceType)],
    });
  }

  // ── Slash command handler ───────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[WARN] Unknown command received: ${interaction.commandName}`);
    return interaction.reply({
      content: "❓ Unknown command.",
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] Command /${interaction.commandName} threw:`, error);
    const msg = {
      content: "💥 Something broke on my end. Try again?",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
