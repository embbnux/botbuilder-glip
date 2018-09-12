import { IOauthQuery, IOauthBody, IGlipMessage } from './interfaces';
export interface IGlipSettings {
    verificationToken: string;
    clientId: string;
    clientSecret: string;
    server: string;
    redirectUrl: string;
    webhookUrl: string;
    replyOnlyMentioned?: boolean;
    disableSubscribe?: boolean;
}
export default class Glip {
    protected settings: IGlipSettings;
    protected token: any;
    private platform;
    constructor(settings: IGlipSettings, token?: any);
    handleOauth(query: IOauthQuery, body?: IOauthBody): Promise<any>;
    send(message: IGlipMessage): Promise<void>;
    handleWebhook(verificationToken: string, body: any): Promise<IGlipMessage>;
    private getPerson(personId);
    private getCurrentExtension();
    private createSubscribe();
    private renewSubscription(id);
}
