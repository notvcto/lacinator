# Lacinator 🎲

> The chaotic Truth or Dare bot for the homies. Custom questions, authorized editors, powered by spite.

## Stack

- **discord.js v14** — slash commands, embeds, buttons
- **MongoDB + Mongoose** — question storage
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

Open `config.js` and drop your Discord user IDs into `owners`. Owners have permanent full access and can promote other users via `/trust`.

**How to get a user ID:**

> Discord → User Settings → Advanced → Enable Developer Mode
> Then right-click any user → "Copy User ID"

### 4. Enable User Install in the Developer Portal

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → Lacinator
2. **Installation** tab → under **Installation Contexts**, enable **User Install**
3. Save changes

This allows anyone to add Lacinator to their profile and use it anywhere — even in servers it isn't in.

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

| Command   | Description                                           |
| --------- | ----------------------------------------------------- |
| `/truth`  | Random truth question                                 |
| `/dare`   | Random dare                                           |
| `/nhie`   | Never Have I Ever                                     |
| `/wyr`    | Would You Rather                                      |
| `/random` | Random question from any category                     |
| `/stats`  | Question pool breakdown by type and rating            |
| `/ping`   | Check bot, API, and database status                   |
| `/help`   | List all commands (context-aware by permission level) |

### ⚙️ Mod Commands (owners + trusted users)

| Command   | Description                          |
| --------- | ------------------------------------ |
| `/add`    | Add a question to the pool           |
| `/edit`   | Edit an existing question by ID      |
| `/remove` | Remove a question by ID              |
| `/list`   | Browse the question pool (paginated) |
| `/search` | Search questions by keyword          |

### 👑 Owner Commands (config.js `owners` only)

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `/trust add @user`    | Grant a user mod-level access   |
| `/trust remove @user` | Revoke a user's access          |
| `/trust list`         | See all currently trusted users |

---

## Question IDs

Every question gets a short, clean numeric ID (e.g. `#42`) when added. Use these IDs with `/edit`, `/remove`, and as references from `/list` and `/search`. No more pasting MongoDB ObjectIDs.

---

## Managing questions

### Adding

```
/add type:Dare question:Send a voice message saying something embarrassing rating:PG
```

Rating defaults to `PG` if omitted. Options are `PG`, `PG-13`, and `R`.
After adding, Lacinator confirms the new ID and the updated pool count.

### Editing

```
/edit id:42 text:Updated question text here
/edit id:42 type:Truth rating:PG-13
```

Any combination of `text`, `type`, and `rating` can be updated — omit fields you don't want to change.

### Removing

```
/remove id:42
```

### Browsing & searching

```
/list
/list type:Dare page:2
/search keyword:embarrassing
```

---

## Auth system

There are two levels of access:

- **Owners** — defined in `config.js`. Always authorized, can use `/trust` to manage others. Requires a redeploy to change.
- **Trusted users** — managed at runtime via `/trust add/remove`. Can add, edit, remove, and browse questions. No redeploy needed.

Questions are **global** — shared across all servers and DMs. There's no per-server separation.

---

## Buttons

Every question response includes buttons so the game never has to stop:

| Command             | Buttons               |
| ------------------- | --------------------- |
| `/truth` or `/dare` | Truth · Dare · Random |
| `/nhie`             | Another NHIE · Random |
| `/wyr`              | Another WYR · Random  |
| `/random`           | Random Question       |

---

## Status server

Lacinator runs a lightweight HTTP status server alongside the bot. Hit `http://your-host:3000/status` (or the `STATUS_PORT` you configured) for a JSON health report covering Discord connection, WebSocket ping, database state, and question counts.

Pairs nicely with [UptimeRobot](https://uptimerobot.com) — set up an HTTP monitor pointing at `/status`. The endpoint returns `503` when degraded, so UptimeRobot will alert correctly.

---

## MongoDB Atlas (free tier is fine)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist `0.0.0.0/0` under Network Access (or your host IP)
4. Get the connection string and paste it as `MONGODB_URI`

Collections and indexes are created automatically on first run. The baseline Atlas M0 cluster uses ~100MB regardless of actual data — that's normal and not your questions taking up space.
