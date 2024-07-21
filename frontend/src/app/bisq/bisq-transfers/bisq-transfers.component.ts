import { Component, OnInit, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { BisqTransaction } from '../../bisq/bisq.interfaces';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-bisq-transfers',
  templateUrl: './bisq-transfers.component.html',
  styleUrls: ['./bisq-transfers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BisqTransfersComponent implements OnInit, OnChanges {
  @Input() tx: BisqTransaction;
  @Input() showConfirmations = false;

  totalOutput: number;

  constructor() {
  }

  trackByIndexFn(index: number) {
    return index;
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.totalOutput = this.tx.outputs.filter((output) => output.isVerified).reduce((acc, output) => acc + output.bsqAmount, 0);
  }
}
