const bisqNetwork = ["bisq"];

const emptyCodeSample = {
  esModule: [],
  commonJS: [],
  curl: [],
  response: ``
};

const showJsExamplesDefault = { "": true, "testnet": true, "signet": true, "liquid": true, "liquidtestnet": false, "bisq": true };

export const restApiDocsData = [
  {
    type: "category",
    category: "general",
    fragment: "general",
    title: "General",
    showConditions: bisqNetwork
  },
  {
    type: "endpoint",
    category: "general",
    httpRequestMethod: "GET",
    fragment: "get-stats",
    title: "GET Stats",
    description: {
      default: "Returns statistics about all Bisq transactions."
    },
    urlString: "/stats",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          commonJS: `
        const { %{0}: { statistics } } = mempoolJS();

        const stats = await statistics.getStats();

        document.getElementById("result").textContent = JSON.stringify(stats, undefined, 2);
          `,
          esModule: `
  const { %{0}: { statistics } } = mempoolJS();

  const stats = await statistics.getStats();
  console.log(stats);
          `,
          curl: `/stats`,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: [],
          commonJS: [],
          curl: [],
          response: `{
  addresses: 213825,
  minted: 6148323.75,
  burnt: 1830262.66,
  spent_txos: 215705,
  unspent_txos: 2572
}`
        },
      }
    }
  },
  {
    type: "category",
    category: "markets",
    fragment: "markets",
    title: "Markets",
    showConditions: ["bisq"]
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-currencies",
    title: "GET Market Currencies",
    description: {
      default: "Provides list of available currencies for a given base currency."
    },
    urlString: "/markets/currencies",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/currencies`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const currencies = await markets.getCurrencies();

        document.getElementById("result").textContent = JSON.stringify(currencies, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const currencies = await markets.getCurrencies();
  console.log(currencies);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: [],
          commonJS: [],
          curl: [],
          response: `{
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    precision: 8,
    _type: 'crypto'
  }
  ...
}`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-depth",
    title: "GET Market Depth",
    description: {
      default: "Provides list of open offer prices for a single market."
    },
    urlString: "/markets/depth?market=[:market]",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/depth?market=%{1}`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const market = "%{1}";

        const depth = await markets.getDepth({ market });

        document.getElementById("result").textContent = JSON.stringify(depth, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const market = "%{1}";

  const depth = await markets.getDepth({ market });
  console.log(depth);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD'],
          commonJS: ['BTC_USD'],
          curl: ['BTC_USD'],
          response: `{
  btc_usd: {
    buys: [
      '4.56941560',
      ...
    ],
    sells: [
      '4.54668218',
      ...
    ]
  }
}`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-hloc",
    title: "GET Market HLOC",
    description: {
      default: "Provides hi/low/open/close data for a given market. This can be used to generate a candlestick chart."
    },
    urlString: "/markets/hloc?market=[:market]",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/hloc?market=%{1}`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const market = "%{1}";

        const hloc = await markets.getHloc({ market });

        document.getElementById("result").textContent = JSON.stringify(hloc, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const market = "%{1}";

  const hloc = await markets.getHloc({ market });
  console.log(hloc);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD'],
          commonJS: ['BTC_USD'],
          curl: ['BTC_USD'],
          response: `[
  {
    period_start: 1609459200,
    open: '30448.18510000',
    close: '45717.81750000',
    high: '77700.00000000',
    low: '27500.00000000',
    avg: '44613.01158471',
    volume_right: '4923536.57150000',
    volume_left: '110.36100000'
  }
  ...
]`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-markets",
    title: "GET Markets",
    description: {
      default: "Provides list of available markets."
    },
    urlString: "/markets/markets",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/markets`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const allMarkets = await markets.getMarkets();

        document.getElementById("result").textContent = JSON.stringify(allMarkets, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const allMarkets = await markets.getMarkets();
  console.log(allMarkets);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD'],
          commonJS: ['BTC_USD'],
          curl: ['BTC_USD'],
          response: `{
    btc_brl: {
      pair: 'btc_brl',
      lname: 'Bitcoin',
      rname: 'Brazilian Real',
      lsymbol: 'BTC',
      rsymbol: 'BRL',
      lprecision: 8,
      rprecision: 2,
      ltype: 'crypto',
      rtype: 'fiat',
      name: 'Bitcoin/Brazilian Real'
    },
    ...
}`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-offers",
    title: "GET Market Offers",
    description: {
      default: "Provides list of open offer details for a single market."
    },
    urlString: "/markets/offers?market=[:market]",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/offers?market=%{1}`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const market = "%{1}";

        const offers = await markets.getOffers({ market });

        document.getElementById("result").textContent = JSON.stringify(offers, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const market = "%{1}";

  const offers = await markets.getOffers({ market });
  console.log(offers);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD'],
          commonJS: ['BTC_USD'],
          curl: ['BTC_USD'],
          response: `{
  btc_usd: {
    buys: [
      {
        offer_id: "ORHL1BE-0c193d04-be60-4657-ba42-cc172bb4ae5d-172",
        offer_date: 1630207815462,
        direction: "BUY",
        min_amount: "0.00500000",
        amount: "0.01500000",
        price: "50030.24770000",
        volume: "750.45370000",
        payment_method: "AMAZON_GIFT_CARD",
        offer_fee_txid: null
        },
        ...
    ],
    sells: [
      {
        offer_id: "nswiwkre-7676d5e6-e808-4c47-9c51-d5708e465ad5-172",
        offer_date: 1630320354509,
        direction: "SELL",
        min_amount: "0.04170000",
        amount: "0.04170000",
        price: "49534.89880000",
        volume: "2065.60520000",
        payment_method: "CASH_DEPOSIT",
        offer_fee_txid: null
        },
        ...
    ]
  }
}`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-ticker",
    title: "GET Market Ticker",
    description: {
      default: "Provides 24-hour price ticker for single market or all markets."
    },
    urlString: "/markets/ticker?market=[:market]",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/ticker?market=%{1}`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const market = "%{1}";

        const ticker = await markets.getTicker({ market });

        document.getElementById("result").textContent = JSON.stringify(ticker, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const market = "%{1}";

  const ticker = await markets.getTicker({ market });
  console.log(ticker);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD'],
          commonJS: ['BTC_USD'],
          curl: ['BTC_USD'],
          response: `{
  last: "53923.20570000",
  high: "53923.20570000",
  low: "48137.67410000",
  volume_left: "0.27160000",
  volume_right: "13593.92070000",
  buy: "48118.52400000",
  sell: "49555.63750000"
}`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-trades",
    title: "GET Market Trades",
    description: {
      default: "Provides list of completed trades for a single market."
    },
    urlString: "/markets/trades?market=[:market]&limit=[:limit]",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/trades?market=%{1}&limit=%{2}`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const market = "%{1}";

        const trades = await markets.getTrades({ market, limit: %{2} });

        document.getElementById("result").textContent = JSON.stringify(trades, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const market = "%{1}";

  const trades = await markets.getTrades({ market, limit: %{2} });
  console.log(trades);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD', '1'],
          commonJS: ['BTC_USD', '1'],
          curl: ['BTC_USD', '1'],
          response: `[
  {
    price: "53923.20570000",
    amount: "0.00500000",
    volume: "269.61600000",
    payment_method: "CLEAR_X_CHANGE",
    trade_date: 1630646161647
  }
]`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "markets",
    httpRequestMethod: "GET",
    fragment: "get-market-volumes",
    title: "GET Market Volumes",
    description: {
      default: "Provides periodic volume data in terms of base currency for one or all markets."
    },
    urlString: "/markets/volumes?basecurrency=[:basecurrency]",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/markets/volumes?markets=%{1}`,
          commonJS: `
        const { %{0}: { markets } } = mempoolJS();

        const market = "%{1}";

        const volumes = await markets.getVolumes({ market });

        document.getElementById("result").textContent = JSON.stringify(volumes, undefined, 2);
        `,
          esModule: `
  const { %{0}: { markets } } = mempoolJS();

  const market = "%{1}";

  const volumes = await markets.getVolumes({ market });
  console.log(volumes);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['BTC_USD', 'BTC'],
          commonJS: ['BTC_USD', 'BTC'],
          curl: ['BTC_USD', 'BTC'],
          response: `[
  {
    period_start: 1451606400,
    num_trades: 1923,
    volume: "1095.22050000"
  },
  ...
]`,
        },
      }
    }
  },
  {
    type: "category",
    category: "addresses",
    fragment: "addresses",
    title: "Addresses",
    showConditions: bisqNetwork
  },
  {
    type: "endpoint",
    category: "addresses",
    httpRequestMethod: "GET",
    fragment: "get-address",
    title: "GET Address",
    description: {
      default: "Returns details about an address. Available fields: <code>address</code>, <code>chain_stats</code>, and <code>mempool_stats</code>. <code>chain_stats</code> and <code>mempool_stats</code> each contain an object with <code>tx_count</code>, <code>funded_txo_count</code>, <code>funded_txo_sum</code>, <code>spent_txo_count</code>, and <code>spent_txo_sum</code>."
    },
    urlString: "/address/:address",
    showConditions: bisqNetwork,
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/address/%{1}`,
          commonJS: `
        const { %{0}: { addresses } } = mempoolJS();

        const address = '%{1}';
        const myAddress = await addresses.getAddress({ address });

        document.getElementById("result").textContent = JSON.stringify(myAddress, undefined, 2);
        `,
          esModule: `
  const { %{0}: { addresses } } = mempoolJS();

  const address = '%{1}';
  const myAddress = await addresses.getAddress({ address });
  console.log(myAddress);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: [`B1DgwRN92rdQ9xpEVCdXRfgeqGw9X4YtrZz`],
          commonJS: [`B1DgwRN92rdQ9xpEVCdXRfgeqGw9X4YtrZz`],
          curl: [`B1DgwRN92rdQ9xpEVCdXRfgeqGw9X4YtrZz`],
          response: `[
  {
    "txVersion": "1",
    "id": "d6f0a6fd191ac907ff88fc51af91cae8d50e596a846952ffa0ad0cea84eedc9a",
    "blockHeight": 679129,
    "blockHash": "00000000000000000001328850b0482312325f7f4abd5457e45d37cad664675d",
    "time": 1618369311000,
    "inputs": [ ... ],
    "outputs": [ ... ],
    "txType": "PAY_TRADE_FEE",
    "txTypeDisplayString": "Pay trade fee",
    "burntFee": 6,
    "invalidatedBsq": 0,
    "unlockBlockHeight": 0
  },
  ...
]`
        },
      }
    }
  },
  {
    type: "category",
    category: "blocks",
    fragment: "blocks",
    title: "Blocks",
    showConditions: bisqNetwork
  },
  {
    type: "endpoint",
    category: "blocks",
    httpRequestMethod: "GET",
    fragment: "get-block",
    title: "GET Block",
    description: {
      default: "Returns details about a block.",
      liquid: "Returns details about a block. Available fields: <code>id</code>, <code>height</code>, <code>version</code>, <code>timestamp</code>, <code>bits</code>, <code>nonce</code>, <code>merkle_root</code>, <code>tx_count</code>, <code>size</code>, <code>weight</code>,<code>proof</code>, and <code>previousblockhash</code>."
    },
    urlString: "/block/:hash",
    showConditions: bisqNetwork,
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/block/%{1}`,
          commonJS: `
        const { %{0}: { blocks } } = mempoolJS();

        const hash = '%{1}';
        const block = await blocks.getBlock({ hash });

        document.getElementById("result").textContent = JSON.stringify(block, undefined, 2);
        `,
          esModule: `
  const { %{0}: { blocks } } = mempoolJS();

  const hash = '%{1}';
  const block = await blocks.getBlock({ hash });
  console.log(block);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['0000000000000000000b24f70ed27da8b282b050f38e20831923211a1f7266d5'],
          commonJS: ['0000000000000000000b24f70ed27da8b282b050f38e20831923211a1f7266d5'],
          curl: ['0000000000000000000b24f70ed27da8b282b050f38e20831923211a1f7266d5'],
          response: `{
  height: 698746,
  time: 1630621494000,
  hash: "0000000000000000000b24f70ed27da8b282b050f38e20831923211a1f7266d5",
  previousBlockHash: "000000000000000000039cd226a99c125ee3004e9d585b04e2ccceccddef7547",
  txs: []
}`
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "blocks",
    httpRequestMethod: "GET",
    fragment: "get-block-tip-height",
    title: "GET Block Tip Height",
    description: {
      default: "Returns the height of the last block."
    },
    urlString: "/blocks/tip/height",
    showConditions: bisqNetwork,
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/blocks/tip/height`,
          commonJS: `
        const { %{0}: { blocks } } = mempoolJS();

        const blocksTipHeight = await blocks.getBlocksTipHeight();

        document.getElementById("result").textContent = JSON.stringify(blocksTipHeight, undefined, 2);
        `,
          esModule: `
  const { %{0}: { blocks } } = mempoolJS();

  const blocksTipHeight = await blocks.getBlocksTipHeight();
  console.log(blocksTipHeight);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: [''],
          commonJS: [''],
          curl: [''],
          response: `698765`
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "blocks",
    httpRequestMethod: "GET",
    fragment: "get-blocks",
    title: "GET Blocks",
    description: {
      default: "<p>Returns the past <code>n</code> blocks with BSQ transactions starting <code>m</code> blocks ago.</p><p>Assume a block height of 700,000. Query <code>/blocks/0/10</code> for the past 10 blocks before 700,000 with BSQ transactions. Query <code>/blocks/1000/10</code> for the past 10 blocks before 699,000 with BSQ transactions."
    },
    urlString: "/blocks/:m/:n",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/blocks/%{1}/%{2}`,
          commonJS: `
        const { %{0}: { blocks } } = mempoolJS();

        const getBlocks = await blocks.getBlocks({ index: %{1}, length: %{2} });

        document.getElementById("result").textContent = JSON.stringify(getBlocks, undefined, 2);
        `,
          esModule: `
  const { %{0}: { blocks } } = mempoolJS();

  const getBlocks = await blocks.getBlocks({ index: %{1}, length: %{2} });
  console.log(getBlocks);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleLiquidTestnet: emptyCodeSample,
        codeSampleBisq: {
          esModule: ['0', '5'],
          commonJS: ['0', '5'],
          curl: ['0', '5'],
          response: `[
  {
    "height": 739030,
    "time": 1654203258000,
    "hash": "000000000000000000036bc04416ddeec264cbb977a9cd9e454897acb547b601",
    "previousBlockHash": "00000000000000000000f49261617b589d76e5e70529ea1d4c16f3e19ddcb8ef",
    "txs": [ ... ],
  },
  {
    "height": 739029,
    "time": 1654203236000,
    "hash": "00000000000000000000f49261617b589d76e5e70529ea1d4c16f3e19ddcb8ef",
    "previousBlockHash": "00000000000000000008dd87e9486cd0d71c5d84e452432bab33c2a0cbaa31ce",
    "txs": [ ... ],
  },
  {
    "height": 739025,
    "time": 1654199569000,
    "hash": "000000000000000000021e9ce82dec208af75807f92a9b1d9dae91f2b4d40e24",
    "previousBlockHash": "00000000000000000002db644c025a76464b466d25900402452b07213b30c40b",
    "txs": [ ... ]
  },
  {
    "height": 739023,
    "time": 1654198597000,
    "hash": "0000000000000000000702ce10250a46bea4155ca7acb869f3ea92c1e3a68bc5",
    "previousBlockHash": "00000000000000000002b3d6c1adc5676262ded84181982f88dbd357b9f9d1ec",
    "txs": [ ... ]
  },
  {
    "height": 739020,
    "time": 1654197263000,
    "hash": "000000000000000000046eb46ad941028381d3534c35658f9c80de0641dbbb31",
    "previousBlockHash": "000000000000000000073f1c49b4c4895f3fa6b866d1e21ab8b22f3f9318b42f",
    "txs": [ ... ]
  }
]`
        },
      }
    }
  },
  {
    type: "category",
    category: "transactions",
    fragment: "transactions",
    title: "Transactions",
    showConditions: bisqNetwork
  },
  {
    type: "endpoint",
    category: "transactions",
    httpRequestMethod: "GET",
    fragment: "get-transaction",
    title: "GET Transaction",
    description: {
      default: "Returns details about a transaction. Available fields: <code>txid</code>, <code>version</code>, <code>locktime</code>, <code>size</code>, <code>weight</code>, <code>fee</code>, <code>vin</code>, <code>vout</code>, and <code>status</code>."
    },
    urlString: "/tx/:txid",
    showConditions: bisqNetwork,
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/tx/%{1}`,
          commonJS: `
        const { %{0}: { transactions } } = mempoolJS();

        const txid = '%{1}';
        const tx = await transactions.getTx({ txid });

        document.getElementById("result").textContent = JSON.stringify(tx, undefined, 2);
        `,
          esModule: `
  const { %{0}: { transactions } } = mempoolJS();

  const txid = '%{1}';
  const tx = await transactions.getTx({ txid });
  console.log(tx);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: [`98a598aeea121ea061dc713d1547363358974191c257d3b563bbf2a1706ff44e`],
          commonJS: [`98a598aeea121ea061dc713d1547363358974191c257d3b563bbf2a1706ff44e`],
          curl: [`98a598aeea121ea061dc713d1547363358974191c257d3b563bbf2a1706ff44e`],
          response: `{
  txid: "98a598aeea121ea061dc713d1547363358974191c257d3b563bbf2a1706ff44e",
  version: 1,
  locktime: 0,
  vin: [],
  vout: [],
  size: 402,
  weight: 957,
  fee: 2390,
  status: {
    confirmed: true,
    block_height: 698788,
    block_hash: "00000000000000000005bfe17b41395bed53565022e0c98965b15ec1d00b1f31",
    block_time: 1630645738
  }
}`,
        },
      }
    }
  },
  {
    type: "endpoint",
    category: "transactions",
    httpRequestMethod: "GET",
    fragment: "get-transactions",
    title: "GET Transactions",
    description: {
      default: "Returns :length of latest Bisq transactions, starting from :index."
    },
    urlString: "/txs/:index/:length",
    showConditions: ["bisq"],
    showJsExamples: showJsExamplesDefault,
    codeExample: {
      default: {
        codeTemplate: {
          curl: `/txs/%{1}/%{2}`,
          commonJS: `
        const { %{0}: { transactions } } = mempoolJS();

        const txs = await transactions.getTxs({ index: %{1}, length: %{2} });

        document.getElementById("result").textContent = JSON.stringify(txs, undefined, 2);
        `,
          esModule: `
  const { %{0}: { transactions } } = mempoolJS();

  const txs = await transactions.getTxs({ index: %{1}, length: %{2} });
  console.log(txStatus);
          `,
        },
        codeSampleMainnet: emptyCodeSample,
        codeSampleTestnet: emptyCodeSample,
        codeSampleSignet: emptyCodeSample,
        codeSampleLiquid: emptyCodeSample,
        codeSampleBisq: {
          esModule: [`0`, '1'],
          commonJS: [`0`, '1'],
          curl: [`0`, '1'],
          response: `[
  {
    txVersion: "1",
    id: "be1b2932155c012bec79bbd0f7cf7db32a4a35859dcb7b70f5d35fea581ac30a",
    blockHeight: 698808,
    blockHash: "0000000000000000000bf9461e8e0b8e077bcc0e8fe0f55483a7fd5d0860336c",
    time: 1630658066000,
    inputs: [],
    outputs: [],
    txType: "PAY_TRADE_FEE",
    txTypeDisplayString: "Pay trade fee",
    burntFee: 609,
    invalidatedBsq: 0,
    unlockBlockHeight: 0
  }
]`,
        },
      }
    }
  },
];


