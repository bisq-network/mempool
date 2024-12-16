import { Currencies, OffersData, TradesData, Depth, Currency, Interval, HighLowOpenClose,
  Markets, Offers, Offer, BisqTrade, MarketVolume, Tickers, Ticker, SummarizedIntervals, SummarizedInterval } from './interfaces';
import { Common } from '../common';
import logger from '../../logger';

const strtotime = require('./strtotime');

class BisqMarketsApi {
  private cryptoCurrencyData: Currency[] = [];
  private fiatCurrencyData: Currency[] = [];
  private activeCryptoCurrencyData: Currency[] = [];
  private activeFiatCurrencyData: Currency[] = [];
  private offersData: OffersData[] = [];
  private tradesData: TradesData[] = [];
  private fiatCurrenciesIndexed: { [code: string]: true } = {};
  private allCurrenciesIndexed: { [code: string]: Currency } = {};
  private tradeDataByMarket: { [market: string]: TradesData[] } = {};
  private tickersCache: Ticker | Tickers | null = null;
  private priceUpdateCallbackFunction: ((price: number) => void) | undefined;
  public bsqPrice: number = 0;

  constructor() { }

  setPriceCallbackFunction(fn: (price: number) => void) {
    this.priceUpdateCallbackFunction = fn;
  }

  setOffersData(offers: OffersData[]) {
    logger.debug(`setOffersData: Updating Bisq Market Offers Data with ${offers.length} records.`);
    this.offersData = offers;
  }

  setTradesData(trades: TradesData[]) {
    var tradesPre = this.tradesData.length;
    trades.forEach((trade) => {
      // ignore trade stats older than two years (performance reasons)
      var oneYear = 1000*60*60*24*365*2;
        if (trade.tradeDate > new Date().getTime() - oneYear) {
        trade._market = trade.currencyPair.toLowerCase().replace('/', '_');
        if (!this.tradeDataByMarket[trade._market]) {
          this.tradeDataByMarket[trade._market] = [];
        }
        this.tradeDataByMarket[trade._market].push(trade);
        this.tradesData.push(trade);
      }
    });
    this.tradesData = this.tradesData.sort(function(b, a) {
      return (a.tradeDate < b.tradeDate) ? -1 : (a.tradeDate > b.tradeDate) ? 1 : 0;
    });
    logger.info(`Updated Bisq Market Trades Data, #${tradesPre} -> ${this.tradesData.length} records.  Newest: ${this.getNewestTradeDate()}`);
    this.updateBsqPrice();  // whenever trades change, recalc BSQ price average
  }

  setCurrencyData(currencies: Currency[]) {
    currencies.push( {'code': "BTC",'name': "Bitcoin", 'precision': 8, '_type': "crypto"} );
    this.cryptoCurrencyData = currencies.filter( (x) => x._type === "crypto" );
    this.fiatCurrencyData = currencies.filter( (x) => x._type === "fiat" );
    this.activeCryptoCurrencyData = currencies.filter( (x) => x._type === "crypto" );
    this.activeFiatCurrencyData = currencies.filter( (x) => x._type === "fiat" );
    this.fiatCurrenciesIndexed = {};
    this.allCurrenciesIndexed = {};

    logger.debug(`setCurrencyData: Updating Bisq Market Currency Data with ${this.fiatCurrencyData.length} fiat and ${this.cryptoCurrencyData.length} cryptos.`);

    this.fiatCurrencyData.forEach((currency) => {
      currency._type = 'fiat';
      this.fiatCurrenciesIndexed[currency.code] = true;
      this.allCurrenciesIndexed[currency.code] = currency;
    });
    this.cryptoCurrencyData.forEach((currency) => {
       currency._type = 'crypto';
       this.allCurrenciesIndexed[currency.code] = currency;
    });
  }

  updateCache() {
    logger.debug("BisqMarketsApi updateCache");
    this.tickersCache = null;
    this.tickersCache = this.getTicker();
  }

  private updateBsqPrice() {
    var trades: BisqTrade[] = this.getTrades("bsq_btc");
    const prices: number[] = [];
    trades.forEach((trade) => {
      prices.push(parseFloat(trade.price));
    });
    prices.sort((a, b) => a - b);
    this.bsqPrice = Common.median(prices);
    if (this.priceUpdateCallbackFunction) {
      this.priceUpdateCallbackFunction(this.bsqPrice * 100000000);  // for websockethandler storage
    }
    logger.debug(`Updated Bisq market price: ${this.bsqPrice}, ${prices.length} reference prices used.`);
  }

