# Lacinator 🎲

> The chaotic Truth or Dare bot for the homies. Custom questions, authorized editors, powered by spite.

## Stack
- **discord.js v14** — slash commands, embeds
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

| Variable | Where to get it |
|---|---|
| `DISCORD_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Token |
| `CLIENT_ID` | Developer Portal → Your App → General Information → Application ID |
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers (connection string) |

### 3. Add authorized users
Open `config.js` and drop your Discord user IDs into `authorizedUsers`.

**How to get a user ID:**
> Discord → User Settings → Advanced → Enable Developer Mode  
> Then right-click any user → "Copy User ID"

### 4. Register slash commands
```bash
npm run deploy
```
> Global registration can take up to 1 hour. For instant testing, uncomment the guild-specific route in `deploy-commands.js`.

### 5. Run the bot
```bash
# Production
npm start

# Dev (auto-restarts on file change, Node 18+)
npm run dev
```

---

## Commands

| Command | Who | Description |
|---|---|---|
| `/truth` | Everyone | Random truth question |
| `/dare` | Everyone | Random dare |
| `/nhie` | Everyone | Never Have I Ever |
| `/wyr` | Everyone | Would You Rather |
| `/random` | Everyone | Random from any category |
| `/add` | Authorized | Add a question to the pool |
| `/remove` | Authorized | Remove a question by ID |
| `/list` | Authorized | Browse the question pool |

---

## Adding questions

Only users listed in `config.authorizedUsers` can use `/add` and `/remove`.

```
/add type:Dare question:Send a voice message saying something embarrassing
```

To remove, grab the ID from `/list` and use:
```
/remove id:64f3a1b2c3d4e5f6a7b8c9d0
```

---

## MongoDB Atlas (free tier is fine)
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist `0.0.0.0/0` under Network Access (or your host IP)
4. Get the connection string and paste it as `MONGODB_URI`

The database and collection are created automatically on first run.
