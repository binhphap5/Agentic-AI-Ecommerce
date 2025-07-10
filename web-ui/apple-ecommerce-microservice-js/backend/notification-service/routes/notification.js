const express = require("express")
const sendEmail = require("../services/emailService")
const sendSMS = require("../services/smsService")
const router = express.Router()

// send email
router.post("/email", async( req, res) => {
    const {to, subject, text} = req.body

    try{
        await sendEmail(to, subject, text)
        res.status(200).send("Email sent")
    }catch(e){
        console.error(e)
        res.status(500).send("Failed to send email", e)
    }
})


// send SMS
router.post("/sms", async(req, res) => {
    const {to, message} = req.body

    try{
        await sendSMS(to, message)
        res.status(200).send("SMS sent")
    }catch(e){
        console.error(e)
        res.status(500).send("Failed to send SMS", e)
    }
})

module.exports = router