  getCurrencies(type: 'crypto' | 'fiat' | 'active' | 'all' = 'all',): Currencies {
    let currencies: Currency[];

    switch (type) {
      case 'fiat':
        currencies = this.fiatCurrencyData;
        break;
      case 'crypto':
        currencies = this.cryptoCurrencyData;
        break;
      case 'active':
        currencies = this.activeCryptoCurrencyData.concat(this.activeFiatCurrencyData);
        break;
      case 'all':
      default:
        currencies = this.cryptoCurrencyData.concat(this.fiatCurrencyData);
    }
    const result = {};
    currencies.forEach((currency) => {
      result[currency.code] = currency;
    });
    return result;
  }

  getDepth(
    market: string,
  ): Depth {
    const currencyPair = market.replace('_', '/').toUpperCase();

    const buys = this.offersData
      .filter((offer) => offer.currencyPair === currencyPair && offer.primaryMarketDirection === 'BUY')
      .map((offer) => offer.price)
      .sort((a, b) => b - a)
      .map((price) => this.intToBtc(price));

    const sells = this.offersData
      .filter((offer) => offer.currencyPair === currencyPair && offer.primaryMarketDirection === 'SELL')
      .map((offer) => offer.price)
      .sort((a, b) => a - b)
      .map((price) => this.intToBtc(price));

    const result = {};
    result[market] = {
      'buys': buys,
      'sells': sells,
    };
    return result;
  }

  getOffers(
    market: string,
    direction?: 'buy' | 'sell',
  ): Offers {
    const currencyPair = market.replace('_', '/').toUpperCase();
    logger.warn(`getOffers: ${currencyPair}`);
    let buys: Offer[] | null = null;
    let sells: Offer[] | null = null;

    if (!direction || direction === 'buy') {
      buys = this.offersData
        .filter((offer) => offer.currencyPair === currencyPair && offer.primaryMarketDirection === 'BUY')
        .sort((a, b) => b.price - a.price)
        .map((offer) => this.offerDataToOffer(offer, market));
    }

    if (!direction || direction === 'sell') {
      sells = this.offersData
        .filter((offer) => offer.currencyPair === currencyPair && offer.primaryMarketDirection === 'SELL')
        .sort((a, b) => a.price - b.price)
        .map((offer) => this.offerDataToOffer(offer, market));
    }

    const result: Offers = {};
    result[market] = {
      'buys': buys,
      'sells': sells,
    };
    return result;
  }

  getMarkets(): Markets {
    var counter = 0;
    const allCurrencies = this.getCurrencies();

    const activeCurrencies = this.getCurrencies('active');
    const markets = {};

    for (const currency of Object.keys(activeCurrencies)) {
      if (allCurrencies[currency].code === 'BTC') {
        continue;
      }
      const isFiat = allCurrencies[currency]._type === 'fiat';
      const pmarketname = allCurrencies['BTC']['name'];

      const lsymbol = isFiat ? 'BTC' : currency;
      const rsymbol = isFiat ? currency : 'BTC';
      const lname = isFiat ? pmarketname : allCurrencies[currency].name;
      const rname = isFiat ? allCurrencies[currency].name : pmarketname;
      const ltype = isFiat ? 'crypto' : allCurrencies[currency]._type;
      const rtype = isFiat ? 'fiat' : 'crypto';
      const lprecision = 8;
      const rprecision = isFiat ? 2 : 8;
      const pair = lsymbol.toLowerCase() + '_' + rsymbol.toLowerCase();

      markets[pair] = {
        'pair': pair,
        'lname': lname,
        'rname': rname,
        'lsymbol': lsymbol,
        'rsymbol': rsymbol,
        'lprecision': lprecision,
        'rprecision': rprecision,
        'ltype': ltype,
        'rtype': rtype,
        'name': lname + '/' + rname,
      };
      counter++;
    }
    logger.debug(`getMarkets returning ${Object.keys(markets).length} items`);
    return markets;
  }

