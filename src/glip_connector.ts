import { IAddress, IConnector, IEvent, Message } from 'botbuilder'
import Glip from './glip'

import { IResponse, IRequest } from './interfaces'

export interface IGlipConnectorSettings {
  verificationToken: string
  clientId: string
  clientSecret: string
  server: string
  redirectUrl: string
  webhookUrl: string
  replyOnlyMentioned?: boolean
  botLookup(ownerId: string): any
}

export class GlipConnector implements IConnector {
  private onEventHandler: (events: IEvent[], cb?: (err: Error) => void) => void
  private onDispatchEvents: (events: IEvent[], cb?: (events: IEvent[]) => void) => void

  constructor(protected settings: IGlipConnectorSettings) {}

  public listen() {
    return (req: IRequest, res: IResponse, next: () => void) : void => {
      const validationToken = req.header('validation-token')
      if (validationToken) {
        res.status(200)
        res.header('validation-token', validationToken)
        res.end('ok')
        return
      }
      const verificationToken = req.header('verification-token')
      const body = req.body
      const botData = this.settings.botLookup(body.ownerId)
      if (!botData) {
        res.status(400)
        res.end('{ "Error": "Need to authorization first"}')
        next()
        return
      }
      const glip = new Glip(this.settings, botData.token)
      glip.handleWebhook(verificationToken, body).then((message: any): void => {
        res.status(200)
        res.end()
        this.processMessage(message);
        next()
        if (message) {
          return
        }
      }).catch(() => {
        res.status(400)
        res.end()
        next()
      })
    }
  }

  public listenOAuth() {
    return (req: IRequest, res: IResponse, next: () => void) => {
      const glip = new Glip(this.settings)
      glip.handleOauth(req.query).then((data: any) => {
        res.status(200)
        res.end('ok')
        const address = {
          channelId: 'glip',
          user: { id: data.owner_id, name: data.owner_id },
          bot: { id: data.owner_id, name: 'Bot' },
          conversation: { id: data.owner_id }
        }
        this.dispatchEvents([{
          type: 'installationUpdate',
          source: 'glip',
          agent: 'botbuilder',
          address,
          user: { id: data.owner_id, name: data.owner_id },
          sourceEvent: {
            TokenData: { ...data },
          }
        }])
        next()
      }).catch((e: any) => {
        console.log(e)
        res.status(500)
        res.end()
        next()
      })
    }
  }

  public processMessage(message: any) {
    let msg
    let address

    if (!this.onEventHandler) {
      throw new Error('Error no handler')
    }

    address = {
      channelId: 'glip',
      user: { id: message.creatorId, name: message.creator && message.creator.name },
      bot: { id: message.botId, name: message.bot && message.bot.name },
      conversation: { id: message.groupId, name: message.group && message.group.name }
    }

    msg = new Message()
                .address(address)
                .timestamp(message.creationTime)
                .entities();
    msg = msg.text(message.text)
    this.onEventHandler([msg.toMessage()]);
    return this;
  }

  public onEvent(handler: (events: IEvent[], cb?: (err: Error) => void) => void): void {
    this.onEventHandler = handler;
  }

  private dispatchEvents(events: IEvent[]) {
    if (events.length > 0) {
      if (this.onDispatchEvents) {
        this.onDispatchEvents(events, (transforedEvents) => {
          this.onEventHandler(transforedEvents)
        })
      } else {
        this.onEventHandler(events)
      }
    }
  }

  public send(messages: any[]): void  {
    messages.forEach((message) => {
      this.postMessage(message)
    })
  }

  public postMessage(message: any): void {
    const address = message.address
    const conversation = address.conversation
    const bot = address.bot
    const botData = this.settings.botLookup(bot.id)
    const glip = new Glip(this.settings, botData.token)

    glip.send({
      groupId: conversation.id,
      text: message.text
    })
  }

  public startConversation(address: IAddress, done: (err: Error, address?: IAddress) => void): void {
    const addr = {
      ...address,
      conversation: { id: address.conversation.id }
    }
    done(null, addr);
  }
}
