import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCollapseModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faFilter, faAngleDown, faAngleUp, faAngleRight, faAngleLeft, faBolt, faChartArea, faCogs, faCubes, faHammer, faDatabase, faExchangeAlt, faInfoCircle,
  faLink, faList, faSearch, faCaretUp, faCaretDown, faTachometerAlt, faThList, faTint, faTv, faClock, faLightbulb, faAngleDoubleDown, faSortUp, faAngleDoubleUp, faChevronDown,
  faFileAlt, faRedoAlt, faArrowAltCircleRight, faExternalLinkAlt, faBook, faListUl, faDownload, faQrcode, faArrowRightArrowLeft, faArrowsRotate, faCircleLeft, faFastForward, faWallet, faUserClock, faWrench, faUserFriends, faQuestionCircle, faHistory, faSignOutAlt, faKey, faSuitcase, faIdCardAlt, faNetworkWired, faUserCheck, faCircleCheck, faUserCircle, faCheck, faRocket, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { VbytesPipe } from './pipes/bytes-pipe/vbytes.pipe';
import { ShortenStringPipe } from './pipes/shorten-string-pipe/shorten-string.pipe';
import { CeilPipe } from './pipes/math-ceil/math-ceil.pipe';
import { Hex2asciiPipe } from './pipes/hex2ascii/hex2ascii.pipe';
import { Decimal2HexPipe } from './pipes/decimal2hex/decimal2hex.pipe';
import { FeeRoundingPipe } from './pipes/fee-rounding/fee-rounding.pipe';
import { AsmStylerPipe } from './pipes/asm-styler/asm-styler.pipe';
import { AbsolutePipe } from './pipes/absolute/absolute.pipe';
import { RelativeUrlPipe } from './pipes/relative-url/relative-url.pipe';
import { ScriptpubkeyTypePipe } from './pipes/scriptpubkey-type-pipe/scriptpubkey-type.pipe';
import { BytesPipe } from './pipes/bytes-pipe/bytes.pipe';
import { FiatCurrencyPipe } from './pipes/fiat-currency.pipe';
import { TimeComponent } from '../components/time/time.component';
import { ClipboardComponent } from '../components/clipboard/clipboard.component';
import { QrcodeComponent } from '../components/qrcode/qrcode.component';
import { NgbNavModule, NgbTooltipModule, NgbPaginationModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { RateUnitSelectorComponent } from '../components/rate-unit-selector/rate-unit-selector.component';
import { ColoredPriceDirective } from './directives/colored-price.directive';
import { NoSanitizePipe } from './pipes/no-sanitize.pipe';
import { RouterModule } from '@angular/router';
import { CapAddressPipe } from './pipes/cap-address-pipe/cap-address-pipe';
import { SearchFormComponent } from '../components/search-form/search-form.component';
import { AmountShortenerPipe } from '../shared/pipes/amount-shortener.pipe';
import { DataCyDirective } from '../data-cy.directive';
import { SvgImagesComponent } from '../components/svg-images/svg-images.component';
import { TruncateComponent } from './components/truncate/truncate.component';
import { SearchResultsComponent } from '../components/search-form/search-results/search-results.component';
import { TimestampComponent } from './components/timestamp/timestamp.component';
import { ToggleComponent } from './components/toggle/toggle.component';
import { TestnetAlertComponent } from './components/testnet-alert/testnet-alert.component';

import { BitcoinsatoshisPipe } from '../shared/pipes/bitcoinsatoshis.pipe';

import { OnlyVsizeDirective, OnlyWeightDirective } from './components/weight-directives/weight-directives';

@NgModule({
  declarations: [
    ClipboardComponent,
    TimeComponent,
    QrcodeComponent,
    RateUnitSelectorComponent,
    ScriptpubkeyTypePipe,
    RelativeUrlPipe,
    NoSanitizePipe,
    Hex2asciiPipe,
    AsmStylerPipe,
    AbsolutePipe,
    BytesPipe,
    VbytesPipe,
    CeilPipe,
    ShortenStringPipe,
    CapAddressPipe,
    Decimal2HexPipe,
    FeeRoundingPipe,
    FiatCurrencyPipe,
    ColoredPriceDirective,
    SearchFormComponent,
    AmountShortenerPipe,
    DataCyDirective,
    SvgImagesComponent,
    TruncateComponent,
    SearchResultsComponent,
    TimestampComponent,
    ToggleComponent,
    TestnetAlertComponent,
    BitcoinsatoshisPipe,
    OnlyVsizeDirective,
    OnlyWeightDirective,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbTooltipModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbDropdownModule,
    NgbCollapseModule,
    InfiniteScrollModule,
    FontAwesomeModule,
  ],
  providers: [
    BytesPipe,
    VbytesPipe,
    RelativeUrlPipe,
    NoSanitizePipe,
    ShortenStringPipe,
    CapAddressPipe,
    AmountShortenerPipe,
  ],
  exports: [
    RouterModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbTooltipModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbDropdownModule,
    NgbCollapseModule,
    InfiniteScrollModule,
    FontAwesomeModule,
    TimeComponent,
    ClipboardComponent,
    QrcodeComponent,
    RateUnitSelectorComponent,
    ScriptpubkeyTypePipe,
    RelativeUrlPipe,
    Hex2asciiPipe,
    AsmStylerPipe,
    AbsolutePipe,
    BytesPipe,
    VbytesPipe,
    FiatCurrencyPipe,
    CeilPipe,
    ShortenStringPipe,
    CapAddressPipe,
    Decimal2HexPipe,
    FeeRoundingPipe,
    ColoredPriceDirective,
    NoSanitizePipe,
    SearchFormComponent,
    AmountShortenerPipe,
    DataCyDirective,
    SvgImagesComponent,
    TruncateComponent,
    SearchResultsComponent,
    TimestampComponent,
    ToggleComponent,
    TestnetAlertComponent,

    OnlyVsizeDirective,
    OnlyWeightDirective,
  ]
})
export class SharedModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faInfoCircle);
    library.addIcons(faChartArea);
    library.addIcons(faTv);
    library.addIcons(faClock);
    library.addIcons(faLightbulb);
    library.addIcons(faTachometerAlt);
    library.addIcons(faCubes);
    library.addIcons(faHammer);
    library.addIcons(faCogs);
    library.addIcons(faThList);
    library.addIcons(faList);
    library.addIcons(faTachometerAlt);
    library.addIcons(faDatabase);
    library.addIcons(faSearch);
    library.addIcons(faLink);
    library.addIcons(faBolt);
    library.addIcons(faTint);
    library.addIcons(faFilter);
    library.addIcons(faAngleDown);
    library.addIcons(faAngleUp);
    library.addIcons(faExchangeAlt);
    library.addIcons(faAngleDoubleUp);
    library.addIcons(faAngleDoubleDown);
    library.addIcons(faChevronDown);
    library.addIcons(faFileAlt);
    library.addIcons(faRedoAlt);
    library.addIcons(faArrowAltCircleRight);
    library.addIcons(faArrowsRotate);
    library.addIcons(faCircleLeft);
    library.addIcons(faExternalLinkAlt);
    library.addIcons(faSortUp);
    library.addIcons(faCaretUp);
    library.addIcons(faCaretDown);
    library.addIcons(faAngleRight);
    library.addIcons(faAngleLeft);
    library.addIcons(faBook);
    library.addIcons(faListUl);
    library.addIcons(faDownload);
    library.addIcons(faQrcode);
    library.addIcons(faArrowRightArrowLeft);
    library.addIcons(faExchangeAlt);
    library.addIcons(faList);
    library.addIcons(faFastForward);
    library.addIcons(faWallet);
    library.addIcons(faUserClock);
    library.addIcons(faWrench);
    library.addIcons(faUserFriends);
    library.addIcons(faQuestionCircle);
    library.addIcons(faHistory);
    library.addIcons(faSignOutAlt);
    library.addIcons(faKey);
    library.addIcons(faSuitcase);
    library.addIcons(faIdCardAlt);
    library.addIcons(faNetworkWired);
    library.addIcons(faUserCheck);
    library.addIcons(faCircleCheck);
    library.addIcons(faUserCircle);
    library.addIcons(faCheck);
    library.addIcons(faRocket);
    library.addIcons(faScaleBalanced);
  }
}
