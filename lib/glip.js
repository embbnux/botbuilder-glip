"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RingCentral = require("ringcentral");
class Glip {
    constructor(settings) {
        this.settings = settings;
        this.settings = settings;
        const rcsdk = new RingCentral({
            appKey: this.settings.clientId,
            appSecret: this.settings.clientSecret,
            server: this.settings.server
        });
        this.platform = rcsdk.platform();
    }
    async handleOauth(query) {
        console.log(query);
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
            return message;
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
            expiresIn: 3600 // 1 days
        };
        try {
            const response = await this.platform.post('/subscription', requestData);
            const subscription = response.json();
        }
        catch (e) {
            console.error(e);
        }
    }
    async renewSubscription(id) {
        try {
            const response = await this.platform.post(`/subscription/${id}/renew`);
            const subscription = response.json();
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.default = Glip;
//# sourceMappingURL=glip.js.map