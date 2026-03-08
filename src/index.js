import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import mongoose from "mongoose";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { startStatusServer, registerClient } from "./server.js";
import { TrustedUser } from "./models/TrustedUser.js";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── MongoDB ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("[DB] Connected to MongoDB");
    // Ensure all owners are present in the TrustedUser collection
    for (const userId of config.owners) {
      await TrustedUser.updateOne(
        { userId },
        {
          $setOnInsert: {
            userId,
            username: "owner",
            addedBy: "system",
            addedByUsername: "system",
          },
        },
        { upsert: true },
      );
    }
  })
  .catch((err) => {
    console.error("[DB] Connection failed:", err);
    process.exit(1);
  });

// ── Discord client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ── Load commands ────────────────────────────────────────────────────────────
client.commands = new Collection();

const commandFiles = readdirSync(path.join(__dirname, "commands")).filter((f) =>
  f.endsWith(".js"),
);

for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(__dirname, "commands", file)).href;
  const command = await import(filePath);

  if (!command.data || !command.execute) {
    console.warn(`[WARN] ${file} is missing data/execute export — skipping`);
    continue;
  }

  client.commands.set(command.data.name, command);
  console.log(`[CMD] Loaded /${command.data.name}`);
}

// ── Load events ──────────────────────────────────────────────────────────────
const eventFiles = readdirSync(path.join(__dirname, "events")).filter((f) =>
  f.endsWith(".js"),
);

for (const file of eventFiles) {
  const filePath = pathToFileURL(path.join(__dirname, "events", file)).href;
  const event = await import(filePath);

  const handler = (...args) => event.execute(...args, client.commands);

  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }

  console.log(`[EVT] Registered event: ${event.name}`);
}

// ── Status server ────────────────────────────────────────────────────────────
startStatusServer();

// ── Launch ───────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);

client.once("ready", () => registerClient(client));

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[LACINATOR] Shutting down gracefully...");
  await mongoose.disconnect();
  client.destroy();
  process.exit(0);
});
