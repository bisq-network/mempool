import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { MasterPageComponent } from './components/master-page/master-page.component';
import { SharedModule } from './shared/shared.module';
import { StartComponent } from './components/start/start.component';
import { AddressComponent } from './components/address/address.component';
import { BlocksList } from './components/blocks-list/blocks-list.component';

const browserWindow = window || {};
// @ts-ignore
const browserWindowEnv = browserWindow.__env || {};

const routes: Routes = [
  {
    path: '',
    component: MasterPageComponent,
    children: [
      {
        path: 'about',
        loadChildren: () => import('./components/about/about.module').then(m => m.AboutModule),
      },
      {
        path: 'blocks',
        component: BlocksList,
      },
      {
        path: 'address/:id',
        children: [],
        component: AddressComponent,
        data: {
          ogImage: true,
          networkSpecific: true,
        }
      },
      {
        path: 'tx',
        component: StartComponent,
        data: { preload: true, networkSpecific: true },
        loadChildren: () => import('./components/transaction/transaction.module').then(m => m.TransactionModule),
      },
      {
        path: 'block',
        component: StartComponent,
        data: { preload: true, networkSpecific: true },
        loadChildren: () => import('./components/block/block.module').then(m => m.BlockModule),
      },
      {
        path: 'docs',
        loadChildren: () => import('./docs/docs.module').then(m => m.DocsModule),
        data: { preload: true },
      },
      {
        path: 'api',
        loadChildren: () => import('./docs/docs.module').then(m => m.DocsModule)
      },
    ],
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class MasterPageRoutingModule { }

@NgModule({
  imports: [
    CommonModule,
    MasterPageRoutingModule,
    SharedModule,
  ],
  declarations: [
    MasterPageComponent,
  ],
  exports: [
    MasterPageComponent,
  ]
})
export class MasterPageModule { }
