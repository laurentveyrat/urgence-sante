const mongoose = require("mongoose");

// GeoJSON Point. ATTENTION : coordinates = [longitude, latitude], dans cet ordre.
const pointSchema = mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const certificationSchema = mongoose.Schema({
  code: String,
  certNumber: String,
  organisation: String,
  obtainedAt: Date,
  expiresAt: Date,
});

const firstResponderSchema = mongoose.Schema({
//un compte = au plus un profil secouriste.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    unique: true,
    required: true,
  },
  certifications: [certificationSchema],
  isAvailable: { type: Boolean, default: false },
  isPubliclyListed: { type: Boolean, default: false },
  location: pointSchema,
});

firstResponderSchema.index({ location: "2dsphere" });

const FirstResponder = mongoose.model("firstResponders", firstResponderSchema);

module.exports = FirstResponder;

