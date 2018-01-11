import { IAddress, IConnector, IEvent } from 'botbuilder';
import { IResponse, IRequest } from './interfaces';
export interface IGlipConnectorSettings {
    verificationToken: string;
    clientId: string;
    clientSecret: string;
    server: string;
    redirectUrl: string;
    webhookUrl: string;
}
export declare class GlipConnector implements IConnector {
    protected settings: IGlipConnectorSettings;
    private onEventHandler;
    private glip;
    constructor(settings: IGlipConnectorSettings);
    listen(): (req: IRequest, res: IResponse, next: () => void) => void;
    listenOAuth(): (req: IRequest, res: IResponse, next: () => void) => void;
    processMessage(message: any): this;
    onEvent(handler: (events: IEvent[], cb?: (err: Error) => void) => void): void;
    send(messages: any[]): void;
    postMessage(message: any): void;
    startConversation(address: IAddress, done: (err: Error, address?: IAddress) => void): void;
}
