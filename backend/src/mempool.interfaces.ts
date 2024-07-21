
export interface RequiredSpec { [name: string]: RequiredParams; }

interface RequiredParams {
  required: boolean;
  types: ('@string' | '@number' | '@boolean' | string)[];
}

export interface ILoadingIndicators { [name: string]: number; }

export interface IBackendInfo {
  hostname: string;
  gitCommit: string;
  version: string;
}

export interface WebsocketResponse {
  action: string;
  data: string[];
  'track-bisq-market': string;
}
  
