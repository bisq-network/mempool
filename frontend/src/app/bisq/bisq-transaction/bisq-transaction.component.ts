import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { BisqTransaction } from '../../bisq/bisq.interfaces';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of, Observable, Subscription } from 'rxjs';
import { StateService } from '../../services/state.service';
import { BisqApiService } from '../bisq-api.service';
import { SeoService } from '../../services/seo.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-bisq-transaction',
  templateUrl: './bisq-transaction.component.html',
  styleUrls: ['./bisq-transaction.component.scss']
})
export class BisqTransactionComponent implements OnInit, OnDestroy {
  bisqTx: BisqTransaction;
  txId: string;
  isLoading = true;
  error = null;
  subscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private bisqApiService: BisqApiService,
    private stateService: StateService,
    private seoService: SeoService,
    private router: Router,
  ) { }

  ngOnInit(): void {

    this.subscription = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        this.isLoading = true;
        //this.isLoadingTx = true;
        this.error = null;
        document.body.scrollTo(0, 0);
        this.txId = params.get('id') || '';
        this.seoService.setTitle($localize`:@@bisq.transaction.browser-title:Transaction: ${this.txId}:INTERPOLATION:`);
        this.seoService.setDescription($localize`:@@meta.description.bisq.transaction:See inputs, outputs, transaction type, burnt amount, and more for transaction with txid ${this.txId}:INTERPOLATION:.`);
        if (history.state.data) {
          return of(history.state.data);
        }
        return this.bisqApiService.getTransaction$(this.txId)
          .pipe(
            catchError((bisqTxError: HttpErrorResponse) => {
              this.error = bisqTxError;
              this.seoService.logSoft404();
              return of(null);
            })
          );
      }))
    .subscribe((bisqTx) => {
        if (!bisqTx) {
            this.seoService.logSoft404();
            return;
        }

        if (bisqTx.version) {
          if (this.stateService.env.BASE_MODULE === 'bisq') {
            window.location.replace('https://mempool.space/tx/' + this.txId);
          } else {
            this.router.navigate(['/tx/', this.txId], { state: { data: bisqTx, bsqTx: true }});
          }
          return;
        }

        this.bisqTx = bisqTx;
        this.isLoading = false;
      }),
    
    (error) => {
      this.error = error;
    };
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