  getTrades(
    market: string,
    timestamp_from?: number,
    timestamp_to?: number,
    trade_id_from?: string,
    trade_id_to?: string,
    direction?: 'buy' | 'sell',
    limit: number = 100,
    sort: 'asc' | 'desc' = 'desc',
  ): BisqTrade[] {
    limit = Math.min(limit, 2000);
    const _market = market === 'all' ? undefined : market;

    if (!timestamp_from) {
      timestamp_from = new Date('2016-01-01').getTime() / 1000;
    }
    if (!timestamp_to) {
      timestamp_to = new Date().getTime() / 1000;
    }

    const matches = this.getTradesByCriteria(_market, timestamp_to, timestamp_from,
      trade_id_to, trade_id_from, direction, sort, limit, false);

    if (sort === 'asc') {
      matches.sort((a, b) => a.tradeDate - b.tradeDate);
    } else {
      matches.sort((a, b) => b.tradeDate - a.tradeDate);
    }

    return matches.map((trade) => {
      const bsqTrade: BisqTrade = {
        direction: trade.primaryMarketDirection,
        price: trade._tradePriceStr,
        amount: trade._tradeAmountStr,
        volume: trade._tradeVolumeStr,
        payment_method: trade.paymentMethod,
        trade_id: trade.offerId,
        trade_date: trade.tradeDate,
      };
      if (market === 'all') {
        bsqTrade.market = trade._market;
      }
      return bsqTrade;
    });
  }

  getVolumes(
    market?: string,
    timestamp_from?: number,
    timestamp_to?: number,
    interval: Interval = 'auto',
    milliseconds?: boolean,
    timestamp: 'no' | 'yes' = 'yes',
  ): MarketVolume[] {

    if (milliseconds) {
      timestamp_from = timestamp_from ? timestamp_from / 1000 : timestamp_from;
      timestamp_to = timestamp_to ? timestamp_to / 1000 : timestamp_to;
    }
    if (!timestamp_from) {
      timestamp_from = new Date('2016-01-01').getTime() / 1000;
    }
    if (!timestamp_to) {
      timestamp_to = new Date().getTime() / 1000;
    }

    const trades = this.getTradesByCriteria(market, timestamp_to, timestamp_from,
      undefined, undefined, undefined, 'asc', Number.MAX_SAFE_INTEGER);

    if (interval === 'auto') {
      const range = timestamp_to - timestamp_from;
      interval = this.getIntervalFromRange(range);
    }

    const intervals: any = {};
    const marketVolumes: MarketVolume[] = [];

    for (const trade of trades) {
      const traded_at = trade['tradeDate'] / 1000;
      const interval_start = this.intervalStart(traded_at, interval);

      if (!intervals[interval_start]) {
        intervals[interval_start] = {
          'volume': 0,
          'num_trades': 0,
        };
      }

      const period = intervals[interval_start];
      period['period_start'] = interval_start;
      period['volume'] += this.fiatCurrenciesIndexed[trade.currency] ? trade._tradeAmount : trade._tradeVolume;
      period['num_trades']++;
    }

    for (const p in intervals) {
      if (intervals.hasOwnProperty(p)) {
        const period = intervals[p];
        marketVolumes.push({
          period_start: timestamp === 'no' ? new Date(period['period_start'] * 1000).toISOString() : period['period_start'],
          num_trades: period['num_trades'],
          volume: this.intToBtc(period['volume']),
        });
      }
    }

    logger.debug(`getVolumes returning ${marketVolumes.length} items.`);
    return marketVolumes;
  }

  getTicker(
    market?: string,
  ): Tickers | Ticker | null {

    if (market) {
      return this.getTickerFromMarket(market);
    }

    if (this.tickersCache) {
      logger.debug(`returning ${Object.keys(this.tickersCache).length} tickers from cache`);
      return this.tickersCache;
    }

    const allMarkets = this.getMarkets();
    const tickers = {};
    for (const m in allMarkets) {
      if (allMarkets.hasOwnProperty(m)) {
        tickers[allMarkets[m].pair] = this.getTickerFromMarket(allMarkets[m].pair);
      }
    }
    logger.debug(`returning ${Object.keys(tickers).length} tickers`);
    return tickers;
  }

