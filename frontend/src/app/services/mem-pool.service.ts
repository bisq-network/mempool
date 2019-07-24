import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
import { IMempoolInfo, IBlock, IProjectedBlock, ITransaction } from '../blockchain/interfaces';

export interface IMemPoolState {
  memPoolInfo: IMempoolInfo;
  txPerSecond: number;
  vBytesPerSecond: number;
}

export interface ITxTracking {
  enabled: boolean;
  tx: ITransaction | null;
  blockHeight: number;
  notFound: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MemPoolService {
  mempoolStats$ = new ReplaySubject<IMemPoolState>();
  isOffline$ = new ReplaySubject<boolean>();
  txIdSearch$ = new ReplaySubject<string>();
  conversions$ = new ReplaySubject<any>();
  mempoolWeight$ = new ReplaySubject<number>();
  txTracking$ = new BehaviorSubject<ITxTracking>({
    enabled: false,
    tx: null,
    blockHeight: 0,
    notFound: false,
  });
  blocks$ = new ReplaySubject<IBlock>(8);
  projectedBlocks$ = new BehaviorSubject<IProjectedBlock[]>([]);
}
