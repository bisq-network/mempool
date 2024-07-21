import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppPreloadingStrategy } from './app.preloading-strategy'

const browserWindow = window || {};
// @ts-ignore
const browserWindowEnv = browserWindow.__env || {};

let routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./bisq/bisq.module').then(m => m.BisqModule)
    }];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking',
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    preloadingStrategy: AppPreloadingStrategy
  })],
})
export class AppRoutingModule { }
