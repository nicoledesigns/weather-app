const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const weatherRoutes = require("./routes/weatherRoutes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173" 
}));

app.use(express.json()); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/api/weather", weatherRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});