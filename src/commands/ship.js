import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${url}`);
  const buf = await res.arrayBuffer();
  return loadImage(Buffer.from(buf));
}

export const data = new SlashCommandBuilder()
  .setName("ship")
  .setDescription("Find out how compatible two people are 💘")
  .addUserOption((opt) => opt.setName("user1").setDescription("First person").setRequired(true))
  .addUserOption((opt) => opt.setName("user2").setDescription("Second person").setRequired(true));

function hashPair(id1, id2) {
  const [a, b] = [id1, id2].sort();
  let hash = 0;
  for (const char of `${a}${b}`) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) % 101;
}

function shipName(n1, n2) {
  const a = n1.slice(0, Math.ceil(n1.length / 2));
  const b = n2.slice(Math.floor(n2.length / 2));
  return (a + b).toLowerCase();
}

function compatMessage(pct) {
  if (pct >= 90) return "Soulmates. Absolutely disgusting.";
  if (pct >= 75) return "Strong connection. Get a room.";
  if (pct >= 60) return "There's definitely something there.";
  if (pct >= 45) return "Could work with some effort.";
  if (pct >= 30) return "It's giving situationship.";
  if (pct >= 15) return "Yikes. Maybe just be friends.";
  return "Certified disaster. Run.";
}

// Draw a heart shape centered at (cx, cy) with given size
function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  const s = size / 30; // scale factor
  ctx.moveTo(cx, cy + 8 * s);
  ctx.bezierCurveTo(cx, cy + 4 * s,  cx - 6 * s, cy - 8 * s, cx - 15 * s, cy - 8 * s);
  ctx.bezierCurveTo(cx - 24 * s, cy - 8 * s, cx - 24 * s, cy + 5 * s, cx - 24 * s, cy + 5 * s);
  ctx.bezierCurveTo(cx - 24 * s, cy + 14 * s, cx - 14 * s, cy + 22 * s, cx, cy + 32 * s);
  ctx.bezierCurveTo(cx + 14 * s, cy + 22 * s, cx + 24 * s, cy + 14 * s, cx + 24 * s, cy + 5 * s);
  ctx.bezierCurveTo(cx + 24 * s, cy + 5 * s, cx + 24 * s, cy - 8 * s, cx + 15 * s, cy - 8 * s);
  ctx.bezierCurveTo(cx + 6 * s, cy - 8 * s, cx, cy + 4 * s, cx, cy + 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function lerpColor(hex1, hex2, t) {
  const parse = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = parse(hex1);
  const [r2,g2,b2] = parse(hex2);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

export async function execute(interaction) {
  const user1 = interaction.options.getUser("user1");
  const user2 = interaction.options.getUser("user2");

  if (user1.id === user2.id) {
    return interaction.reply({ content: "Loving yourself is valid but that's not how this works. 💅", flags: 64 });
  }

  await interaction.deferReply();

  const pct   = hashPair(user1.id, user2.id);
  const name  = shipName(user1.username, user2.username);
  const label = compatMessage(pct);

  const [avatar1, avatar2] = await Promise.all([
    fetchImage(user1.displayAvatarURL({ extension: "png", size: 256 })),
    fetchImage(user2.displayAvatarURL({ extension: "png", size: 256 })),
  ]);

  // ── Layout constants ──────────────────────────────────────────────────────
  const W = 700, H = 310;
  const AV_R = 80;
  const AV_Y = 105;       // avatar center Y
  const NAME_Y = AV_Y + AV_R + 22;  // username label Y = 207
  const BAR_X = 150, BAR_Y = 240, BAR_W = 400, BAR_H = 18, BAR_RADIUS = 9;
  const COMPAT_Y = 276;
  const FOOTER_Y = 300;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#1e1e2e";
  ctx.fillRect(0, 0, W, H);

  const vignette = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.9);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── Avatar helper ─────────────────────────────────────────────────────────
  function drawAvatar(img, cx, cy, r, ringColor) {
    ctx.save();
    ctx.shadowColor = ringColor;
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth   = 4;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  // ── Avatars ───────────────────────────────────────────────────────────────
  drawAvatar(avatar1, 110, AV_Y, AV_R, "#5865f2");
  drawAvatar(avatar2, 590, AV_Y, AV_R, "#eb459e");

  // ── Heart centered between avatars ────────────────────────────────────────
  drawHeart(ctx, W / 2, AV_Y - 38, 28, "#ff6b9d");

  // ── Ship name ─────────────────────────────────────────────────────────────
  ctx.font          = "bold 15px sans-serif";
  ctx.fillStyle     = "#ffffff88";
  ctx.textAlign     = "center";
  ctx.textBaseline  = "middle";
  ctx.fillText(`[ ${name} ]`, W / 2, AV_Y + 10);

  // ── Usernames directly below avatars ─────────────────────────────────────
  ctx.font      = "bold 18px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(user1.username, 110, NAME_Y);
  ctx.fillText(user2.username, 590, NAME_Y);

  // ── Progress bar ──────────────────────────────────────────────────────────
  const filled = Math.round((pct / 100) * BAR_W);

  // Track
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(BAR_X, BAR_Y, BAR_W, BAR_H, BAR_RADIUS);
  ctx.fillStyle = "#ffffff22";
  ctx.fill();

  // Fill
  if (filled > 0) {
    const grad = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
    grad.addColorStop(0, "#ed4245");
    grad.addColorStop(1, "#ff6b9d");
    ctx.beginPath();
    ctx.roundRect(BAR_X, BAR_Y, filled, BAR_H, BAR_RADIUS);
    ctx.fillStyle = grad;
    ctx.shadowColor = "#ff6b9d";
    ctx.shadowBlur  = 8;
    ctx.fill();
  }
  ctx.restore();

  // Percentage centered on bar
  ctx.font          = "bold 13px sans-serif";
  ctx.fillStyle     = "#ffffff";
  ctx.textAlign     = "center";
  ctx.textBaseline  = "middle";
  ctx.fillText(`${pct}%`, W / 2, BAR_Y + BAR_H / 2);

  // ── Compat message ────────────────────────────────────────────────────────
  ctx.font          = "15px sans-serif";
  ctx.fillStyle     = "#ffffffcc";
  ctx.textBaseline  = "middle";
  ctx.fillText(label, W / 2, COMPAT_Y);

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.font      = "11px sans-serif";
  ctx.fillStyle = "#ffffff44";
  ctx.fillText("Results are scientifically accurate and legally binding.", W / 2, FOOTER_Y);

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "ship.png" });
  return interaction.editReply({ files: [attachment] });
}
