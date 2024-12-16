import config from '../../config';
import * as http from 'http';
import * as https from 'https';
import { BisqBlocks, BisqBlock, BisqTransaction, BisqStats, BisqTrade } from './interfaces';
import { Currency, OffersData, TradesData } from './interfaces';
import bisqMarket from './markets-api';
import pricesUpdater from '../../tasks/price-updater';
import backendInfo from '../backend-info';
import logger from '../../logger';

class Bisq {
  private stats: BisqStats = ({
    minted: 0,
    burnt: 0,
    addresses: 0,
    unspent_txos: 0,
    spent_txos: 0,
    height: 0,
    genesisHeight: 0,
    _bsqPrice: 0,
    _usdPrice: 0,
    _marketCap: 0
  });
  private blocks: BisqBlock[] = [];
  private allBlocks: BisqBlock[] = [];
  private blockIndex: { [hash: string]: BisqBlock } = {};
  private lastPollTimestamp: number = 0;
  private pendingQueries: Promise<string>[] = [];

  constructor() {}

  setPriceCallbackFunction(fn: (price: number) => void) {
    bisqMarket.setPriceCallbackFunction(fn);
  }

  public startBisqService(): void {
    logger.info('start bisq service (start)');
    this.$pollForNewData();  // obtains the current block height
    logger.info('start bisq service (end)');
  }

  public async $getTransaction(txId: string): Promise<BisqTransaction | undefined> {
    logger.info("getTransaction called from frontend");
    if (!this.isBisqConnected()) return undefined;
    var queriedTx = await this.$lookupBsqTx(txId);
    if (queriedTx !== undefined) {
        this.$fillMissingBlocksFromCache(queriedTx.blockHeight, 1);
    }
    return queriedTx;
  }

  public async $getTransactions(start: number, length: number, types: string[]): Promise<[BisqTransaction[], number]> {
    logger.info("getTransactions called from frontend");
    if (!this.isBisqConnected()) return [[], 0];
    var types2 = types.join("~")
    if (types2.length === 0) { types2 = "~"; }
    var queriedTx = await this.$lookupBsqTx2(start, length, types2);
    return [queriedTx, this.stats.unspent_txos+this.stats.spent_txos];
  }

  public async $getBlock(hash: string): Promise<BisqBlock | undefined> {
    logger.info(`getBlock called from frontend ${hash}`);
    var cached = this.blockIndex[hash];
    if (cached) {
        return cached;
    }
    if (!this.isBisqConnected()) return undefined;
    var queried = await this.$lookupBsqBlockByHash(hash);
    return queried;
  }

  public async $getAddress(hash: string): Promise<BisqTransaction[]> {
    logger.info(`getAddress called from frontend ${hash}`);
    if (!this.isBisqConnected()) return [];
    var queriedTx: BisqTransaction[] = await this.$lookupBsqTxForAddr(hash);
    return queriedTx;
  }

  public getLatestBlockHeight(): number {
    logger.info(`getLatestBlockHeight called from frontend`);
    return this.stats.height;
  }

  public getStats(): BisqStats {
    logger.info("getStats called from frontend");
    return this.stats;
  }

  public async $getBlocks(fromHeight: number, limit: number): Promise<[BisqBlock[], number]> {
    logger.info(`getBlocks called from frontend ${fromHeight} ${limit}`);
    let currentHeight = this.getLatestBlockHeight()-fromHeight;
    if (currentHeight > this.getLatestBlockHeight()) {
      limit -= currentHeight - this.getLatestBlockHeight();
      currentHeight = this.getLatestBlockHeight();
    }
    var returnBlocks: BisqBlock[] = [];
    if (currentHeight < 0) {
      return [returnBlocks, this.blocks.length];
    }
    returnBlocks = this.getRequiredBlocksFromCache(fromHeight, currentHeight, limit);
    if (returnBlocks.length === limit) {
      return [returnBlocks, this.stats.height - this.stats.genesisHeight];
    }

    await this.$fillMissingBlocksFromCache(currentHeight, limit);
    // now the cache should contain all the results needed
    returnBlocks = this.getRequiredBlocksFromCache(fromHeight, currentHeight, limit);
    return [returnBlocks, this.stats.height - this.stats.genesisHeight];
  }

  private async $pollForNewData() {
    this.lookupStats();  // obtains the current block height

    if (this.isBisqConnected() && new Date().getTime() - this.lastPollTimestamp > 60000) { // 1 minute
      this.lastPollTimestamp = new Date().getTime();
      this.pendingQueries.push(this.getCurrencies());
      this.pendingQueries.push(this.getOffers());
      this.pendingQueries.push(this.getTrades());
      Promise.allSettled(this.pendingQueries).then(results => {
        this.pendingQueries.length = 0;
        bisqMarket.updateCache();
      });
    }

    setTimeout(() => this.$pollForNewData(), 20000);
  }

