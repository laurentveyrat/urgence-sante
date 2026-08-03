const mongoose = require("mongoose");

const locationSchema = mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const certificationSchema = mongoose.Schema({
  certName: String,
  organisation: String,
});

const firstResponderSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    unique: true,
    required: true,
  },
  certifications: [certificationSchema],
  isAvailable: { type: Boolean, default: false },
  isPubliclyListed: { type: Boolean, default: false },
  location: locationSchema,
});

firstResponderSchema.index({ location: "2dsphere" });

const FirstResponder = mongoose.model("firstResponders", firstResponderSchema);

module.exports = FirstResponder;