const express = require("express")
const User = require("../models/user")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const router = express.Router()
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


//register new user
router.post("/register", async(req, res) => {
    try{
        const {name, phone, email, address, password} = req.body

        let user = await User.findOne({email})
        if(user){
            return res.status(400).json({ message: "Email đã tồn tại."})
        }

        const hashedPassword = await bcrypt.hash(password, 10); 
        user = new User({ name, phone, email, address, password: hashedPassword });

        await user.save()

        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET,{
            expiresIn: "1h",
        })

        res.status(201).json({ message: "Đăng ký thành công!", token });

    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//login 

router.post("/login", async(req, res) => {
    try{

        const {email, password} = req.body

        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message: "No user with this email was found"})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" })



        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {  
            expiresIn: "1h",
        })
    
        res.json({ token, user})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})

// login Google
router.post("/google-login", async(req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        let user = await User.findOne({ email });
        // Nếu chưa tồn tại thì tạo mới
        if (!user) {
            user = new User({
                name,
                email,
                password: "", 
                imageUrl: picture,
                phone: "",
                address: "",
            });

            await user.save();
        }else {
            if (!user.imageUrl) {
                user.imageUrl = picture;    // Update ảnh nếu chưa có hoặc khác ảnh hiện tại
                await user.save();
            }
        }

        const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        
        res.json({
            success: true,
            token: jwtToken,
            user,
            message: "Đăng nhập với Google thành công!",
        });
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ message: "Lỗi xác thực Google." });
    }
})


// ######################### Reset Password

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

router.post("/send-otp", async(req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });

        const otp = crypto.randomInt(100000, 999999).toString();
        user.otp = otp;
        user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        await transporter.sendMail({
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: "Mã Xác Minh OTP",
        html: `<p>Mã OTP của bạn là: <strong>${otp}</strong>. Mã này có hiệu lực trong <strong>5 phút</strong>.</p>`
        });

        return res.status(200).json({ message: "OTP đã được gửi đến email của bạn." });
    } catch (error) {
        console.error("Send OTP error:", error);
        return res.status(500).json({ message: "Lỗi khi gửi OTP." });
    }
})

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Không tìm thấy user với email:", email);
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    console.log("Tìm thấy user:", user);

    if (String(user.otp) !== String(otp)) {
      console.log("OTP không khớp:", { userOtp: user.otp, inputOtp: otp });
      return res.status(400).json({ message: "Mã OTP không chính xác." });
    }

    if (Date.now() > user.otpExpiresAt) {
      console.log("OTP hết hạn:", { now: Date.now(), expiresAt: user.otpExpiresAt });
      return res.status(400).json({ message: "Mã OTP đã hết hạn." });
    }

    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: "OTP hợp lệ." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Lỗi khi xác minh OTP." });
  }
});


router.post("/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Đã đổi mật khẩu thành công!" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Lỗi khi thay đổi mật khẩu." });
    }
})


router.post("/upload-image", async (req, res) => {
    const { 
        email, 
        fullName, 
        phone, 
        address, 
        password, 
        image 
    } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
        return res.status(404).json({ message: "User not found." });
        }

        if (image) user.imageUrl = image;
        if (fullName) user.name = fullName;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        // Hash mật khẩu mới nếu có thay đổi
        if (password) {
        const saltRounds = 10; // Độ mạnh của salt
        user.password = await bcrypt.hash(password, saltRounds);
        }

        await user.save();

        res.status(200).json({
        success: true,
        message: "User information updated successfully!",
        user: {
            email: user.email,
            fullName: user.name,
            phone: user.phone,
            location: user.address,
            imageUrl: user.imageUrl,
        },
        });
    } catch (error) {
        console.error("Error updating user information:", error);
        res.status(500).json({
        success: false,
        message: "Error updating user information.",
        error: error.message,
        });
    }
})

module.exports = router