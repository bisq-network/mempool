import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DaoCycle } from '../bisq.interfaces';
import { BisqApiService } from '../bisq-api.service';

@Component({
  selector: 'app-bisq-cycles',
  templateUrl: './bisq-cycles.component.html',
  styleUrls: ['./bisq-cycles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BisqCyclesComponent implements OnInit {
  @Input() view: 'all' | 'small' = 'all';
  @Input() daoCycles$: Observable<any>;
  cycles: DaoCycle[] = [
  {heightOfFirstBlock:0, cycleIndex:35, startDate:1649307600000, proposalCount:21, issuedAmount:47004, burnedAmount:183216}, 
  {heightOfFirstBlock:0, cycleIndex:34, startDate:1646632800000, proposalCount:27, issuedAmount:65855, burnedAmount:54915},
  {heightOfFirstBlock:0, cycleIndex:33, startDate:1643781600000, proposalCount: 20, issuedAmount:56949, burnedAmount:78333}];

  constructor(
    private bisqApiService: BisqApiService,
  ) { }

  ngOnInit(): void {
    this.daoCycles$ = this.bisqApiService.getDaoCycles$();
  }

/*
    heightOfFirstBlock: number;
    cycleIndex: number;
    startDate: number; // in ms
    proposalCount: number;
    burnedAmount: number;
    issuedAmount: number;
*/

}
