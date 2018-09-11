const builder = require('botbuilder')
const restify = require('restify')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const { GlipConnector } = require('../lib')

dotenv.config()
let botsData = {}
const botsDataFile = path.join(__dirname, '.cache')
if (fs.existsSync(botsDataFile)) {
  botsData = JSON.parse(fs.readFileSync(botsDataFile, 'utf-8'))
}

const server = restify.createServer()

server.use(restify.plugins.queryParser())
server.use(restify.plugins.bodyParser())

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url)
})

const connector = new GlipConnector({
  botLookup: (botId) => {
    const botEntry = botsData[botId]
    return botEntry
  },
  verificationToken: process.env.GLIP_BOT_VERIFICATION_TOKEN,
  clientId: process.env.GLIP_CLIENT_ID,
  clientSecret: process.env.GLIP_CLIENT_SECRET,
  server: process.env.GLIP_API_SERVER,
  redirectUrl: `${process.env.GLIP_BOT_SERVER}/oauth`,
  webhookUrl: `${process.env.GLIP_BOT_SERVER}/webhook`
})

// For public glip bot
server.get('/oauth', connector.listenOAuth())

//For private glip bot
server.post('/oauth', connector.listenOAuth())

server.post('/webhook', connector.listen())

const bot = new builder.UniversalBot(connector)
const recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL)

bot.on('installationUpdate', (event) => {
  console.log(`New bot installed: ${event.sourceEvent.TokenData.owner_id}`)

  botsData[event.sourceEvent.TokenData.owner_id] = {
    identity: event.address.bot,
    token: event.sourceEvent.TokenData
  }
  fs.writeFileSync(botsDataFile, JSON.stringify(botsData)) // save token
})

const intents = new builder.IntentDialog({ recognizers: [recognizer] })
  .matches('Translate.Translate', (session, args) => {
    console.log(args.intent)
    console.log(args.entities)
    session.send('Translate', JSON.stringify(args.entities))
  })
  .onDefault((session) => {
    console.log(session.message.text)
    session.send('Sorry, I did not understand \'%s\'.', session.message.text)
  })

bot.dialog('/', intents)
