import { IOauthQuery, IGlipMessage } from './interfaces';
export interface IGlipSettings {
    verificationToken: string;
    clientId: string;
    clientSecret: string;
    server: string;
    redirectUrl: string;
    webhookUrl: string;
}
export default class Glip {
    protected settings: IGlipSettings;
    protected token: any;
    private platform;
    constructor(settings: IGlipSettings, token?: any);
    handleOauth(query: IOauthQuery): Promise<any>;
    send(message: IGlipMessage): Promise<void>;
    handleWebhook(verificationToken: string, body: any): Promise<IGlipMessage>;
    private createSubscribe();
    private renewSubscription(id);
}
