import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarketsComponent } from './markets/markets.component';
import { MarketDetailComponent } from './market-detail/market-detail.component';
// No se requiere guard ya que mencionaste que esta vista es accesible para todos los roles

const routes: Routes = [
  { path: '', component: MarketsComponent },
  { path: ':id', component: MarketDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarketsRoutingModule { }