"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const glip_1 = require("./glip");
class GlipConnector {
    constructor(settings) {
        this.settings = settings;
    }
    listen() {
        return (req, res, next) => {
            const validationToken = req.header('validation-token');
            if (validationToken) {
                res.status(200);
                res.header('validation-token', validationToken);
                res.end('ok');
                return;
            }
            const verificationToken = req.header('verification-token');
            const body = req.body;
            const botData = this.settings.botLookup(body.ownerId);
            if (!botData) {
                res.status(400);
                res.end('{ "Error": "Need to authorization first"}');
                next();
                return;
            }
            const glip = new glip_1.default(this.settings, botData.token);
            glip.handleWebhook(verificationToken, body).then((message) => {
                res.status(200);
                res.end();
                this.processMessage(message);
                next();
                if (message) {
                    return;
                }
            }).catch(() => {
                res.status(400);
                res.end();
                next();
            });
        };
    }
    listenOAuth() {
        return (req, res, next) => {
            const glip = new glip_1.default(this.settings);
            glip.handleOauth(req.query).then((data) => {
                res.status(200);
                res.end('ok');
                const address = {
                    channelId: 'glip',
                    user: { id: data.owner_id, name: data.owner_id },
                    bot: { id: data.owner_id, name: 'Bot' },
                    conversation: { id: data.owner_id }
                };
                this.dispatchEvents([{
                        type: 'installationUpdate',
                        source: 'glip',
                        agent: 'botbuilder',
                        address,
                        user: { id: data.owner_id, name: data.owner_id },
                        sourceEvent: {
                            TokenData: Object.assign({}, data),
                        }
                    }]);
                next();
            }).catch((e) => {
                console.log(e);
                res.status(500);
                res.end();
                next();
            });
        };
    }
    processMessage(message) {
        let msg;
        let address;
        if (!this.onEventHandler) {
            throw new Error('Error no handler');
        }
        address = {
            channelId: 'glip',
            user: { id: message.creatorId, name: message.creator && message.creator.name },
            bot: { id: message.botId, name: message.bot && message.bot.name },
            conversation: { id: message.groupId, name: message.group && message.group.name }
        };
        msg = new botbuilder_1.Message()
            .address(address)
            .timestamp(message.creationTime)
            .entities();
        msg = msg.text(message.text);
        this.onEventHandler([msg.toMessage()]);
        return this;
    }
    onEvent(handler) {
        this.onEventHandler = handler;
    }
    dispatchEvents(events) {
        if (events.length > 0) {
            if (this.onDispatchEvents) {
                this.onDispatchEvents(events, (transforedEvents) => {
                    this.onEventHandler(transforedEvents);
                });
            }
            else {
                this.onEventHandler(events);
            }
        }
    }
    send(messages) {
        messages.forEach((message) => {
            this.postMessage(message);
        });
    }
    postMessage(message) {
        const address = message.address;
        const conversation = address.conversation;
        const bot = address.bot;
        const botData = this.settings.botLookup(bot.id);
        const glip = new glip_1.default(this.settings, botData.token);
        glip.send({
            groupId: conversation.id,
            text: message.text
        });
    }
    startConversation(address, done) {
        const addr = Object.assign({}, address, { conversation: { id: address.conversation.id } });
        done(null, addr);
    }
}
exports.GlipConnector = GlipConnector;
//# sourceMappingURL=glip_connector.js.map