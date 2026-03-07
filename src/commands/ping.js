import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import mongoose from "mongoose";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check if Lacinator and its services are alive 🏓");

export async function execute(interaction) {
  const start = Date.now();
  await interaction.deferReply();
  const apiLatency = Date.now() - start;
  const wsLatency  = interaction.client.ws.ping;

  const dbState = mongoose.connection.readyState;
  const dbLabel = ["disconnected", "connected", "connecting", "disconnecting"][dbState] ?? "unknown";
  const dbOk    = dbState === 1;

  const embed = new EmbedBuilder()
    .setColor(wsLatency < 150 ? 0x57f287 : wsLatency < 300 ? 0xfee75c : 0xed4245)
    .setTitle("🏓 Pong!")
    .addFields(
      { name: "WebSocket Latency", value: `${wsLatency}ms`,  inline: true },
      { name: "API Round-trip",    value: `${apiLatency}ms`, inline: true },
      { name: "Database",          value: dbOk ? `✅ ${dbLabel}` : `❌ ${dbLabel}`, inline: true }
    )
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}