  getTickerFromMarket(market: string): Ticker | null {
    let ticker: Ticker;
    const timestamp_from = strtotime('-24 hour');
    const timestamp_to = new Date().getTime() / 1000;

    const allCurrencies = this.getCurrencies();
    const currencyRight = allCurrencies[market.split('_')[1].toUpperCase()];

    const trades = this.getTradesByCriteria(market, timestamp_to, timestamp_from,
      undefined, undefined, undefined, 'asc', Number.MAX_SAFE_INTEGER);
    const periods: SummarizedInterval[] = Object.values(this.getTradesSummarized(trades, timestamp_from));

    const currencyLeft = allCurrencies[market.split('_')[0].toUpperCase()];
    const livePrice = NaN; //bisqPriceService.getPrice(currencyRight.code === 'BTC' ? currencyLeft.code : currencyRight.code);
    if (periods[0]) {
      ticker = {
        'last': (isNaN(livePrice) ? this.intToBtc(periods[0].close) : '' + livePrice),
        'high': this.intToBtc(periods[0].high),
        'low': this.intToBtc(periods[0].low),
        'volume_left': this.intToBtc(periods[0].volume_left),
        'volume_right': this.intToBtc(periods[0].volume_right),
        'buy': null,
        'sell': null,
      };
    } else {
      var lastTradePrice = this.intToBtc(0);
      const lastTrade = this.tradeDataByMarket[market];
      if (lastTrade) {
         lastTradePrice = this.intToBtc(
            lastTrade[0].primaryMarketTradePrice * Math.pow(10, 8 - currencyRight.precision));
      }
      ticker = {
        'last': (isNaN(livePrice) ? lastTradePrice : '' + livePrice),
        'high': lastTradePrice,
        'low': lastTradePrice,
        'volume_left': '0',
        'volume_right': '0',
        'buy': null,
        'sell': null,
      };
    }

    const timestampFromMilli = timestamp_from * 1000;
    const timestampToMilli = timestamp_to * 1000;

    const currencyPair = market.replace('_', '/').toUpperCase();
    const offersData = this.offersData.slice().sort((a, b) => a.price - b.price);

    const buy = offersData.find((offer) => offer.currencyPair === currencyPair
                                          && offer.primaryMarketDirection === 'BUY'
                                          && offer.date >= timestampFromMilli
                                          && offer.date <= timestampToMilli
                                        );
    const sell = offersData.find((offer) => offer.currencyPair === currencyPair
                                            && offer.primaryMarketDirection === 'SELL'
                                            && offer.date >= timestampFromMilli
                                            && offer.date <= timestampToMilli
                                          );

    if (buy) {
      ticker.buy = this.intToBtc(buy.primaryMarketPrice * Math.pow(10, 8 - currencyRight.precision));
    }
    if (sell) {
      ticker.sell = this.intToBtc(sell.primaryMarketPrice * Math.pow(10, 8 - currencyRight.precision));
    }

    return ticker;
  }

  getHloc(
    market: string,
    interval: Interval = 'auto',
    timestamp_from?: number,
    timestamp_to?: number,
    milliseconds?: boolean,
    timestamp: 'no' | 'yes' = 'yes',
  ): HighLowOpenClose[] {
    if (milliseconds) {
      timestamp_from = timestamp_from ? timestamp_from / 1000 : timestamp_from;
      timestamp_to = timestamp_to ? timestamp_to / 1000 : timestamp_to;
    }
    if (!timestamp_from) {
      timestamp_from = new Date('2016-01-01').getTime() / 1000;
    }
    if (!timestamp_to) {
      timestamp_to = new Date().getTime() / 1000;
    }

    const trades = this.getTradesByCriteria(market, timestamp_to, timestamp_from,
      undefined, undefined, undefined, 'asc', Number.MAX_SAFE_INTEGER);

    if (interval === 'auto') {
      const range = timestamp_to - timestamp_from;
      interval = this.getIntervalFromRange(range);
    }

    const intervals = this.getTradesSummarized(trades, timestamp_from, interval);

    const hloc: HighLowOpenClose[] = [];

    for (const p in intervals) {
      if (intervals.hasOwnProperty(p)) {
        const period = intervals[p];
        hloc.push({
          period_start: timestamp === 'no' ? new Date(period['period_start'] * 1000).toISOString() : period['period_start'],
          open: this.intToBtc(period['open']),
          close: this.intToBtc(period['close']),
          high: this.intToBtc(period['high']),
          low: this.intToBtc(period['low']),
          avg: this.intToBtc(period['avg']),
          volume_right: this.intToBtc(period['volume_right']),
          volume_left: this.intToBtc(period['volume_left']),
        });
      }
    }

    return hloc;
  }

