const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cartRoutes = require("./routes/cart")
const cors = require('cors');

const PORT = process.env.PORT || 5002

dotenv.config()
const app = express()

app.use(express.json())
app.use(cors());

//route
app.use("/api/cart", cartRoutes)

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Shopping cart service is connecte to MongoDB")
        app.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT}`)
        })
    })
    .catch((err) => {
        console.log("Failed to connect to MongoDB -> Shopping Cart Service")
    })

