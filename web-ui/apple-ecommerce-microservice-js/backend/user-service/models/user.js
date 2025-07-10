const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    },
    phone: { 
        type: String, 
        required: true 
    },
    email: {
        type: String, 
        required: true, 
        unique: true
    },
    address: { 
        type: String, 
        required: true 
    },
    password: {
        type: String, 
        required: true
    },
    otp: { 
        type: String 
    },
    imageUrl: {
        type: String,
    }
}, { timestamps: true });

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = mongoose.model("User", userSchema)