// services/smsService.ts
import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendSmsTwilio(to: string, message: string): Promise<void> {
  // Normalize phone to E.164 format (+251 for Ethiopia)
  let toNumber = to.startsWith("+") ? to : `+251${to.replace(/^0/, "")}`

  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: toNumber,
    })
    console.log(`SMS sent to ${toNumber}: ${sms.sid}`)
  } catch (error: any) {
    console.error(`Error sending SMS to ${toNumber}:`, error.message)
    throw error
  }
}
