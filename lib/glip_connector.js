"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const glip_1 = require("./glip");
class GlipConnector {
    constructor(settings) {
        this.settings = settings;
        this.glip = new glip_1.default(this.settings);
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
            this.glip.handleWebhook(verificationToken, body).then((message) => {
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
            this.glip.handleOauth(req.query).then((data) => {
                res.status(200);
                res.end('ok');
                console.log(JSON.stringify(data));
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
            user: { id: message.groupId, name: message.groupId },
            bot: { id: message.botId, name: 'Bot' },
            conversation: { id: message.groupId }
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
    send(messages) {
        messages.forEach((message) => {
            this.postMessage(message);
        });
    }
    postMessage(message) {
        const address = message.address;
        const user = address.user;
        this.glip.send({
            groupId: user.id,
            text: message.text
        });
    }
    startConversation(address, done) {
        const addr = Object.assign({}, address, { conversation: { id: address.user.id } });
        done(null, addr);
    }
}
exports.GlipConnector = GlipConnector;
//# sourceMappingURL=glip_connector.js.map