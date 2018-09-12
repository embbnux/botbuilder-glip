import { IAddress, IConnector, IEvent } from 'botbuilder';
import { IResponse, IRequest } from './interfaces';
export interface IGlipConnectorSettings {
    verificationToken: string;
    clientId: string;
    clientSecret: string;
    server: string;
    redirectUrl: string;
    webhookUrl: string;
    replyOnlyMentioned?: boolean;
    disableSubscribe?: boolean;
    botLookup(ownerId: string): any;
}
export declare class GlipConnector implements IConnector {
    protected settings: IGlipConnectorSettings;
    private onEventHandler;
    private onDispatchEvents;
    constructor(settings: IGlipConnectorSettings);
    listen(): (req: IRequest, res: IResponse, next: () => void) => Promise<void>;
    listenOAuth(): (req: IRequest, res: IResponse, next: () => void) => void;
    private handleWebhook(bot, body, verificationToken);
    processMessage(message: any): this;
    onEvent(handler: (events: IEvent[], cb?: (err: Error) => void) => void): void;
    private dispatchEvents(events);
    send(messages: any[]): void;
    postMessage(message: any): Promise<void>;
    startConversation(address: IAddress, done: (err: Error, address?: IAddress) => void): void;
}
