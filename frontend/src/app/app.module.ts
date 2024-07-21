import { BrowserModule } from '@angular/platform-browser';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { StateService } from './services/state.service';
import { SeoService } from './services/seo.service';
import { OpenGraphService } from './services/opengraph.service';
import { SharedModule } from './shared/shared.module';
import { StorageService } from './services/storage.service';
import { HttpCacheInterceptor } from './services/http-cache.interceptor';
import { LanguageService } from './services/language.service';
import { FiatCurrencyPipe } from './shared/pipes/fiat-currency.pipe';
import { ShortenStringPipe } from './shared/pipes/shorten-string-pipe/shorten-string.pipe';
import { CapAddressPipe } from './shared/pipes/cap-address-pipe/cap-address-pipe';
import { AppPreloadingStrategy } from './app.preloading-strategy';

const providers = [
  StateService,
  SeoService,
  OpenGraphService,
  StorageService,
  LanguageService,
  ShortenStringPipe,
  FiatCurrencyPipe,
  CapAddressPipe,
  AppPreloadingStrategy,
  { provide: HTTP_INTERCEPTORS, useClass: HttpCacheInterceptor, multi: true }
];

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SharedModule,
  ],
  providers: providers,
  bootstrap: [AppComponent]
})
export class AppModule { }

@NgModule({})
export class MempoolSharedModule{
  static forRoot(): ModuleWithProviders<MempoolSharedModule> {
    return {
      ngModule: AppModule,
      providers: providers
    };
  }
}
