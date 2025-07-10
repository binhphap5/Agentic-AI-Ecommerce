const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const orderRoutes = require("./routes/order")
const cors = require('cors');

const PORT = process.env.PORT || 5003

dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/orders", orderRoutes)


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Order Service is Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.log("🚫 Failed to connect to MongoDB -> Order Service")
  })