  private isBisqConnected() : boolean {
    if (this.stats.height > 0)
      return true;
    logger.warn("bisq not connected!");
    return false;
  }

  private async $fillMissingBlocksFromCache(currentHeight: number, limit: number) {
    // now we must fill the missing cache elements
    for (let i = 0; i < limit && currentHeight >= 0; i++) {
      logger.info(`blocks in cache:${this.blocks.length}, looking for one with height=${currentHeight}`);
      let block = this.blocks.find((b) => b.height === currentHeight);
      if (!block) {
        // find by height, index on the fly, save in database
        logger.info(`not found in cache, calling lookupBsqBlockByHeight ${currentHeight} ${i}`);
        const block = await this.$lookupBsqBlockByHeight(currentHeight);
        this.allBlocks.push(block);
        this.allBlocks = this.allBlocks.sort((a,b) => {
          return b['height'] >= a['height'] ? 1 : -1;
        });
        this.blocks = this.allBlocks;
      }
      currentHeight--;
    }
    this.buildIndex();
  }

  private getRequiredBlocksFromCache(index: number, blockHeight: number, count: number) {
    const returnBlocks: BisqBlock[] = [];
    logger.info(`cache size:${this.blocks.length}, looking for starting height:${blockHeight} and count:${count}`);
    while (count > 0) {
      let block = this.blocks.find((b) => b.height === blockHeight);
      if (block === undefined || block.height !== blockHeight) {
        logger.debug(`returning incomplete results from cache lookup: ${returnBlocks.length} / ${count} remaining`);
        return returnBlocks; // cache miss, force caller to index
      } else {
        returnBlocks.push(block);
        ++index;
        --blockHeight;
        --count;
      }
    }
    logger.info(`found all ${returnBlocks.length} blocks in cache.`);
    return returnBlocks;
  }

  private buildIndex() {
    logger.info("buildIndex");
    this.allBlocks.forEach((block) => {
      if (!this.blockIndex[block.hash]) {
        this.blockIndex[block.hash] = block;
        logger.info(`set block index for ${block.hash}`);
      }
    });
    logger.info(`blocks:${this.blocks.length} blockIndex:${Object.keys(this.blockIndex).length}`);
  }

  private lookupStats() {
    const customPromise = this.makeApiCall('dao/get-bsq-stats');
    customPromise.then((buffer) => {
      try {
        const stats: BisqStats = JSON.parse(buffer)
        stats.minted /= 100.0;
        stats.burnt /= 100.0;
        stats._bsqPrice = bisqMarket.bsqPrice;
        stats._usdPrice = bisqMarket.bsqPrice * pricesUpdater.getLatestPrices()['USD'];
        stats._marketCap = stats._usdPrice * (stats.minted - stats.burnt);
        this.stats = stats;
        logger.debug(`stats: BSQ/BTC=${Bisq.FORMAT_BITCOIN(stats._bsqPrice)} BSQ/USD=${Bisq.FORMAT_USD(stats._usdPrice)} MktCap=${Bisq.FORMAT_USD(stats._marketCap)} height=${stats.height}`);
        if (this.stats !== undefined && this.blocks.length < 30) {
          // startup, pre-cache first page or so of blocks
          this.$fillMissingBlocksFromCache(this.stats.height, this.blocks.length + 10);
        } else if (this.stats !== undefined && this.blocks[0].height !== this.stats.height) {
          // cache a newly issued block
          this.$fillMissingBlocksFromCache(this.stats.height, 1);
        }
      } catch (e) { Bisq.LOG_RESTAPI_DATA_ERR(e); }
    })
    .catch(err => { Bisq.LOG_RESTAPI_ERR(err) });
  }

  private async $lookupBsqTx(txId: string) : Promise<BisqTransaction | undefined> {
    const customPromise = this.makeApiCall('transactions/get-bsq-tx', [txId]);
    var buffer = await customPromise;
    try {
      const tx: BisqTransaction = JSON.parse(buffer)
      return tx;
      } catch (e) { Bisq.LOG_RESTAPI_DATA_ERR(e); }
    return undefined;
  }

  private async $lookupBsqTx2(start: number, limit: number, types: string) : Promise<BisqTransaction[]> {
    const customPromise = this.makeApiCall('transactions/query-txs-paginated', [String(start), String(limit), types]);
    var buffer = await customPromise;
    const txs: BisqTransaction[] = JSON.parse(buffer)
    return txs;
  }

