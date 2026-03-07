# Lacinator 🎲

> The chaotic Truth or Dare bot for the homies. Custom questions, authorized editors, powered by spite.

## Stack

- **discord.js v14** — slash commands, embeds, buttons, modals
- **MongoDB + Mongoose** — question storage
- **@napi-rs/canvas** — image composition for `/bully` and `/ship`
- **Node.js 18+** (ESM)

---

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

| Variable        | Where to get it                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `DISCORD_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Token |
| `CLIENT_ID`     | Developer Portal → Your App → General Information → Application ID                               |
| `MONGODB_URI`   | MongoDB Atlas → Connect → Drivers (connection string)                                            |
| `STATUS_PORT`   | Port for the status server (default: `3000`)                                                     |

### 3. Add owners

Open `config.js` and fill in:

- `owners` — your Discord user IDs (permanent full access, managed via file)
- `andiUserId` — Andi's Discord user ID (the Andi Tax victim)
- `andiTaxRate` — probability (0–1) that Andi gets a special question (default: `0.20`)

**How to get a user ID:**

> Discord → User Settings → Advanced → Enable Developer Mode
> Then right-click any user → "Copy User ID"

### 4. Enable User Install in the Developer Portal

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → Lacinator
2. **Installation** tab → under **Installation Contexts**, enable **User Install**
3. Save changes

### 5. Register slash commands

```bash
npm run deploy
```

> Global registration can take up to 1 hour. For instant testing, uncomment the guild-specific route in `deploy-commands.js`.

### 6. Run the bot

```bash
# Production
npm start

# Dev (auto-restarts on file change, Node 18+)
npm run dev
```

---

## Commands

### 🎮 Game Commands (everyone)

| Command               | Description                                    |
| --------------------- | ---------------------------------------------- |
| `/truth`              | Random truth question                          |
| `/dare`               | Random dare                                    |
| `/nhie`               | Never Have I Ever                              |
| `/wyr`                | Would You Rather                               |
| `/random`             | Random question from truth/nhie/wyr (no dares) |
| `/ship @user1 @user2` | Compatibility score with canvas image          |
| `/bully [@target]`    | Deploy the boot — defaults to Andi             |
| `/stats`              | Question pool breakdown by type and rating     |
| `/ping`               | Check bot, API, and database status            |
| `/help`               | Context-aware command list                     |

All game commands accept an optional `rating` filter (`PG`, `PG-13`, `R`). R-rated questions are gated behind age-restricted channels.

### ⚙️ Mod Commands (owners + trusted users)

| Command     | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| `/add`      | Add a question to the main pool                                          |
| `/edit`     | Edit a question by ID                                                    |
| `/remove`   | Remove a question by ID                                                  |
| `/list`     | Browse the main pool — paginated with inline edit/remove via select menu |
| `/search`   | Search questions by keyword                                              |
| `/andiadd`  | Add a question to the Andi special pool 🎯                               |
| `/andilist` | Browse & manage the Andi pool 🎯                                         |

### 👑 Owner Commands (config.js `owners` only)

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `/trust add @user`    | Grant a user mod-level access   |
| `/trust remove @user` | Revoke a user's access          |
| `/trust list`         | See all currently trusted users |

---

## Buttons

Every question response includes buttons so the game never has to stop:

| Command             | Buttons               |
| ------------------- | --------------------- |
| `/truth` or `/dare` | Truth · Dare · Random |
| `/nhie`             | Another NHIE · Random |
| `/wyr`              | Another WYR · Random  |
| `/random`           | Random Question       |

The **Random** button pulls from truth/nhie/wyr only — dares are excluded. All button clicks are subject to the Andi Tax.

Every `/bully` response includes a **Fight back! 🥊** button. Andi cannot use it.

---

## The Andi Tax 🎯

When Andi (configured via `andiUserId`) uses any game command or button, there's a `andiTaxRate` chance (default 20%) that her question is pulled from the Andi special pool instead of the main pool. The response comes back in orange with a "Andi Tax — Specially Curated for You" header.

Manage the Andi pool with `/andiadd` and `/andilist`.

---

## Question IDs

Every question gets a short numeric ID (e.g. `#42`) on creation. Main pool and Andi pool have separate ID counters. Use IDs with `/edit`, `/remove`, and as references from `/list`, `/andilist`, and `/search`.

---

## Auth system

Two levels of access:

- **Owners** — defined in `config.js`. Always authorized, can manage `/trust`. Requires a redeploy to change.
- **Trusted users** — managed at runtime via `/trust add/remove`. Can add, edit, remove, and browse questions. No redeploy needed.

Questions are **global** — shared across all servers and DMs.

---

## Bully templates

Templates live in `BULLY_TEMPLATES` inside `src/commands/bully.js`. Each template points to an image in your GitHub repo via raw URL and defines avatar placement:

```js
{
  url: `${GITHUB_RAW}/yourimage.jpg`,
  bully:  { x: 300, y: 200, r: 60 },  // center x, center y, radius
  target: { x: 500, y: 250, r: 60 },
  message: "{bully} did something terrible to {target}.",
}
```

Push the image to `/assets/` on GitHub and add the entry — no redeploy needed, just a restart.

---

## R-rated content

R-rated questions are only served in channels with Discord's **Age-Restricted Channel** toggle enabled (channel settings → Overview → Age-Restricted Channel). This applies to both slash commands and button clicks.

---

## Status server

Lacinator runs a lightweight HTTP server alongside the bot. Hit `/status` on your host for a JSON health report:

```json
{
  "status": "ok",
  "uptime": "2h 14m 3s",
  "discord": { "ready": true, "tag": "Lacinator#3314", "ping": 42 },
  "database": { "status": "connected" },
  "questions": {
    "total": 47,
    "byType": { "truth": 12, "dare": 15, "nhie": 10, "wyr": 10 }
  },
  "andiPool": {
    "total": 8,
    "byType": { "truth": 3, "dare": 2, "nhie": 2, "wyr": 1 }
  }
}
```

Returns `503` when degraded — pairs well with [UptimeRobot](https://uptimerobot.com).

---

## MongoDB Atlas (free tier is fine)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist `0.0.0.0/0` under Network Access (or your host IP)
4. Get the connection string and paste it as `MONGODB_URI`

Collections and indexes are created automatically on first run. The baseline M0 cluster uses ~100MB regardless of actual data — that's normal.
