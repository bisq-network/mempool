import express from 'express';
import { Application, Request, Response, NextFunction } from 'express';
import * as http from 'http';
import config from './config';
import logger from './logger';
import { Common } from './api/common';
import v8 from 'v8';
import { formatBytes, getBytesUnit } from './utils/format';
import backendInfo from './api/backend-info';
import loadingIndicators from './api/loading-indicators';
import bisq from './api/bisq/bisq';
import bisqRoutes from './api/bisq/bisq.routes';

class Server {
  private server: http.Server | undefined;
  private app: Application;
  private maxHeapSize: number = 0;
  private heapLogInterval: number = 600;
  private warnedHeapCritical: boolean = false;
  private lastHeapLogTime: number | null = null;

  constructor() {
    this.app = express();
    this.startServer();
  }

  async startServer(worker = false): Promise<void> {
    logger.notice(`Starting Mempool Server${worker ? ' (worker)' : ''}... (${backendInfo.getShortCommitHash()})`);

    // Register cleanup listeners for exit events
    ['exit', 'SIGHUP', 'SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'].forEach(event => {
      process.on(event, () => { this.onExit(event); });
    });
    process.on('uncaughtException', (error) => {
      this.onUnhandledException('uncaughtException', error);
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.onUnhandledException('unhandledRejection', reason);
    });

    this.app
      .use((req: Request, res: Response, next: NextFunction) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      })
      .use(express.urlencoded({ extended: true }))
      .use(express.text({ type: ['text/plain', 'application/base64'] }))
      ;

    this.server = http.createServer(this.app);

    setInterval(() => { this.healthCheck(); }, 60000);

    if (config.BISQ.ENABLED) {
      bisqRoutes.initRoutes(this.app);
      bisq.startBisqService();
    }

    this.server.listen(config.MEMPOOL.HTTP_PORT, () => {
      if (worker) {
        logger.info(`Mempool Server worker #${process.pid} started`);
      } else {
        logger.notice(`Mempool Server is running on port ${config.MEMPOOL.HTTP_PORT}`);
      }
    });
  }

  healthCheck(): void {
    const now = Date.now();
    const stats = v8.getHeapStatistics();
    this.maxHeapSize = Math.max(stats.used_heap_size, this.maxHeapSize);
    const warnThreshold = 0.8 * stats.heap_size_limit;

    const byteUnits = getBytesUnit(Math.max(this.maxHeapSize, stats.heap_size_limit));

    if (!this.warnedHeapCritical && this.maxHeapSize > warnThreshold) {
      this.warnedHeapCritical = true;
      logger.warn(`Used ${(this.maxHeapSize / stats.heap_size_limit * 100).toFixed(2)}% of heap limit (${formatBytes(this.maxHeapSize, byteUnits, true)} / ${formatBytes(stats.heap_size_limit, byteUnits)})!`);
    }
    if (this.lastHeapLogTime === null || (now - this.lastHeapLogTime) > (this.heapLogInterval * 1000)) {
      logger.debug(`Memory usage: ${formatBytes(this.maxHeapSize, byteUnits)} / ${formatBytes(stats.heap_size_limit, byteUnits)}`);
      this.warnedHeapCritical = false;
      this.maxHeapSize = 0;
      this.lastHeapLogTime = now;
    }
  }

  onExit(exitEvent, code = 0): void {
    logger.debug(`onExit for signal: ${exitEvent}`);
    process.exit(code);
  }

  onUnhandledException(type, error): void {
    console.error(`${type}:`, error);
    this.onExit(type, 1);
  }
}

((): Server => new Server())();
