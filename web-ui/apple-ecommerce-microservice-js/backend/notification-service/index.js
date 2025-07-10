const express = require("express")
const dotenv = require("dotenv")
const notificationRoutes = require("./routes/notification")
const cors = require('cors');

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors());

app.use("/api/notification", notificationRoutes)

const PORT = process.env.PORT || 5005

app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`)
})

