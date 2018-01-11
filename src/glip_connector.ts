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
}

export class GlipConnector implements IConnector {
  private onEventHandler: (events: IEvent[], cb?: (err: Error) => void) => void
  private glip: any

  constructor(protected settings: IGlipConnectorSettings) {
    this.glip = new Glip(this.settings)
  }

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
      this.glip.handleWebhook(verificationToken, body).then((message: any) => {
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
      this.glip.handleOauth(req.query).then((data: any) => {
        res.status(200)
        res.end('ok')
        console.log(JSON.stringify(data))
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
      user: { id: message.groupId, name: message.groupId },
      bot: { id: message.botId, name: 'Bot' },
      conversation: { id: message.groupId }
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

  public send(messages: any[]): void  {
    messages.forEach((message) => {
      this.postMessage(message)
    })
  }

  public postMessage(message: any): void {
    const address = message.address
    const user = address.user
    this.glip.send({
      groupId: user.id,
      text: message.text
    })
  }

  public startConversation(address: IAddress, done: (err: Error, address?: IAddress) => void): void {
    const addr = {
      ...address,
      conversation: { id: address.user.id }
    }
    done(null, addr);
  }
}
