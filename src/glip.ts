import * as RingCentral from 'ringcentral'
import { IOauthQuery, IGlipMessage } from './interfaces'

export interface IGlipSettings {
  verificationToken: string
  clientId: string
  clientSecret: string
  server: string
  redirectUrl: string
  webhookUrl: string
}

export default class Glip {
  private platform : any

  constructor(protected settings: IGlipSettings, protected token?: any) {
    const rcsdk = new RingCentral({
      appKey: this.settings.clientId,
      appSecret: this.settings.clientSecret,
      server: this.settings.server
    })
    this.platform = rcsdk.platform()
    if (token) {
      this.platform.auth().setData(this.token)
    }
  }

  public async handleOauth(query: IOauthQuery): Promise<any> {
    console.log(query)
    if (!query.code) {
      throw new Error('Param error')
    }
    try {
      const response = await this.platform.login({
        code: query.code,
        redirectUri: this.settings.redirectUrl
      });
      const data = response.json()
      await this.createSubscribe()
      return data
    } catch (e) {
      throw e
    }
  }

  public async send(message: IGlipMessage): Promise<void> {
    try {
      await this.platform.post('/glip/posts', {
        groupId: message.groupId, text: message.text
      })
    } catch (e) {
      console.error(e)
    }
  }

  public async handleWebhook(verificationToken: string, body: any): Promise<IGlipMessage> {
    if (verificationToken !== this.settings.verificationToken) {
      throw new Error('Bad Request')
    }

    if (body.event === '/restapi/v1.0/subscription/~?threshold=60&interval=15') {
      this.renewSubscription(body.subscriptionId);
      return;
    }

    const message = body.body
    if (body.event === '/restapi/v1.0/glip/posts' && message) {
      message.botId = body.ownerId
      if (message.botId === message.creatorId) {
        // outbound message
        return
      }
      return message
    }
  }

  private async createSubscribe(): Promise<void> {
    const requestData = {
      eventFilters: [
        '/restapi/v1.0/glip/posts',
        '/restapi/v1.0/glip/groups',
        '/restapi/v1.0/subscription/~?threshold=60&interval=15'
      ],
      deliveryMode: {
        transportType: 'WebHook',
        address: this.settings.webhookUrl,
        verificationToken: this.settings.verificationToken
      },
      expiresIn: 3600 // 1 days
    }
    try {
      await this.platform.post('/subscription', requestData)
    } catch (e) {
      console.error(e)
    }
  }

  private async renewSubscription(id: any): Promise<any> {
    try {
      await this.platform.post(`/subscription/${id}/renew`)
    } catch (e) {
      console.error(e);
    }
  }
}
