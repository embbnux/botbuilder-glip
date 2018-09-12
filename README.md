# botbuilder-glip

[![NPM Version](https://img.shields.io/npm/v/botbuilder-glip.svg?style=flat-square)](https://www.npmjs.com/package/botbuilder-glip)

Microsoft Bot Framework connector for RingCentral Glip

## Features

* Ready for Microsoft Bot Framework V3
* Oauth flow support
* **No need a registered bot** on [dev.botframework.com](https://dev.botframework.com/), but require a ringcentral developer account, go to apply [free account](https://developer.ringcentral.com/)
* Support public and private Glip bot app

## Installation

```
npm install botbuilder-glip
```

## Usage

```js
const builder = require('botbuilder')
const restify = require('restify')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const { GlipConnector } = require('botbuilder-glip')

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

bot.on('installationUpdate', (event) => {
  console.log(`New bot installed: ${event.sourceEvent.TokenData.owner_name}`)

  botsData[event.sourceEvent.TokenData.owner_id] = {
    identity: event.address.bot,
    token: event.sourceEvent.TokenData
  }
  fs.writeFileSync(botsDataFile, JSON.stringify(botsData)) // save token
})

bot.dialog('/', function (session) {
  console.log('Get message from glip:', session.message)
  session.send({
    text: `You said: ${session.message.text}`,
    attachments: [{
      type: 'Card',
      fallback: 'Text',
      text: session.message.text,
    }]
  })
  session.send("You said: %s", session.message.text)
});
```

### About webhook subscription

There are two ways to create Webhook subscription:
  * Create with Bot codes
  * Create with Bot Webhook Setting in RingCentral Developer website

If you enable Bot Webhook in RingCentral Developer website, it will create webhook subscription to your webhook URI when you add a bot.

The `GlipConnector` will create Webhook subscription after authrization. So it is **recommended** to disable the Bot Webhook setting in RingCentral Developer website, or you will have two webhook subscription.

If you want to enable the Bot Webhook setting in RingCentral Developer website, you can disable the bot to create subscription:

```
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
  webhookUrl: `${process.env.GLIP_BOT_SERVER}/webhook`,
  disableSubscribe: true
})
```

And you also need to keep verificationToken same as Verification Token in Bot Webhooks setting page. We use verificationToken to validate webhook request.

## Examples

* [Basic example](https://github.com/embbnux/botbuilder-glip/blob/master/examples/simple.js)
* [Example with LUIS AI](https://github.com/embbnux/botbuilder-glip/blob/master/examples/ai-bot.js)
* [Example with Dialogflow AI and mongodb](https://github.com/embbnux/translate-bot)

## Tutorials

* [Video](https://www.youtube.com/watch?v=WwuBh40dM9o)
