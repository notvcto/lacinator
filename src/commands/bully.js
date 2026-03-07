import { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { config } from "../../config.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── The Arsenal ──────────────────────────────────────────────────────────────
// Drop your image files into /assets/ and register them here.
// bully/target coords are the CENTER of where the avatar circle will land.
// r = radius of the avatar circle in pixels.
const BULLY_TEMPLATES = [
  {
    filename: "dropkick.jpg",
    bully:  { x: 250, y: 150, r: 60 },
    target: { x: 600, y: 300, r: 60 },
    message: "{bully} dropkicked {target} back to the lobby.",
  },
  {
    filename: "slap.jpg",
    bully:  { x: 380, y: 210, r: 80 },
    target: { x: 180, y: 250, r: 80 },
    message: "{bully} knocked some sense into {target}.",
  },
  {
    filename: "sparta.jpg",
    bully:  { x: 300, y: 180, r: 70 },
    target: { x: 650, y: 400, r: 50 },
    message: "THIS. IS. LACINATOR! 🥾",
  },
];

export async function renderBully(bully, target) {
  const template     = BULLY_TEMPLATES[Math.floor(Math.random() * BULLY_TEMPLATES.length)];
  const templatePath = path.join(__dirname, "../../assets", template.filename);

  let bullyImg, targetImg, bgImg;
  try {
    [bullyImg, targetImg, bgImg] = await Promise.all([
      loadImage(bully.displayAvatarURL({ extension: "png", size: 256 })),
      loadImage(target.displayAvatarURL({ extension: "png", size: 256 })),
      loadImage(templatePath),
    ]);
  } catch (err) {
    console.error("[BULLY] Failed to load images:", err);
    return null;
  }

  const W      = bgImg.width;
  const H      = bgImg.height;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  ctx.drawImage(bgImg, 0, 0, W, H);

  function drawAvatar(img, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  function drawRing(x, y, r, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  function drawLabel(text, x, y, color = "#ffffff") {
    ctx.save();
    ctx.font          = "bold 16px sans-serif";
    ctx.textAlign     = "center";
    ctx.shadowColor   = "#000000";
    ctx.shadowBlur    = 6;
    ctx.fillStyle     = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawRing(template.bully.x,  template.bully.y,  template.bully.r,  "#5865f2");
  drawAvatar(bullyImg,  template.bully.x,  template.bully.y,  template.bully.r);
  drawLabel(bully.username,  template.bully.x,  template.bully.y  + template.bully.r  + 18);

  drawRing(template.target.x, template.target.y, template.target.r, "#ed4245");
  drawAvatar(targetImg, template.target.x, template.target.y, template.target.r);
  drawLabel(target.username, template.target.x, template.target.y + template.target.r + 18, "#ed4245");

  const flavorText = template.message
    .replace("{bully}", bully.username)
    .replace("{target}", target.username);

  ctx.save();
  ctx.fillStyle    = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, H - 40, W, 40);
  ctx.font         = "bold 18px sans-serif";
  ctx.fillStyle    = "#ffffff";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "#000000";
  ctx.shadowBlur   = 4;
  ctx.fillText(flavorText, W / 2, H - 20);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

export const data = new SlashCommandBuilder()
  .setName("bully")
  .setDescription("Deploy the boot 🥾")
  .addUserOption((opt) =>
    opt.setName("target").setDescription("Who's getting bullied? (defaults to Andi)").setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const bully  = interaction.user;
  const target = interaction.options.getUser("target")
    ?? await interaction.client.users.fetch(config.andiUserId).catch(() => null);

  if (!target) {
    return interaction.editReply({ content: "❌ Couldn't find the target user." });
  }

  const buffer = await renderBully(bully, target);
  if (!buffer) {
    return interaction.editReply({ content: "❌ Couldn't load one of the images. Is the asset file in `/assets/`?" });
  }

  const attachment = new AttachmentBuilder(buffer, { name: "bully.png" });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fightback:${bully.id}`)
      .setLabel("Fight back! 🥊")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.editReply({ files: [attachment], components: [row] });
}
