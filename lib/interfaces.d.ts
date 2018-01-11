export interface IOauthQuery {
    code: string;
}
export interface IGlipMessage {
    groupId: string;
    text: string;
}
export interface IResponse {
    status(code: number): void;
    end(body?: any): void;
    header(key: string, value: string): void;
}
export interface IRequest {
    query: any;
    params: any;
    body: any;
    header(key: string, value?: string): void;
}
