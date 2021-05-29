import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StockComponentCalculatorComponent } from './component/stock-component-calculator/stock-component-calculator.component';


const routes: Routes = [
  // { path: '', component: StockComponentCalculatorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: false,
    anchorScrolling: 'enabled',
    enableTracing: true   // <-- debugging purposes
  })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
