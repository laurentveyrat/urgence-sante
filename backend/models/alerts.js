const mongoose = require("mongoose");

// GeoJSON Point. ATTENTION : coordinates = [longitude, latitude], dans cet ordre.
const pointSchema = mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const alertSchema = mongoose.Schema({
  // Requis : seul un utilisateur connecté peut créer une alerte.
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  location: pointSchema,
  status: {
    type: String,
    enum: ["pending", "accepted", "onSite", "resolved", "cancelled"],
    default: "pending",
  },
  // null tant qu'aucun secouriste n'a accepté.
  firstResponder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "firstResponders",
    default: null,
  },
  acceptedAt: Date,
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
});

alertSchema.index({ location: "2dsphere" });

const Alert = mongoose.model("alerts", alertSchema);

module.exports = Alert;
