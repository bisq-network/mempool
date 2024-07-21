import { Component, OnInit, ChangeDetectionStrategy, EventEmitter, Output, ViewChild, HostListener, ElementRef, Input } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EventType, NavigationStart, Router } from '@angular/router';
import { Env, StateService } from '../../services/state.service';
import { Observable, of, Subject, zip, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, startWith,  tap } from 'rxjs/operators';
import { RelativeUrlPipe } from '../../shared/pipes/relative-url/relative-url.pipe';
import { ApiService } from '../../services/api.service';
import { SearchResultsComponent } from './search-results/search-results.component';
import { Network, findOtherNetworks, getRegex } from '../../shared/regex.utils';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFormComponent implements OnInit {
  @Input() hamburgerOpen = false;
  env: Env;
  network = '';
  isSearching = false;
  isTypeaheading$ = new BehaviorSubject<boolean>(false);
  typeAhead$: Observable<any>;
  searchForm: UntypedFormGroup;
  dropdownHidden = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event) {
    if (this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownHidden = false;
    } else {
      this.dropdownHidden = true;
    }
  }

  regexAddress = getRegex('address', 'mainnet'); // Default to mainnet
  regexBlockhash = getRegex('blockhash', 'mainnet');
  regexTransaction = getRegex('transaction');
  regexBlockheight = getRegex('blockheight');
  regexDate = getRegex('date');
  regexUnixTimestamp = getRegex('timestamp');

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  @Output() searchTriggered = new EventEmitter();
  @ViewChild('searchResults') searchResults: SearchResultsComponent;
  @HostListener('keydown', ['$event']) keydown($event): void {
    this.handleKeyDown($event);
  }

  @ViewChild('searchInput') searchInput: ElementRef;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private stateService: StateService,
    private apiService: ApiService,
    private relativeUrlPipe: RelativeUrlPipe,
    private elementRef: ElementRef
  ) {
  }

  ngOnInit(): void {
    this.env = this.stateService.env;
    this.stateService.networkChanged$.subscribe((network) => {
      this.network = network;
      // TODO: Eventually change network type here from string to enum of consts
      this.regexAddress = getRegex('address', network as any || 'mainnet');
      this.regexBlockhash = getRegex('blockhash', network as any || 'mainnet');
    });

    this.router.events.subscribe((e: NavigationStart) => { // Reset search focus when changing page
      if (this.searchInput && e.type === EventType.NavigationStart) {
        this.searchInput.nativeElement.blur();
      }
    });

    this.stateService.searchFocus$.subscribe(() => {
      if (!this.searchInput) { // Try again a bit later once the view is properly initialized
        setTimeout(() => this.searchInput.nativeElement.focus(), 100);
      } else if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    });

    this.searchForm = this.formBuilder.group({
      searchText: ['', Validators.required],
    });

    const searchText$ = this.searchForm.get('searchText').valueChanges
    .pipe(
      map((text) => {
        return text.trim();
      }),
      tap((text) => {
        this.stateService.searchText$.next(text);
      }),
      distinctUntilChanged(),
    );

    this.typeAhead$ = combineLatest(
      [
        searchText$,
        searchText$,
      ]
      ).pipe(
        map((latestData) => {
          let searchText = latestData[0];
          if (!searchText.length) {
            return {
              searchText: '',
              hashQuickMatch: false,
              blockHeight: false,
              txId: false,
              address: false,
              otherNetworks: [],
              addresses: [],
              nodes: [],
              channels: [],
            };
          }

          const result = latestData[1];
          const addressPrefixSearchResults = result[0];
          const lightningResults = result[1];

          // Do not show date and timestamp results for liquid and bisq
          const isNetworkBitcoin = this.network === '' || this.network === 'testnet' || this.network === 'signet';

          const matchesBlockHeight = this.regexBlockheight.test(searchText); // && parseInt(searchText) <= this.stateService.latestBlockHeight;
          const matchesDateTime = this.regexDate.test(searchText) && new Date(searchText).toString() !== 'Invalid Date' && new Date(searchText).getTime() <= Date.now() && isNetworkBitcoin;
          const matchesUnixTimestamp = this.regexUnixTimestamp.test(searchText) && parseInt(searchText) <= Math.floor(Date.now() / 1000) && isNetworkBitcoin;
          const matchesTxId = this.regexTransaction.test(searchText) && !this.regexBlockhash.test(searchText);
          const matchesBlockHash = this.regexBlockhash.test(searchText);
          let matchesAddress = !matchesTxId && this.regexAddress.test(searchText);
          const otherNetworks = findOtherNetworks(searchText, this.network as any || 'mainnet', this.env);

          // Add B prefix to addresses in Bisq network
          if (!matchesAddress && this.network === 'bisq' && getRegex('address', 'mainnet').test(searchText)) {
              searchText = 'B' + searchText;
              matchesAddress = !matchesTxId && this.regexAddress.test(searchText);
          }

          if (matchesDateTime && searchText.indexOf('/') !== -1) {
            searchText = searchText.replace(/\//g, '-');
          }

          return {
            searchText: searchText,
            hashQuickMatch: +(matchesBlockHeight || matchesBlockHash || matchesTxId || matchesAddress || matchesUnixTimestamp || matchesDateTime),
            blockHeight: matchesBlockHeight,
            dateTime: matchesDateTime,
            unixTimestamp: matchesUnixTimestamp,
            txId: matchesTxId,
            blockHash: matchesBlockHash,
            address: matchesAddress,
            addresses: matchesAddress && addressPrefixSearchResults.length === 1 && searchText === addressPrefixSearchResults[0] ? [] : addressPrefixSearchResults, // If there is only one address and it matches the search text, don't show it in the dropdown
            otherNetworks: otherNetworks,
            nodes: lightningResults.nodes,
            channels: lightningResults.channels,
          };
        })
      );
  }

  handleKeyDown($event): void {
    this.searchResults.handleKeyDown($event);
  }

  itemSelected(): void {
    setTimeout(() => this.search());
  }

  selectedResult(result: any): void {
    if (typeof result === 'string') {
      this.search(result);
    } else if (typeof result === 'number') { // && result <= this.stateService.latestBlockHeight) {
      this.navigate('/block/', result.toString());
    } else if (result.network) {
      if (result.isNetworkAvailable) {
        this.navigate('/address/', result.address, undefined, result.network);
      } else {
        this.searchForm.setValue({
          searchText: '',
        });
        this.isSearching = false;
      }
    }
  }

  search(result?: string): void {
    const searchText = result || this.searchForm.value.searchText.trim();
    if (searchText) {
      this.isSearching = true;

      if (!this.regexTransaction.test(searchText) && this.regexAddress.test(searchText)) {
        this.navigate('/address/', searchText);
      } else if (this.regexBlockhash.test(searchText)) {
        this.navigate('/block/', searchText);
      } else if (this.regexBlockheight.test(searchText)) {
        parseInt(searchText) <= 1234 ? this.navigate('/block/', searchText) : this.isSearching = false; // was this.stateService.latestBlockHeight
      } else if (this.regexTransaction.test(searchText)) {
        const matches = this.regexTransaction.exec(searchText);
        this.navigate('/tx/', matches[0]);
      } else if (this.regexDate.test(searchText) || this.regexUnixTimestamp.test(searchText)) {
        this.isSearching = false;
        return;
      } else {
        this.searchResults.searchButtonClick();
        this.isSearching = false;
      }
    }
  }


  navigate(url: string, searchText: string, extras?: any, swapNetwork?: string) {
      this.router.navigate([this.relativeUrlPipe.transform(url, swapNetwork), searchText], extras);
      this.searchTriggered.emit();
      this.searchForm.setValue({
        searchText: '',
      });
      this.isSearching = false;
  }
}
