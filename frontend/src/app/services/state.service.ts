import { Inject, Injectable, PLATFORM_ID, LOCALE_ID } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Subject, fromEvent, Observable, merge } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter, map, scan, shareReplay } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { hasTouchScreen } from '../shared/pipes/bytes-pipe/utils';
import { ActiveFilter } from '../shared/filters.utils';

export interface ILoadingIndicators { [name: string]: number; }

export interface Env {
  TESTNET_ENABLED: boolean;
  SIGNET_ENABLED: boolean;
  LIQUID_ENABLED: boolean;
  LIQUID_TESTNET_ENABLED: boolean;
  BISQ_ENABLED: boolean;
  BISQ_SEPARATE_BACKEND: boolean;
  ITEMS_PER_PAGE: number;
  BASE_MODULE: string;
  NGINX_PROTOCOL?: string;
  NGINX_HOSTNAME?: string;
  NGINX_PORT?: string;
  GIT_COMMIT_HASH: string;
  PACKAGE_JSON_VERSION: string;
  LIGHTNING: boolean;
  HISTORICAL_PRICE: boolean;
  GIT_COMMIT_HASH_MEMPOOL_SPACE?: string;
  PACKAGE_JSON_VERSION_MEMPOOL_SPACE?: string;
}

const defaultEnv: Env = {
  'TESTNET_ENABLED': false,
  'SIGNET_ENABLED': false,
  'LIQUID_ENABLED': false,
  'LIQUID_TESTNET_ENABLED': false,
  'BASE_MODULE': 'bisq',
  'BISQ_ENABLED': true,
  'BISQ_SEPARATE_BACKEND': true,
  'ITEMS_PER_PAGE': 10,
  'NGINX_PROTOCOL': 'http',
  'NGINX_HOSTNAME': '127.0.0.1',
  'NGINX_PORT': '80',
  'GIT_COMMIT_HASH': '',
  'PACKAGE_JSON_VERSION': '',
  'LIGHTNING': false,
  'HISTORICAL_PRICE': true,
};

@Injectable({
  providedIn: 'root'
})
export class StateService {
  isBrowser: boolean = isPlatformBrowser(this.platformId);
  network = '';
  env: Env;

  networkChanged$ = new ReplaySubject<string>(1);
  loadingIndicators$ = new ReplaySubject<ILoadingIndicators>(1);

  viewFiat$ = new BehaviorSubject<boolean>(false);
  connectionState$ = new BehaviorSubject<0 | 1 | 2>(2);
  isTabHidden$: Observable<boolean>;

  keyNavigation$ = new Subject<KeyboardEvent>();
  searchText$ = new BehaviorSubject<string>('');

  blockScrolling$: Subject<boolean> = new Subject<boolean>();
  resetScroll$: Subject<boolean> = new Subject<boolean>();
  timeLtr: BehaviorSubject<boolean>;
  hideFlow: BehaviorSubject<boolean>;
  fiatCurrency$: BehaviorSubject<string>;
  rateUnits$: BehaviorSubject<string>;

  searchFocus$: Subject<boolean> = new Subject<boolean>();
  menuOpen$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    @Inject(LOCALE_ID) private locale: string,
    private router: Router,
    private storageService: StorageService,
  ) {
    const browserWindow = window || {};
    // @ts-ignore
    const browserWindowEnv = browserWindow.__env || {};
    this.env = Object.assign(defaultEnv, browserWindowEnv);

    if (this.isBrowser) {
      this.setNetworkBasedonUrl(window.location.pathname);
      this.isTabHidden$ = fromEvent(document, 'visibilitychange').pipe(map(() => this.isHidden()), shareReplay());
    } else {
      this.setNetworkBasedonUrl('/');
      this.isTabHidden$ = new BehaviorSubject(false);
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.setNetworkBasedonUrl(event.url);
      }
    });

    if (this.env.BASE_MODULE === 'bisq') {
      this.network = this.env.BASE_MODULE;
      this.networkChanged$.next(this.env.BASE_MODULE);
    }

    const savedTimePreference = this.storageService.getValue('time-preference-ltr');
    const rtlLanguage = (this.locale.startsWith('ar') || this.locale.startsWith('fa') || this.locale.startsWith('he'));
    // default time direction is right-to-left, unless locale is a RTL language
    this.timeLtr = new BehaviorSubject<boolean>(savedTimePreference === 'true' || (savedTimePreference == null && rtlLanguage));
    this.timeLtr.subscribe((ltr) => {
      this.storageService.setValue('time-preference-ltr', ltr ? 'true' : 'false');
    });

    const savedFlowPreference = this.storageService.getValue('flow-preference');
    this.hideFlow = new BehaviorSubject<boolean>(savedFlowPreference === 'hide');
    this.hideFlow.subscribe((hide) => {
      if (hide) {
        this.storageService.setValue('flow-preference', hide ? 'hide' : 'show');
      } else {
        this.storageService.removeItem('flow-preference');
      }
    });

    const fiatPreference = this.storageService.getValue('fiat-preference');
    this.fiatCurrency$ = new BehaviorSubject<string>(fiatPreference || 'USD');

    const rateUnitPreference = this.storageService.getValue('rate-unit-preference');
    this.rateUnits$ = new BehaviorSubject<string>(rateUnitPreference || 'vb');
  }

  setNetworkBasedonUrl(url: string) {
    if (this.env.BASE_MODULE !== 'mempool' && this.env.BASE_MODULE !== 'liquid') {
      return;
    }
    // horrible network regex breakdown:
    // /^\/                                         starts with a forward slash...
    // (?:[a-z]{2}(?:-[A-Z]{2})?\/)?                optional locale prefix (non-capturing)
    // (?:preview\/)?                               optional "preview" prefix (non-capturing)
    // (bisq|testnet|liquidtestnet|liquid|signet)/  network string (captured as networkMatches[1])
    // ($|\/)                                       network string must end or end with a slash
    const networkMatches = url.match(/^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?(?:preview\/)?(bisq|testnet|liquidtestnet|liquid|signet)($|\/)/);
    switch (networkMatches && networkMatches[1]) {
      case 'bisq':
        if (this.network !== 'bisq') {
          this.network = 'bisq';
          this.networkChanged$.next('bisq');
        }
        return;
      default:
        if (this.env.BASE_MODULE !== 'mempool') {
          if (this.network !== this.env.BASE_MODULE) {
            this.network = this.env.BASE_MODULE;
            this.networkChanged$.next(this.env.BASE_MODULE);
          }
        } else if (this.network !== '') {
          this.network = '';
          this.networkChanged$.next('');
        }
    }
  }

  getHiddenProp(){
    const prefixes = ['webkit', 'moz', 'ms', 'o'];
    if ('hidden' in document) { return 'hidden'; }
    for (const prefix of prefixes) {
      if ((prefix + 'Hidden') in document) {
        return prefix + 'Hidden';
      }
    }
    return null;
  }

  isHidden() {
    const prop = this.getHiddenProp();
    if (!prop) { return false; }
    return document[prop];
  }

  focusSearchInputDesktop() {
    if (!hasTouchScreen()) {
      this.searchFocus$.next(true);
    }    
  }
}
