import http from "http";
import mongoose from "mongoose";
import { Question } from "./models/Question.js";

let botClient = null;
const startedAt = new Date();

/**
 * Call this from index.js once the Discord client is ready,
 * passing the client in so we can read its status.
 */
export function registerClient(client) {
  botClient = client;
}

function uptimeString(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`]
    .filter(Boolean)
    .join(" ");
}

function dbStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] ?? "unknown";
}

export function startStatusServer(port = process.env.STATUS_PORT ?? 3000) {
  const server = http.createServer(async (req, res) => {
    if (req.url !== "/" && req.url !== "/status") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }

    const db = dbStatus();
    const discordReady = botClient?.isReady() ?? false;
    const uptime = uptimeString(Date.now() - startedAt.getTime());

    let questionCounts = {};
    try {
      const counts = await Question.aggregate([
        { $match: { active: true } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);
      questionCounts = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    } catch {
      questionCounts = { error: "could not fetch" };
    }

    const totalQuestions = Object.values(questionCounts)
      .filter(Number.isInteger)
      .reduce((a, b) => a + b, 0);

    const healthy = discordReady && db === "connected";

    const payload = {
      status: healthy ? "ok" : "degraded",
      uptime,
      startedAt: startedAt.toISOString(),
      discord: {
        ready: discordReady,
        tag: botClient?.user?.tag ?? null,
        ping: botClient?.ws?.ping ?? null,
      },
      database: {
        status: db,
      },
      questions: {
        total: totalQuestions,
        byType: questionCounts,
      },
    };

    res.writeHead(healthy ? 200 : 503, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify(payload, null, 2));
  });

  server.listen(port, () => {
    console.log(`[STATUS] Server running on port ${port}`);
  });

  return server;
}
