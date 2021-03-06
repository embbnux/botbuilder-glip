export interface IOauthQuery {
  code: string
}

export interface IOauthBody {
  access_token: string
  creator_extension_id: string
  creator_account_id: string
  client_id: string
}

export interface IGlipMessage {
  groupId: string
  text?: string
  attachments?: any[]
}

export interface IResponse {
  status(code: number): void
  end(body?: any): void
  header(key: string, value: string): void
}

export interface IRequest {
  query: any
  params: any
  body: any
  header(key: string, value?: string): void
}
