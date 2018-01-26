"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RingCentral = require("ringcentral");
class Glip {
    constructor(settings, token) {
        this.settings = settings;
        this.token = token;
        const rcsdk = new RingCentral({
            appKey: this.settings.clientId,
            appSecret: this.settings.clientSecret,
            server: this.settings.server
        });
        this.platform = rcsdk.platform();
        if (token) {
            this.platform.auth().setData(this.token);
        }
    }
    async handleOauth(query) {
        if (!query.code) {
            throw new Error('Param error');
        }
        try {
            const response = await this.platform.login({
                code: query.code,
                redirectUri: this.settings.redirectUrl
            });
            const data = response.json();
            await this.createSubscribe();
            return data;
        }
        catch (e) {
            throw e;
        }
    }
    async send(message) {
        try {
            await this.platform.post('/glip/posts', {
                groupId: message.groupId, text: message.text
            });
        }
        catch (e) {
            console.error(e);
        }
    }
    async handleWebhook(verificationToken, body) {
        if (verificationToken !== this.settings.verificationToken) {
            throw new Error('Bad Request');
        }
        if (body.event === '/restapi/v1.0/subscription/~?threshold=60&interval=15') {
            this.renewSubscription(body.subscriptionId);
            return;
        }
        const message = body.body;
        if (body.event === '/restapi/v1.0/glip/posts' && message) {
            message.botId = body.ownerId;
            if (message.botId === message.creatorId) {
                // outbound message
                return;
            }
            if (!message.text) {
                return;
            }
            try {
                message.creator = await this.getPerson(message.creatorId);
                message.bot = await this.getPerson(message.botId);
                const group = await this.platform.get(`/glip/groups/${message.groupId}`);
                message.group = group.json();
                const mentionedStr = `![:Person](${message.botId})`;
                if (this.settings.replyOnlyMentioned && message.group.members && message.group.members.length > 2) {
                    if (message.text && message.text.indexOf(mentionedStr) === -1) {
                        return;
                    }
                }
                message.text = message.text.replace(mentionedStr, '');
            }
            catch (e) {
                console.error(e);
            }
            return message;
        }
    }
    async getPerson(personId) {
        try {
            const response = await this.platform.get(`/glip/persons/${personId}`);
            const data = response.json();
            return Object.assign({}, data, { name: `${data.firstName ? data.firstName : ''}${data.lastName ? ` ${data.lastName}` : ''}` });
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }
    async createSubscribe() {
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
        };
        try {
            await this.platform.post('/subscription', requestData);
        }
        catch (e) {
            console.error(e);
        }
    }
    async renewSubscription(id) {
        try {
            await this.platform.post(`/subscription/${id}/renew`);
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.default = Glip;
//# sourceMappingURL=glip.js.map