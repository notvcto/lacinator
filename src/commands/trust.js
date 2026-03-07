import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { TrustedUser } from "../models/TrustedUser.js";
import { isOwner } from "../utils/helpers.js";

export const data = new SlashCommandBuilder()
  .setName("trust")
  .setDescription("Manage trusted users who can add/edit/remove questions [owners only]")
  .addSubcommand((sub) =>
    sub.setName("add")
      .setDescription("Add a trusted user")
      .addUserOption((opt) => opt.setName("user").setDescription("User to trust").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName("remove")
      .setDescription("Remove a trusted user")
      .addUserOption((opt) => opt.setName("user").setDescription("User to remove").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("List all trusted users")
  );

export async function execute(interaction) {
  if (!isOwner(interaction.user.id)) {
    return interaction.reply({ content: "❌ Only bot owners can manage trusted users.", flags: 64 });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "add") {
    const target = interaction.options.getUser("user");

    if (isOwner(target.id)) {
      return interaction.reply({ content: "ℹ️ That user is already an owner.", flags: 64 });
    }

    const existing = await TrustedUser.findOne({ userId: target.id });
    if (existing) {
      return interaction.reply({ content: `⚠️ **${target.username}** is already trusted.`, flags: 64 });
    }

    await TrustedUser.create({
      userId: target.id,
      username: target.username,
      addedBy: interaction.user.id,
      addedByUsername: interaction.user.username,
    });

    return interaction.reply({
      content: `✅ **${target.username}** is now trusted and can add/edit/remove questions.`,
      flags: 64,
    });
  }

  if (sub === "remove") {
    const target = interaction.options.getUser("user");

    if (isOwner(target.id)) {
      return interaction.reply({ content: "❌ Can't remove an owner via /trust — edit config.js.", flags: 64 });
    }

    const deleted = await TrustedUser.findOneAndDelete({ userId: target.id });
    if (!deleted) {
      return interaction.reply({ content: `❌ **${target.username}** isn't in the trusted list.`, flags: 64 });
    }

    return interaction.reply({
      content: `🗑️ Removed **${target.username}** from the trusted list.`,
      flags: 64,
    });
  }

  if (sub === "list") {
    const trusted = await TrustedUser.find().sort({ createdAt: 1 });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🔐 Lacinator Trusted Users")
      .setDescription(
        trusted.length
          ? trusted.map((u) => `• **${u.username}** — added by ${u.addedByUsername}`).join("\n")
          : "*No trusted users yet. Owners can always add/edit questions.*"
      )
      .setFooter({ text: `Owners are managed via config.js` });

    return interaction.reply({ embeds: [embed], flags: 64 });
  }
}
