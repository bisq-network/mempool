import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BisqApiService } from '../bisq-api.service';
import { BisqStats } from '../bisq.interfaces';

@Component({
  selector: 'app-bisq-stats',
  templateUrl: './bisq-stats.component.html',
  styleUrls: ['./bisq-stats.component.scss']
})
export class BisqStatsComponent implements OnInit {
  isLoading = true;
  stats: BisqStats;

  constructor(
    private bisqApiService: BisqApiService,
  ) { }

  ngOnInit() {
    this.bisqApiService.getStats$()
      .subscribe((stats) => {
        this.isLoading = false;
        this.stats = stats;
      });
  }

}
