import "dotenv/config"
import express from "express"
import twilio from "twilio"

const app=express()
app.use(express.urlencoded({extended:false}))

const client=twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
const VoiceResponse=twilio.twiml.VoiceResponse

app.post("/voice",(req,res)=>{
const twiml=new VoiceResponse()

twiml.say("Hello. Thank you for calling. How can I help you today?")

const gather=twiml.gather({
input:"speech",
action:"/process",
method:"POST"
})

gather.say("Please tell me how I can help.")

res.type("text/xml").send(twiml.toString())
})

app.post("/process",async(req,res)=>{
const twiml=new VoiceResponse()
const speech=req.body.SpeechResult||""

if(speech.toLowerCase().includes("transfer")){
twiml.say("Transferring you now.")

const dial=twiml.dial({
timeout:20,
action:"/afterdial"
})

dial.number(process.env.TRANSFER_TO)

}else{

twiml.say("Thank you. Someone will follow up shortly.")

twiml.redirect("/listen")

}

res.type("text/xml").send(twiml.toString())
})

app.post("/afterdial",(req,res)=>{
const twiml=new VoiceResponse()

twiml.say("Sorry no one answered. Please leave a message.")

twiml.record({
maxLength:120,
action:"/voicemail"
})

res.type("text/xml").send(twiml.toString())
})

app.post("/voicemail",async(req,res)=>{
const twiml=new VoiceResponse()

const recording=req.body.RecordingUrl
const from=req.body.From

await client.messages.create({
to:process.env.TRANSFER_TO,
from:process.env.TWILIO_NUMBER,
body:`New voicemail from ${from}. Recording: ${recording}`
})

twiml.say("Your message has been recorded. Goodbye.")

res.type("text/xml").send(twiml.toString())
})

app.listen(process.env.PORT||3000)
