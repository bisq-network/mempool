import { Component, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { BisqTransaction } from '../../bisq/bisq.interfaces';

@Component({
  selector: 'app-bisq-transaction-details',
  templateUrl: './bisq-transaction-details.component.html',
  styleUrls: ['./bisq-transaction-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BisqTransactionDetailsComponent implements OnChanges {
  @Input() tx: BisqTransaction;

  totalInput: number;
  totalOutput: number;
  totalIssued: number;
  totalLockup: number;
  lockupDuration: number = 0;
  constructor() { }

  ngOnChanges() {
    this.totalInput = this.tx.inputs.filter((input) => input.isVerified).reduce((acc, input) => acc + input.bsqAmount, 0);
    this.totalOutput = this.tx.outputs.filter((output) => output.isVerified).reduce((acc, output) => acc + output.bsqAmount, 0);
    this.totalIssued = this.tx.outputs
      .filter((output) => output.isVerified && output.txOutputType === 'ISSUANCE_CANDIDATE_OUTPUT')
      .reduce((acc, output) => acc + output.bsqAmount, 0);
    this.totalLockup = this.tx.outputs
      .filter((output) => output.isVerified && output.txOutputType === 'LOCKUP_OUTPUT')
      .reduce((acc, output) => acc + output.bsqAmount, 0);
    this.lockupDuration = this.tx.outputs
      .filter((output) => output.isVerified && output.txOutputType === 'LOCKUP_OUTPUT' && output.lockTime > 0)
      .reduce((acc, output) => acc + output.lockTime, 0);
  }
}
