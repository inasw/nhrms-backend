import dotenv from "dotenv"
import twilio from "twilio"

dotenv.config()

async function sendTestSMS() {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    const message = await client.messages.create({
      body: "Hello from Twilio! This is a test SMS from my project.",
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: process.env.TEST_RECIPIENT!,
    })

    console.log("✅ Message sent! SID:", message.sid)
  } catch (err) {
    console.error(" SMS failed:", err)
  }
}

sendTestSMS()
