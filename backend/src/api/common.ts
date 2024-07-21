//import * as bitcoinjs from 'bitcoinjs-lib';
import { Request } from 'express';
import config from '../config';
import { isIP } from 'net';
import logger from '../logger';
export class Common {

  static median(numbers: number[]) {
    let medianNr = 0;
    const numsLen = numbers.length;
    if (numsLen % 2 === 0) {
        medianNr = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else {
        medianNr = numbers[(numsLen - 1) / 2];
    }
    return medianNr;
  }

  static percentile(numbers: number[], percentile: number) {
    if (percentile === 50) {
      return this.median(numbers);
    }
    const index = Math.ceil(numbers.length * (100 - percentile) * 1e-2);
    if (index < 0 || index > numbers.length - 1) {
      return 0;
    }
    return numbers[index];
  }

  static sleep$(ms: number): Promise<void> {
    return new Promise((resolve) => {
       setTimeout(() => {
         resolve();
       }, ms);
    });
  }

  static shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  }

  static getSqlInterval(interval: string | null): string | null {
    switch (interval) {
      case '24h': return '1 DAY';
      case '3d': return '3 DAY';
      case '1w': return '1 WEEK';
      case '1m': return '1 MONTH';
      case '3m': return '3 MONTH';
      case '6m': return '6 MONTH';
      case '1y': return '1 YEAR';
      case '2y': return '2 YEAR';
      case '3y': return '3 YEAR';
      case '4y': return '4 YEAR';
      default: return null;
    }
  }

  static setDateMidnight(date: Date): void {
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
  }

  static utcDateToMysql(date?: number | null): string | null {
    if (date === null) {
      return null;
    }
    const d = new Date((date || 0) * 1000);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0];
  }

  static getNthPercentile(n: number, sortedDistribution: any[]): any {
    return sortedDistribution[Math.floor((sortedDistribution.length - 1) * (n / 100))];
  }

}
