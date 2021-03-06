import * as RingCentral from 'ringcentral'
import { IOauthQuery, IOauthBody, IGlipMessage } from './interfaces'

export interface IGlipSettings {
  verificationToken: string
  clientId: string
  clientSecret: string
  server: string
  redirectUrl: string
  webhookUrl: string
  replyOnlyMentioned?: boolean
  disableSubscribe?: boolean
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

  public async handleOauth(query: IOauthQuery, body?: IOauthBody): Promise<any> {
    if (query && query.code) {
      try {
        const response = await this.platform.login({
          code: query.code,
          redirectUri: this.settings.redirectUrl
        });
        const data = response.json()
        const token = {
          ...data,
          owner_name: ''
        }
        const extension = await this.getCurrentExtension()
        token.owner_name = extension.name
        this.createSubscribe()
        return token
      } catch (e) {
        throw e
      }
    }
    if (body && body.access_token && body.client_id === this.settings.clientId) {
      const token = {
        ...body,
        token_type: 'bearer',
        expires_in: 10 * 365 * 24 * 3600,
        owner_id: '',
        owner_name: ''
      }
      this.platform.auth().setData(token)
      try {
        const extension = await this.getCurrentExtension()
        token.owner_id = `${extension.id}`
        token.owner_name = extension.name
        this.createSubscribe()
        return token
      } catch (e) {
        throw e
      }
    }
    throw new Error('Param error')
  }

  public async send(message: IGlipMessage): Promise<void> {
    if (!message) {
      return
    }
    if (
      (!message.text || message.text.length === 0) &&
      (!message.attachments || message.attachments.length === 0)
    ) {
      return
    }
    try {
      await this.platform.post(`/glip/groups/${message.groupId}/posts`, {
        text: message.text,
        attachments: message.attachments
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
    if (message && message.eventType.indexOf('Post') === 0) {
      message.botId = body.ownerId
      if (message.botId === message.creatorId) {
        // outbound message
        return null
      }
      if (!message.text) {
        return null
      }
      try {
        message.creator = await this.getPerson(message.creatorId)
        message.bot = { id: message.botId, name: '' }
        const group = await this.platform.get(`/glip/groups/${message.groupId}`)
        message.group = group.json()
        const mentionedStr = `![:Person](${message.botId})`
        const mentioned = message.text && (message.text.indexOf(mentionedStr) > -1)
        if (this.settings.replyOnlyMentioned && message.group.members && message.group.members.length > 2) {
          if (!mentioned) {
            return null
          }
        }
        message.mentioned = mentioned
        message.text = message.text.replace(mentionedStr, '')
      } catch (e) {
        console.error(e)
      }
      return message
    }
  }

  private async getPerson(personId: string) {
    try {
      const response = await this.platform.get(`/glip/persons/${personId}`)
      const data = response.json()
      return {
        ...data,
        name: `${data.firstName ? data.firstName : ''}${data.lastName ? ` ${data.lastName}` : ''}`
      }
    } catch (e) {
      console.error(e)
      return null
    }
  }

  private async getCurrentExtension() {
    const response = await this.platform.get('/account/~/extension/~')
    const data = response.json()
    return data
  }

  private async createSubscribe(): Promise<void> {
    if (this.settings.disableSubscribe) {
      return
    }
    console.log('creating subscription')
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
      expiresIn: 86400 // 1 days
    }
    try {
      await this.platform.post('/subscription', requestData)
      console.log('subscription created.')
    } catch (e) {
      console.error(e)
    }
  }

  private async renewSubscription(id: any): Promise<any> {
    try {
      console.log('renewing subscription:', id)
      await this.platform.post(`/subscription/${id}/renew`)
      console.log('subscription renewed', id)
    } catch (e) {
      console.error(e);
    }
  }
}
