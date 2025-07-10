const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const userRoutes = require("./routes/user")
const cors = require('cors');
const PORT = process.env.PORT || 5000

dotenv.config()
const app = express()

//middleware
app.use(express.json())
app.use(cors());

app.use("/api/users", userRoutes)

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB")
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch((err) => {
        console.error("Failed to connect to Database", err)
    })




