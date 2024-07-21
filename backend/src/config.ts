const configFromFile = require(
    process.env.MEMPOOL_CONFIG_FILE ? process.env.MEMPOOL_CONFIG_FILE : '../mempool-config.json'
);

interface IConfig {
  MEMPOOL: {
    ENABLED: boolean;
    NETWORK: 'mainnet' | 'testnet' | 'signet' | 'liquid' | 'liquidtestnet';
    BACKEND: 'bisq' | 'none';
    HTTP_PORT: number;
    SPAWN_CLUSTER_PROCS: number;
    API_URL_PREFIX: string;
    POLL_RATE_MS: number;
    CACHE_DIR: string;
    CACHE_ENABLED: boolean;
    EXTERNAL_MAX_RETRY: number;
    EXTERNAL_RETRY_INTERVAL: number;
    USER_AGENT: string;
    STDOUT_LOG_MIN_PRIORITY: 'emerg' | 'alert' | 'crit' | 'err' | 'warn' | 'notice' | 'info' | 'debug';
    PRICE_UPDATES_PER_HOUR: number;
    MAX_TRACKED_ADDRESSES: number;
  };
  SYSLOG: {
    ENABLED: boolean;
    HOST: string;
    PORT: number;
    MIN_PRIORITY: 'emerg' | 'alert' | 'crit' | 'err' | 'warn' | 'notice' | 'info' | 'debug';
    FACILITY: string;
  };
  BISQ: {
    ENABLED: boolean;
    HOST: string;
    PORT: number;
  };
  SOCKS5PROXY: {
    ENABLED: boolean;
    USE_ONION: boolean;
    HOST: string;
    PORT: number;
    USERNAME: string;
    PASSWORD: string;
  };
}

const defaults: IConfig = {
  'MEMPOOL': {
    'ENABLED': true,
    'NETWORK': 'mainnet',
    'BACKEND': 'none',
    'HTTP_PORT': 8999,
    'SPAWN_CLUSTER_PROCS': 0,
    'API_URL_PREFIX': '/api/v1/',
    'POLL_RATE_MS': 2000,
    'CACHE_DIR': './cache',
    'CACHE_ENABLED': true,
    'EXTERNAL_MAX_RETRY': 1,
    'EXTERNAL_RETRY_INTERVAL': 0,
    'USER_AGENT': 'bisqexplorer',
    'STDOUT_LOG_MIN_PRIORITY': 'debug',
    'PRICE_UPDATES_PER_HOUR': 1,
    'MAX_TRACKED_ADDRESSES': 1,
  },
  'SYSLOG': {
    'ENABLED': true,
    'HOST': '127.0.0.1',
    'PORT': 514,
    'MIN_PRIORITY': 'info',
    'FACILITY': 'local7'
  },
  'BISQ': {
    'ENABLED': true,
    'HOST': '127.0.0.1',
    'PORT': 8082,
  },
  'SOCKS5PROXY': {
    'ENABLED': false,
    'USE_ONION': true,
    'HOST': '127.0.0.1',
    'PORT': 9050,
    'USERNAME': '',
    'PASSWORD': ''
  },
};

class Config implements IConfig {
  MEMPOOL: IConfig['MEMPOOL'];
  SYSLOG: IConfig['SYSLOG'];
  BISQ: IConfig['BISQ'];
  SOCKS5PROXY: IConfig['SOCKS5PROXY'];

  constructor() {
    const configs = this.merge(configFromFile, defaults);
    this.MEMPOOL = configs.MEMPOOL;
    this.SYSLOG = configs.SYSLOG;
    this.BISQ = configs.BISQ;
    this.SOCKS5PROXY = configs.SOCKS5PROXY;
  }

  merge = (...objects: object[]): IConfig => {
    // @ts-ignore
    return objects.reduce((prev, next) => {
      Object.keys(prev).forEach(key => {
        next[key] = { ...next[key], ...prev[key] };
      });
      return next;
    });
  }
}

export default new Config();
