import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocsComponent } from './docs/docs.component';

const browserWindow = window || {};
// @ts-ignore
const browserWindowEnv = browserWindow.__env || {};

let routes: Routes = [];

  routes = [
    {
      path: '',
      redirectTo: 'api/rest',
      pathMatch: 'full'
    },
    {
      path: 'api/:type',
      component: DocsComponent
    },
    {
      path: 'api',
      redirectTo: 'api/rest',
      pathMatch: 'full'
    },
    {
      path: '**',
      redirectTo: 'api/rest',
      pathMatch: 'full'
    }
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class DocsRoutingModule { }
