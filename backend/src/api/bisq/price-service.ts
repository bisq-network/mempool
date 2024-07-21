import config from '../../config';
import logger from '../../logger';
import { axiosQuery } from '../../utils/axios-query';

class BisqPriceService {
    private providers: string[] = [
            "http://emzypricpidesmyqg2hc6dkwitqzaxrqnpkdg3ae2wef5znncu2ambqd.onion/", // @emzy
            "http://devinpndvdwll4wiqcyq5e7itezmarg7rzicrvf6brzkwxdm374kmmyd.onion/", // @devinbileck
            "http://ro7nv73awqs3ga2qtqeqawrjpbxwarsazznszvr6whv7tes5ehffopid.onion/", // @alexej996
    ];
    private providerIndex: number = Math.floor(Math.random() * (this.providers.length-1));
    private priceDb: string = '';
    private bsqPrice: number = 0;

    constructor() {
    }

    public getPrice(currencyOrTicker: string) : number {
        if (this.priceDb === '') {
            logger.warn("getPrice: prices not available");
            return NaN;
        }
        let currency = currencyOrTicker.toUpperCase();
        if (currencyOrTicker.includes('_')) {
            const currencyPairs = currencyOrTicker.split('_');
            const currencyLeft = currencyPairs[0].toUpperCase();
            const currencyRight = currencyPairs[1].toUpperCase();
            if (currencyLeft === 'BTC') {
                currency = currencyRight;
            } else {
                currency = currencyLeft;
            }
        }
        let prices = JSON.parse(this.priceDb)['data'];
        let priceresult = prices.find( (x) => currency === x.currencyCode)
        if (priceresult === undefined) {
            if (currency === 'BSQ') {
                return this.bsqPrice;   // BSQ price is calculated here, as its not supplied by pricenodes
            }
            return NaN;
        }
        let price = Number(priceresult['price']);
        //logger.warn(`price query for ${currency} returning ${price}`);
        return price;
    }

    // bsq price is averaged from the last n BSQ trades
    public setBsqPrice(bsqPrice: number) : void {
        this.bsqPrice = bsqPrice;
    }

    public run() : void {
        setTimeout(() => this.$updatePrices(), 2000);
    }

    private selectedProvider(): string {
        return this.providers[this.providerIndex];
    }

    private switchToNextProvider() {
        this.providerIndex++;
        if (this.providerIndex >= this.providers.length) {
            this.providerIndex = 0;
        }
    }

    private async $updatePrices(): Promise<void> {
        logger.debug("updatePrices");
        let url = this.selectedProvider() + "getAllMarketPrices";
        try {
            this.priceDb = await axiosQuery(url);
            let prices = JSON.parse(this.priceDb)['data'];
            logger.info(`retrieved ${prices.length} prices from ${url}`);
            setTimeout(() => this.$updatePrices(), 600000); // 10 minutes
        } catch (e) {
            this.switchToNextProvider();
            logger.info(`price query failed: ${url}, switching to next provider: ${this.selectedProvider()}`);
            setTimeout(() => this.$updatePrices(), 10000); // 10 seconds
        }
    }
}

export default new BisqPriceService();
