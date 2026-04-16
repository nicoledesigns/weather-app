const mongoose = require("mongoose");

const WeatherSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  temperature: Number,
  condition: String,

  startDate: Date,
  endDate: Date,

  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Weather", WeatherSchema);