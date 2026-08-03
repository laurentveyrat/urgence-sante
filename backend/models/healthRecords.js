const mongoose = require("mongoose");

const healthRecordSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  label: String,
  practitioner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "practitioners",
  },
  occurredAt: Date,
  notes: String,
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "hospitals" },
});

const HealthRecord = mongoose.model("healthRecords", healthRecordSchema);

module.exports = HealthRecord;
