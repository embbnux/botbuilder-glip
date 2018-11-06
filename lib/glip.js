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
    async handleOauth(query, body) {
        if (query && query.code) {
            try {
                const response = await this.platform.login({
                    code: query.code,
                    redirectUri: this.settings.redirectUrl
                });
                const data = response.json();
                const token = Object.assign({}, data, { owner_name: '' });
                const extension = await this.getCurrentExtension();
                token.owner_name = extension.name;
                this.createSubscribe();
                return token;
            }
            catch (e) {
                throw e;
            }
        }
        if (body && body.access_token && body.client_id === this.settings.clientId) {
            const token = Object.assign({}, body, { token_type: 'bearer', expires_in: 10 * 365 * 24 * 3600, owner_id: '', owner_name: '' });
            this.platform.auth().setData(token);
            try {
                const extension = await this.getCurrentExtension();
                token.owner_id = `${extension.id}`;
                token.owner_name = extension.name;
                this.createSubscribe();
                return token;
            }
            catch (e) {
                throw e;
            }
        }
        throw new Error('Param error');
    }
    async send(message) {
        if (!message) {
            return;
        }
        if ((!message.text || message.text.length === 0) &&
            (!message.attachments || message.attachments.length === 0)) {
            return;
        }
        try {
            await this.platform.post(`/glip/groups/${message.groupId}/posts`, {
                text: message.text,
                attachments: message.attachments
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
        if (message && message.eventType.indexOf('Post') === 0) {
            message.botId = body.ownerId;
            if (message.botId === message.creatorId) {
                // outbound message
                return null;
            }
            if (!message.text) {
                return null;
            }
            try {
                message.creator = await this.getPerson(message.creatorId);
                message.bot = { id: message.botId, name: '' };
                const group = await this.platform.get(`/glip/groups/${message.groupId}`);
                message.group = group.json();
                const mentionedStr = `![:Person](${message.botId})`;
                const mentioned = message.text && (message.text.indexOf(mentionedStr) > -1);
                if (this.settings.replyOnlyMentioned && message.group.members && message.group.members.length > 2) {
                    if (!mentioned) {
                        return null;
                    }
                }
                message.mentioned = mentioned;
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
    async getCurrentExtension() {
        const response = await this.platform.get('/account/~/extension/~');
        const data = response.json();
        return data;
    }
    async createSubscribe() {
        if (this.settings.disableSubscribe) {
            return;
        }
        console.log('creating subscription');
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
            console.log('subscription created.');
        }
        catch (e) {
            console.error(e);
        }
    }
    async renewSubscription(id) {
        try {
            console.log('renewing subscription:', id);
            await this.platform.post(`/subscription/${id}/renew`);
            console.log('subscription renewed', id);
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.default = Glip;
//# sourceMappingURL=glip.js.map