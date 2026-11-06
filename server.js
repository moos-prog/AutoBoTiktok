const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("Configure ADMIN_PASSWORD avec au moins 12 caractères.");
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });

const initial = {
  accounts: [],
  comments: [],
  videos: [],
  history: [],
  settings: { enabled: false, discoveryEnabled: false, timezone: "Europe/Paris" }
};
function load() {
  try { return { ...initial, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) }; }
  catch { return structuredClone(initial); }
}
let db = load();
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function log(type, message) {
  db.history.unshift({ id: crypto.randomUUID(), type, message, at: new Date().toISOString() });
  db.history = db.history.slice(0, 500);
  save();
}
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Set();
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !sessions.has(token)) return res.status(401).json({ error: "Session expirée. Reconnecte-toi." });
  next();
}
app.post("/api/login", (req, res) => {
  if (!req.body || req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Mot de passe incorrect." });
  const token = crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({ token });
});
app.get("/api/health", (req, res) => res.json({ ok: true, version: "1.0.0" }));
app.get("/api/data", auth, (req, res) => res.json(db));

app.post("/api/accounts", auth, (req, res) => {
  const label = String(req.body.label || "").trim().slice(0, 50);
  if (!label) return res.status(400).json({ error: "Donne un nom à ce compte." });
  const item = { id: crypto.randomUUID(), label, handle: String(req.body.handle || "").trim().slice(0, 60), style: String(req.body.style || "").trim().slice(0, 120), createdAt: new Date().toISOString() };
  db.accounts.push(item); log("Compte", `Compte « ${label} » ajouté.`); res.json(item);
});
app.delete("/api/accounts/:id", auth, (req, res) => {
  const old = db.accounts.find(x => x.id === req.params.id);
  db.accounts = db.accounts.filter(x => x.id !== req.params.id);
  if (!old) return res.status(404).json({ error: "Compte introuvable." });
  log("Compte", `Compte « ${old.label} » supprimé.`); res.json({ ok: true });
});
app.post("/api/comments", auth, (req, res) => {
  const body = String(req.body.text || "").trim().slice(0, 500);
  if (!body) return res.status(400).json({ error: "Le commentaire est vide." });
  const item = { id: crypto.randomUUID(), text: body, createdAt: new Date().toISOString(), active: true };
  db.comments.push(item); log("Commentaire", "Un commentaire prédéfini a été ajouté au stock partagé."); res.json(item);
});
app.patch("/api/comments/:id", auth, (req, res) => {
  const item = db.comments.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Commentaire introuvable." });
  if (typeof req.body.active === "boolean") item.active = req.body.active;
  if (typeof req.body.text === "string" && req.body.text.trim()) item.text = req.body.text.trim().slice(0, 500);
  log("Commentaire", "Stock de commentaires modifié."); res.json(item);
});
app.delete("/api/comments/:id", auth, (req, res) => {
  const item = db.comments.find(x => x.id === req.params.id);
  db.comments = db.comments.filter(x => x.id !== req.params.id);
  if (!item) return res.status(404).json({ error: "Commentaire introuvable." });
  log("Commentaire", "Un commentaire a été supprimé du stock partagé."); res.json({ ok: true });
});
app.post("/api/videos", auth, (req, res) => {
  const url = String(req.body.url || "").trim().slice(0, 500);
  const note = String(req.body.note || "").trim().slice(0, 180);
  if (!/^https:\/\/(www\.)?tiktok\.com\//i.test(url)) return res.status(400).json({ error: "Ajoute une URL TikTok valide." });
  const item = { id: crypto.randomUUID(), url, note, status: "À examiner", createdAt: new Date().toISOString() };
  db.videos.unshift(item); log("Vidéo", "Une vidéo a été ajoutée à la liste de suivi."); res.json(item);
});
app.patch("/api/videos/:id", auth, (req, res) => {
  const item = db.videos.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Vidéo introuvable." });
  const allowed = ["À examiner", "Validée", "Ignorée"];
  if (allowed.includes(req.body.status)) item.status = req.body.status;
  log("Vidéo", `Statut d’une vidéo : ${item.status}.`); res.json(item);
});
app.delete("/api/videos/:id", auth, (req, res) => {
  db.videos = db.videos.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});
app.post("/api/stop", auth, (req, res) => {
  db.settings.enabled = false;
  db.settings.discoveryEnabled = false;
  log("Sécurité", "Arrêt général demandé. Toutes les fonctions automatiques sont désactivées.");
  res.json({ ok: true, settings: db.settings });
});
app.patch("/api/settings", auth, (req, res) => {
  if (typeof req.body.enabled === "boolean") db.settings.enabled = req.body.enabled;
  if (typeof req.body.discoveryEnabled === "boolean") db.settings.discoveryEnabled = req.body.discoveryEnabled;
  // The dashboard stores preferences only; it does not execute TikTok actions.
  log("Paramètres", "Paramètres mis à jour."); res.json(db.settings);
});
app.listen(PORT, () => console.log(`AutoBot dashboard listening on ${PORT}`));