  private async $lookupBsqTxForAddr(addr: string) : Promise<BisqTransaction[]> {
    const customPromise = this.makeApiCall('transactions/get-bsq-tx-for-addr', [addr]);
    var buffer = await customPromise;
    const txs: BisqTransaction[] = JSON.parse(buffer)
    return txs;
  }

  private async $lookupBsqBlockByHeight(height: number) : Promise<BisqBlock> {
    const customPromise = this.makeApiCall('blocks/get-bsq-block-by-height', [String(height)]);
    var buffer = await customPromise;
    const block: BisqBlock = JSON.parse(buffer)
    return block;
  }

  private async $lookupBsqBlockByHash(hash: string) : Promise<BisqBlock | undefined> {
    const customPromise = this.makeApiCall('blocks/get-bsq-block-by-hash', [hash]);
    try {
      var buffer = await customPromise;
      const block: BisqBlock = JSON.parse(buffer)
      this.allBlocks.push(block);
      this.allBlocks = this.allBlocks.sort((a,b) => {
        return b['height'] >= a['height'] ? 1 : -1;
      });
      this.blocks = this.allBlocks;
      this.lookupStats();
      this.buildIndex();
      logger.debug(`blocks size is now ${this.blocks.length}`);
      return block;
    } catch (e) { Bisq.LOG_RESTAPI_DATA_ERR(e); }
  }

  private getCurrencies() {
    const customPromise = this.makeApiCall('markets/get-currencies');
    customPromise.then((buffer) => {
      try {
        bisqMarket.setCurrencyData(JSON.parse(buffer));
      } catch (e) { Bisq.LOG_RESTAPI_DATA_ERR(e); }
    })
    .catch(err => { Bisq.LOG_RESTAPI_ERR(err) });
    return customPromise;
  }

  private getOffers() {
    const customPromise = this.makeApiCall('markets/get-offers');
    customPromise.then((buffer) => {
      try {
        bisqMarket.setOffersData(JSON.parse(buffer));
      } catch (e) { Bisq.LOG_RESTAPI_DATA_ERR(e); }
    })
    .catch(err => { Bisq.LOG_RESTAPI_ERR(err) });
    return customPromise;
  }

  private getTrades() {
    const customPromise = this.makeApiCall('markets/get-trades', [String(bisqMarket.getNewestTradeDate()), String(bisqMarket.getOldestTradeDate()-1)]);
    customPromise.then((buffer) => {
      try {
        bisqMarket.setTradesData(JSON.parse(buffer));
      } catch (e) { Bisq.LOG_RESTAPI_DATA_ERR(e); }
    })
    .catch(err => { Bisq.LOG_RESTAPI_ERR(err) });
    return customPromise;
  }

  // requesting information from Bisq REST API process
  private makeApiCall(api_method: string, params?: string[]) {
    var pathStr = '/api/v1/explorer/' + api_method + '/';
    if (params !== undefined) {
      pathStr = pathStr + params.join("/");
    }
    logger.debug(`${pathStr}`);
    var requestOptions = {
      host: config.BISQ.HOST,
      port: config.BISQ.PORT,
      method: 'GET',
      path: pathStr,
      headers: {
      'Host': config.BISQ.HOST,
      'Content-Length': 0 //optPostRequest.length
      },
      agent: false,
      rejectUnauthorized: false
    }
    var request = http.request(requestOptions);
    //request.write(optPostRequest);
    request.end();
    var customPromise = new Promise<string>((resolve, reject) => {
      request.on('error', function(e) {
        reject(new Error(`unable to make http request. ${JSON.stringify(requestOptions)}`));
      });
      request.on('response', (response) =>  {
        var buffer = ''
        response.on('data', function (chunk) {
          buffer = buffer + chunk
        })
        response.on('end', () => {
          resolve(buffer);
        });
      });
    });
    return customPromise;
  }

  private static LOG_RESTAPI_ERR(err) {
    logger.err(`it appears the Bisq daemon is not responding:\n${err}`);
  }

  private static LOG_RESTAPI_DATA_ERR(err) {
    logger.err(`{err}`);
  }

  private static FORMAT_BITCOIN(nbr) : string {
    return nbr.toLocaleString('en-us', {maximumFractionDigits:8});
  }

  private static FORMAT_USD(nbr) : string {
    return nbr.toLocaleString('en-us', {maximumFractionDigits:2});
  }
}

export default new Bisq();