  private getIntervalFromRange(range: number): Interval {
    // two days range loads minute data
    if (range <= 3600) {
      // up to one hour range loads minutely data
      return 'minute';
    } else if (range <= 1 * 24 * 3600) {
      // up to one day range loads half-hourly data
      return 'half_hour';
    } else if (range <= 3 * 24 * 3600) {
      // up to 3 day range loads hourly data
      return 'hour';
    } else if (range <= 7 * 24 * 3600) {
      // up to 7 day range loads half-daily data
      return 'half_day';
    } else if (range <= 60 * 24 * 3600) {
      // up to 2 month range loads daily data
      return 'day';
    } else if (range <= 12 * 31 * 24 * 3600) {
      // up to one year range loads weekly data
      return 'week';
    } else if (range <= 12 * 31 * 24 * 3600) {
      // up to 5 year range loads monthly data
      return 'month';
    } else {
      // greater range loads yearly data
      return 'year';
    }
  }

  getVolumesByTime(time: number): MarketVolume[] {
    const timestamp_from = new Date().getTime() / 1000 - time;
    const timestamp_to = new Date().getTime() / 1000;

    const trades = this.getTradesByCriteria(undefined, timestamp_to, timestamp_from,
      undefined, undefined, undefined, 'asc', Number.MAX_SAFE_INTEGER);

    const volumes: any = {};

    for (const trade of trades) {
      if (!volumes[trade._market]) {
        volumes[trade._market] = {
          'volume': 0,
          'num_trades': 0,
        };
      }

      volumes[trade._market]['volume'] += this.fiatCurrenciesIndexed[trade.currency] ? trade._tradeAmount : trade._tradeVolume;
      volumes[trade._market]['num_trades']++;
    }

    logger.debug(`VolumesByTime returning ${volumes.length} items.`);
    return volumes;
  }

  private getTradesSummarized(trades: TradesData[], timestamp_from: number, interval?: string): SummarizedIntervals {
    const intervals: any = {};
    const intervals_prices: any = {};

    for (const trade of trades) {
      const traded_at = trade.tradeDate / 1000;
      const interval_start = !interval ? timestamp_from : this.intervalStart(traded_at, interval);

      if (!intervals[interval_start]) {
        intervals[interval_start] = {
          'open': 0,
          'close': 0,
          'high': 0,
          'low': 0,
          'avg': 0,
          'volume_right': 0,
          'volume_left': 0,
        };
        intervals_prices[interval_start] = [];
      }
      const period = intervals[interval_start];
      const price = trade._tradePrice;

      if (!intervals_prices[interval_start]['leftvol']) {
        intervals_prices[interval_start]['leftvol'] = [];
      }
      if (!intervals_prices[interval_start]['rightvol']) {
        intervals_prices[interval_start]['rightvol'] = [];
      }

      intervals_prices[interval_start]['leftvol'].push(trade._tradeAmount);
      intervals_prices[interval_start]['rightvol'].push(trade._tradeVolume);

      if (price) {
        const plow = period['low'];
        period['period_start'] = interval_start;
        period['open'] = period['open'] || price;
        period['close'] = price;
        period['high'] = price > period['high'] ? price : period['high'];
        period['low'] = (plow && price > plow) ? period['low'] : price;
        period['avg'] = intervals_prices[interval_start]['rightvol'].reduce((p: number, c: number) => c + p, 0)
          / intervals_prices[interval_start]['leftvol'].reduce((c: number, p: number) => c + p, 0) * 100000000;
        period['volume_left'] += trade._tradeAmount;
        period['volume_right'] += trade._tradeVolume;
      }
    }
    return intervals;
  }

  public getOldestTradeDate(): number {
    const tradesDataSorted = this.tradesData.slice();
    let ts = tradesDataSorted.at(-1);
    if (ts) {
        return ts.tradeDate;
    }
    return 0;
  }

  public getNewestTradeDate(): number {
    const tradesDataSorted = this.tradesData.slice();
    let ts = tradesDataSorted.at(0);
    if (ts) {
        return ts.tradeDate;
    }
    return 0;
  }

