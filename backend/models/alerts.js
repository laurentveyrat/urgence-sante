const mongoose = require("mongoose");

const locationSchema = mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const alertSchema = mongoose.Schema({
  //  seul un utilisateur connecté peut créer une alerte(only connected user->alert)
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  location: locationSchema,
  status: {
    type: String,
    enum: ["pending", "accepted", "onSite", "resolved", "cancelled"],
    default: "pending",
  },
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
