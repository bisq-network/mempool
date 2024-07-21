import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-bsq-amount',
  templateUrl: './bsq-amount.component.html',
  styleUrls: ['./bsq-amount.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BsqAmountComponent implements OnInit {
  @Input() bsq: number;
  @Input() digitsInfo = '1.2-2';
  @Input() forceFiat = false;
  @Input() green = false;

  constructor(  ) { }

  ngOnInit() {
  }
}
