import { SlashCommandBuilder } from "discord.js";
import { isAuthorized, unauthorizedReply } from "../utils/helpers.js";
import { buildListMessage } from "../utils/listInteractions.js";

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Browse the question pool [authorized users only]")
  .addStringOption((opt) =>
    opt.setName("type").setDescription("Filter by category").setRequired(false).addChoices(
      { name: "Truth 🤔",            value: "truth" },
      { name: "Dare 😈",             value: "dare"  },
      { name: "Never Have I Ever 🙋", value: "nhie"  },
      { name: "Would You Rather 🤷", value: "wyr"   }
    )
  )
  .addIntegerOption((opt) =>
    opt.setName("page").setDescription("Page number (default: 1)").setRequired(false).setMinValue(1)
  );

export async function execute(interaction) {
  if (!(await isAuthorized(interaction.user.id))) {
    return interaction.reply(unauthorizedReply());
  }

  const type = interaction.options.getString("type");
  const page = interaction.options.getInteger("page") ?? 1;

  const msg = await buildListMessage(page, type);
  return interaction.reply({ ...msg, ephemeral: true });
}
