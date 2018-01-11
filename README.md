# botbuilder-glip

Microsoft Bot Framework connector for RingCentral Glip

## Features

* Ready for Microsoft Bot Framework V3
* Oauth flow support
* **No need a registered bot** on [dev.botframework.com](https://dev.botframework.com/), but require a ringcentral developer account, go to apply [free account](https://developer.ringcentral.com/)

## Installation

```
npm install botbuilder-glip
```

## Usage

```
const builder = require('botbuilder')
const restify = require('restify')
const dotenv = require('dotenv')
const { GlipConnector } = require('botbuilder-glip')

dotenv.config()

const server = restify.createServer()

server.use(restify.plugins.queryParser())
server.use(restify.plugins.bodyParser())

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url)
})

const connector = new GlipConnector({
  verificationToken: process.env.GLIP_BOT_VERIFICATION_TOKEN,
  clientId: process.env.GLIP_CLIENT_ID,
  clientSecret: process.env.GLIP_CLIENT_SECRET,
  server: process.env.GLIP_API_SERVER,
  redirectUrl: `${process.env.GLIP_BOT_SERVER}/oauth`,
  webhookUrl: `${process.env.GLIP_BOT_SERVER}/webhook`
})

server.get('/oauth', connector.listenOAuth())
server.post('/webhook', connector.listen())

const bot = new builder.UniversalBot(connector)

bot.dialog('/', function (session) {
  console.log('Get message from glip:', session.message)
  session.send("You said: %s", session.message.text) // reply to glip
});
```
