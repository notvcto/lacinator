/**
 * Run this once (or whenever you add/change commands) to register
 * slash commands with Discord:
 *
 *   node src/utils/deploy-commands.js
 *
 * Uses REST API to push commands globally (can take up to 1hr to propagate)
 * or to a specific guild (instant, great for testing).
 */

import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [];

const commandFiles = readdirSync(path.join(__dirname, "../commands")).filter((f) =>
  f.endsWith(".js")
);

for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(__dirname, "../commands", file)).href;
  const command = await import(filePath);
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`[DEPLOY] Queued /${command.data.name}`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log(`\n[DEPLOY] Registering ${commands.length} slash command(s)...`);

  // ── To deploy GLOBALLY (all servers, up to 1hr to show up):
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: commands,
  });

  // ── To deploy to ONE GUILD (instant, use for testing):
  // Replace GUILD_ID with your server's ID
  // await rest.put(
  //   Routes.applicationGuildCommands(process.env.CLIENT_ID, "GUILD_ID"),
  //   { body: commands }
  // );

  console.log("[DEPLOY] ✅ All commands registered successfully!");
} catch (err) {
  console.error("[DEPLOY] ❌ Failed to register commands:", err);
}