  private getTradesByCriteria(
    market: string | undefined,
    timestamp_to: number,
    timestamp_from: number,
    trade_id_to: string | undefined,
    trade_id_from: string | undefined,
    direction: 'buy' | 'sell' | undefined,
    sort: string,
    limit: number,
    integerAmounts: boolean = true,
 ): TradesData[] {
    let trade_id_from_ts: number | null = null;
    let trade_id_to_ts: number | null = null;
    const allCurrencies = this.getCurrencies();

    const timestampFromMilli = timestamp_from * 1000;
    const timestampToMilli = timestamp_to * 1000;

    // note: the offer_id_from/to depends on iterating over trades in
    // descending chronological order.
    const tradesDataSorted = this.tradesData.slice();
    if (sort === 'asc') {
      tradesDataSorted.reverse();
    }

    let matches: TradesData[] = [];
    for (const trade of tradesDataSorted) {
      if (trade_id_from === trade.offerId) {
        trade_id_from_ts = trade.tradeDate;
      }
      if (trade_id_to === trade.offerId) {
        trade_id_to_ts = trade.tradeDate;
      }
      if (trade_id_to && trade_id_to_ts === null) {
        continue;
      }
      if (trade_id_from && trade_id_from_ts != null && trade_id_from_ts !== trade.tradeDate) {
        continue;
      }
      if (market && market !== trade._market) {
        continue;
      }
      if (timestampFromMilli && timestampFromMilli > trade.tradeDate) {
        continue;
      }
      if (timestampToMilli && timestampToMilli < trade.tradeDate) {
        continue;
      }
      if (direction && direction !== trade.direction.toLowerCase()) {
        continue;
      }

      // Filter out bogus trades with BTC/BTC or XXX/XXX market.
      // See github issue: https://github.com/bitsquare/bitsquare/issues/883
      const currencyPairs = trade.currencyPair.split('/');
      if (currencyPairs[0] === currencyPairs[1]) {
        continue;
      }

      const currencyLeft = allCurrencies[currencyPairs[0]];
      const currencyRight = allCurrencies[currencyPairs[1]];

      if (!currencyLeft || !currencyRight) {
        continue;
      }

      const tradePrice = trade.primaryMarketTradePrice * Math.pow(10, 8 - currencyRight.precision);
      const tradeAmount = trade.primaryMarketTradeAmount * Math.pow(10, 8 - currencyLeft.precision);
      const tradeVolume = trade.primaryMarketTradeVolume * Math.pow(10, 8 - currencyRight.precision);

      if (integerAmounts) {
        trade._tradePrice = tradePrice;
        trade._tradeAmount = tradeAmount;
        trade._tradeVolume = tradeVolume;
        trade._offerAmount = trade.offerAmount;
      } else {
        trade._tradePriceStr = this.intToBtc(tradePrice);
        trade._tradeAmountStr = this.intToBtc(tradeAmount);
        trade._tradeVolumeStr = this.intToBtc(tradeVolume);
        trade._offerAmountStr = this.intToBtc(trade.offerAmount);
      }

      matches.push(trade);

      if (matches.length >= limit) {
        break;
      }
    }

    if ((trade_id_from && !trade_id_from_ts) || (trade_id_to && !trade_id_to_ts)) {
      matches = [];
    }
    return matches;
  }

  private intervalStart(ts: number, interval: string): number {
    switch (interval) {
      case 'minute':
        return (ts - (ts % 60));
      case '10_minute':
        return (ts - (ts % 600));
      case 'half_hour':
        return (ts - (ts % 1800));
      case 'hour':
        return (ts - (ts % 3600));
      case 'half_day':
        return (ts - (ts % (3600 * 12)));
      case 'day':
        return strtotime('midnight today', ts);
      case 'week':
        return strtotime('midnight sunday last week', ts);
      case 'month':
        return strtotime('midnight first day of this month', ts);
      case 'year':
        return strtotime('midnight first day of january', ts);
      default:
        throw new Error('Unsupported interval');
    }
  }

  private offerDataToOffer(offer: OffersData, market: string): Offer {
    const currencyPairs = market.split('_');
    const currencyRight = this.allCurrenciesIndexed[currencyPairs[1].toUpperCase()];
    const currencyLeft = this.allCurrenciesIndexed[currencyPairs[0].toUpperCase()];
    const price = offer['primaryMarketPrice'] * Math.pow( 10, 8 - currencyRight['precision']);
    const amount = offer['primaryMarketAmount'] * Math.pow( 10, 8 - currencyLeft['precision']);
    const volume = offer['primaryMarketVolume'] * Math.pow( 10, 8 - currencyRight['precision']);

    return {
      offer_id: offer.id,
      offer_date: offer.date,
      direction: offer.primaryMarketDirection,
      min_amount: this.intToBtc(offer.minAmount),
      amount: this.intToBtc(amount),
      price: this.intToBtc(price),
      volume: this.intToBtc(volume),
      payment_method: offer.paymentMethod,
      offer_fee_txid: null,
    };
  }

  private intToBtc(val: number): string {
    return (val / 100000000).toFixed(8);
  }
}

export default new BisqMarketsApi();
