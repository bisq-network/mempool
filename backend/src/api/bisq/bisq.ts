import config from '../../config';
import * as fs from 'fs';
import axios, { AxiosResponse } from 'axios';
import * as http from 'http';
import * as https from 'https';
import { DaoCycle, BisqBlocks, BisqBlock, BisqTransaction, BisqStats, BisqTrade } from './interfaces';
import { Currency, OffersData, TradesData } from './interfaces';
import backendInfo from '../backend-info';
import logger from '../../logger';
import bisqMarket from './markets-api';
import bisqPriceService from './price-service';

class Bisq {
  private daoCycles: DaoCycle[] = [];
  private blocks: BisqBlock[] = [];
  private allBlocks: BisqBlock[] = [];
  private transactions: BisqTransaction[] = [];
  private transactionIndex: { [txId: string]: BisqTransaction } = {};
  private blockIndex: { [hash: string]: BisqBlock } = {};
  private addressIndex: { [address: string]: BisqTransaction[] } = {};
  //private stats: BisqStats = { };
  private stats : BisqStats = ({
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
  
  private lastPollTimestamp: number = 0;
  private topDirectoryWatcher: fs.FSWatcher | undefined;
  private subdirectoryWatcher: fs.FSWatcher | undefined;

  constructor() {  }

    startBisqService(): void {
        logger.info('start bisq service (start)');
        bisqPriceService.run();
        this.$pollForNewData();  // obtains the current block height
        setTimeout(() => this.queryDaoCycles(), 20000);
        logger.info('start bisq service (end)');
    }

    private isBisqConnected() : boolean {
        if (this.stats.height > 0)
            return true;
        logger.warn("bisq not connected!");
        return false;
    }
    
    private async $pollForNewData() {
        this.calculateStats();  // obtains the current block height
        
        if (this.isBisqConnected() && new Date().getTime() - this.lastPollTimestamp > 600000) { // 10 minutes
            this.lastPollTimestamp = new Date().getTime();
            this.getCurrencies();
            this.getOffers();
            this.getTrades();
            setTimeout(() => bisqMarket.updateCache(), 2000); // TODO: wait for RPC calls to complete
        }
        
        setTimeout(() => this.$pollForNewData(), 20000);
    }
  
  public async $getTransaction(txId: string): Promise<BisqTransaction | undefined> {
    logger.info("getTransaction called from frontend");
    //var cachedTx = this.transactionIndex[txId];
    //if (cachedTx !== undefined) {
    //    return cachedTx;
    //}
    if (!this.isBisqConnected()) return undefined;  // empty
    var queriedTx = await this.$lookupBsqTx(txId);
    if (queriedTx !== undefined) {
        this.$indexBlock(queriedTx.blockHeight, true);
    }
    return queriedTx;
  }

  public async $getTransactions(start: number, length: number, types: string[]): Promise<[BisqTransaction[], number]> {
    logger.info("getTransactions called from frontend");
    //let transactions = this.transactions;
    //if (types.length) {
    //  transactions = transactions.filter((tx) => types.indexOf(tx.txType) > -1);
    //}
    //return [transactions.slice(start, length + start), transactions.length];
    if (!this.isBisqConnected()) return [this.transactions, 0];  // empty
    
    var types2 = types.join("~")
    if (types2.length === 0) { types2 = "~"; }
    var queriedTx = await this.$lookupBsqTx2(start, length, types2);
    return [queriedTx, this.stats.unspent_txos+this.stats.spent_txos];  // JMC KLUDGE
  }

  public async $getBlock(hash: string): Promise<BisqBlock | undefined> {
    logger.info(`getBlock called from frontend ${hash}`);
    var cached = this.blockIndex[hash];
    if (cached) {
        return cached;
    }
    if (!this.isBisqConnected()) return undefined;  // empty
    var queried = await this.$lookupBsqBlock(hash);
    return queried;
  }

  public async $getAddress(hash: string): Promise<BisqTransaction[]> {
    logger.info(`getAddress called from frontend ${hash}`);
    var retVal : BisqTransaction[] = this.addressIndex[hash];
//    if (retVal !== undefined && retVal.length > 0) {
//        logger.warn(`(cached) txs: ${JSON.stringify(retVal)}`);
//        return retVal;
//    }
    if (!this.isBisqConnected()) return [];  // empty
    var queriedTx: BisqTransaction[] = await this.$lookupBsqTxForAddr(hash);
//    logger.warn(`txs: ${JSON.stringify(queriedTx)}`);
    return queriedTx;
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
          return [returnBlocks, this.blocks.length];  // TODO: JMC what is the second return param used for?
        }
        returnBlocks = this.getRequiredBlocksFromCache(fromHeight, currentHeight, limit);
        if (returnBlocks.length === limit) {
            return [returnBlocks, this.stats.height - this.stats.genesisHeight];  // TODO: JMC what is the second return param used for?
        }

        await this.$fillMissingBlocksFromCache(currentHeight, limit);
        // now the cache should contain all the results needed
        returnBlocks = this.getRequiredBlocksFromCache(fromHeight, currentHeight, limit);
        return [returnBlocks, this.stats.height - this.stats.genesisHeight];  // TODO: JMC what is the second return param used for?
    }

    private async $fillMissingBlocksFromCache(currentHeight: number, limit: number) {
        // now we must fill the missing cache elements        
        for (let i = 0; i < limit && currentHeight >= 0; i++) {
          logger.info(`blocks in cache:${this.blocks.length}, looking for one with height=${currentHeight}`);
          let block = this.blocks.find((b) => b.height === currentHeight);
          if (!block) {
            // Using indexing (find by height, index on the fly, save in database)
            logger.info(`not found in cache, calling indexBlock ${currentHeight} ${i}`);
            await this.$indexBlock(currentHeight, false);
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

  getStats(): BisqStats {
    logger.info("getStats called from frontend");
    return this.stats;
  }

  getDaoCycles(): DaoCycle[] {
    logger.info("getDaoCycles called from frontend");
    return this.daoCycles;
  }

  getLatestBlockHeight(): number {
    logger.info(`getLatestBlockHeight called from frontend`);
    return this.stats.height;
  }

  private buildIndex() {
    logger.info("buildIndex");
    const start = new Date().getTime();
    this.transactions = [];
    this.transactionIndex = {};
    this.addressIndex = {};

    this.allBlocks.forEach((block) => {
      /* Build block index */
      if (!this.blockIndex[block.hash]) {
        this.blockIndex[block.hash] = block;
        logger.info(`set block index for ${block.hash}`);
      }

      /* Build transactions index */
      block.txs.forEach((tx) => {
        this.transactions.push(tx);
        this.transactionIndex[tx.id] = tx;
      });
    });

    /* Build address index */
    this.transactions.forEach((tx) => {
      tx.inputs.forEach((input) => {
        if (!this.addressIndex[input.address]) {
          this.addressIndex[input.address] = [];
        }
        if (this.addressIndex[input.address].indexOf(tx) === -1) {
          this.addressIndex[input.address].push(tx);
        }
      });
      tx.outputs.forEach((output) => {
        if (!this.addressIndex[output.address]) {
          this.addressIndex[output.address] = [];
        }
        if (this.addressIndex[output.address].indexOf(tx) === -1) {
          this.addressIndex[output.address].push(tx);
        }
      });
    });

    logger.info(`blocks:${this.blocks.length} blockIndex:${Object.keys(this.blockIndex).length} transactions:${this.transactions.length} transactionIndex:${Object.keys(this.transactionIndex).length}`);
//    const time = new Date().getTime() - start;
//    logger.debug('Bisq data index rebuilt in ' + time + ' ms');
  }

    /**
    * Index a block if it's missing from the database. Returns the block after indexing
    */
    private async $indexBlock(height: number, reIndex: boolean): Promise<BisqBlock | null> {
        try {
            const block = await this.$lookupBsqBlock2(height);
            this.allBlocks.push(block);
            this.allBlocks = this.allBlocks.sort((a,b) => {
              return b['height'] >= a['height'] ? 1 : -1;
            });
            this.blocks = this.allBlocks;
            if (reIndex) {
                this.buildIndex();
            }
            return block;
        } catch (error) {
            logger.info(`error while indexing block height: ${height}`);
        }
        return null;
    }

    private calculateStats() {
        const customPromise = this.makeApiCall('dao/get-bsq-stats');
        customPromise.then((buffer) => {
            try {
                const stats: BisqStats = JSON.parse(buffer)
                stats.minted /= 100.0;
                stats.burnt /= 100.0;
                stats._bsqPrice = bisqPriceService.getPrice("BSQ");
                stats._usdPrice = stats._bsqPrice * bisqPriceService.getPrice("USD");
                stats._marketCap = stats._usdPrice * (stats.minted - stats.burnt);
                this.stats = stats;
                logger.info(`BSQ stats received, height=${stats.height}`);
                if (this.stats !== undefined && this.blocks.length < 1) {
                    // startup, ensure 1 block gets cached
                    this.$indexBlock(this.stats.height, true);
                } else if (this.stats !== undefined && this.blocks[0].height !== this.stats.height) {
                    // cache a newly issued block
                    this.$indexBlock(this.stats.height, true);
                }
            } catch (e) {
                logger.info(`EXCEPTION!`);
            }
        })
        .catch(err => {
            logger.warn("it appears the Bisq daemon is not available yet.");
        });
    }

    private async $lookupBsqTx(txId: string) : Promise<BisqTransaction | undefined> {
        const customPromise = this.makeApiCall('transactions/get-bsq-tx', [txId]);
        var buffer = await customPromise;
        try {
            const tx: BisqTransaction = JSON.parse(buffer)
            return tx;
        } catch (e) {
            logger.info(`EXCEPTION!`);
        }
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


    private async $lookupBsqBlock2(height: number) : Promise<BisqBlock> {
        const customPromise = this.makeApiCall('blocks/get-bsq-block-by-height', [String(height)]);
        var buffer = await customPromise;
        const block: BisqBlock = JSON.parse(buffer)
        return block;
    }

    private async $lookupBsqBlock(hash: string) : Promise<BisqBlock | undefined> {
        const customPromise = this.makeApiCall('blocks/get-bsq-block-by-hash', [hash]);
        try {
            var buffer = await customPromise;
            const block: BisqBlock = JSON.parse(buffer)
            this.allBlocks.push(block);
            this.allBlocks = this.allBlocks.sort((a,b) => {
              return b['height'] >= a['height'] ? 1 : -1;
            });
            this.blocks = this.allBlocks;
            this.calculateStats();
            this.buildIndex();
            logger.info(`blocks size is now ${this.blocks.length}`);
            return block;
        } catch (e) {
            logger.info(`EXCEPTION!`);
        }
    }

    private getCurrencies() {
        logger.info(`getCurrencies`);
        const customPromise = this.makeApiCall('markets/get-currencies');
        customPromise.then((buffer) => {
            try {
                const currencies: Currency[] = JSON.parse(buffer)
                const extraBtcCurrency : Currency = {'code': "BTC",'name': "Bitcoin", 'precision': 8, '_type': "crypto"};
                currencies.push(extraBtcCurrency);
                const fiats = ["USD", "EUR", "GBP", "BRL", "AUD"];
                const cryptos = ["BTC", "XMR", "BSQ", "ETH"];
                const fiatCurrencyData : Currency[] = currencies.filter( (x) => x._type === "fiat" && fiats.includes(x.code));
                const cryptoCurrencyData : Currency[] = currencies.filter( (x) => x._type === "crypto" && cryptos.includes(x.code) );
                const activeFiatCurrencyData : Currency[] = fiatCurrencyData;
                const activeCryptoCurrencyData : Currency[] = cryptoCurrencyData;
                logger.debug(`getCurrencies: ${buffer.length} bytes.  Updating Bisq Market Currency Data with ${fiatCurrencyData.length} fiat and ${cryptoCurrencyData.length} cryptos.`);
                bisqMarket.setCurrencyData(cryptoCurrencyData, fiatCurrencyData, activeCryptoCurrencyData, activeFiatCurrencyData);
            } catch (e) {
                logger.info(`EXCEPTION!`);
            }
        })
        .catch(err => {
            logger.info(`EXCEPTION2! ${err}`);
        });
    }
    
    private queryDaoCycles() {
        logger.info(`queryDaoCycles`);
        const customPromise = this.makeApiCall('dao/query-dao-cycles');
        customPromise.then((buffer) => {
            try {
                this.daoCycles = JSON.parse(buffer)
                logger.info(`queryDaoCycles retrieved ${this.daoCycles.length} records`);
            } catch (e) {
                logger.info(`EXCEPTION!`);
            }
        })
        .catch(err => {
            logger.info(`EXCEPTION2! ${err}`);
        });
    }
    
    private getOffers() {
        logger.info(`getOffers`);
        const customPromise = this.makeApiCall('markets/get-offers');
        customPromise.then((buffer) => {
            try {
                const records: OffersData[] = JSON.parse(buffer)
                logger.debug(`getOffers: ${buffer.length} bytes.  Updating Bisq Market Offers Data with ${records.length} records.`);
                bisqMarket.setOffersData(records);
            } catch (e) {
                logger.info(`EXCEPTION!`);
            }
        })
        .catch(err => {
            logger.info(`EXCEPTION2! ${err}`);
        });
    }
    
    private getTrades() {
        logger.info(`getTrades`);
        const customPromise = this.makeApiCall('markets/get-trades', [String(bisqMarket.getNewestTradeDate()), String(bisqMarket.getOldestTradeDate())]);
        customPromise.then((buffer) => {
            try {
                const trades: TradesData[] = JSON.parse(buffer)
                bisqMarket.setTradesData(trades);
            } catch (e) {
                logger.info(`EXCEPTION!`);
            }
        })
        .catch(err => {
            logger.info(`EXCEPTION2! ${err}`);
        });
    }
    
    private makeApiCall(api_method: string, param?: string[]) {
        var requestJSON = "";
        var pathStr = '/api/v1/explorer/' + api_method + '/';
        if (param !== undefined) {
            pathStr = pathStr + param.join("/");
        }
//        logger.info(`${pathStr}`);
        var requestOptions = {
          host: config.BISQ.HOST,
          port: config.BISQ.PORT,
          method: 'GET',
          path: pathStr,
          headers: {
            'Host': config.BISQ.HOST,
            'Content-Length': requestJSON.length
          },
          agent: false,
          rejectUnauthorized: false
        }
//        logger.info("about to make request");
        var request = http.request(requestOptions);
        request.write(requestJSON);
        request.end();
        var customPromise = new Promise<string>((resolve, reject) => {
            request.on('error', function(e) {
                reject(new Error("oops"));
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
}

export default new Bisq();
