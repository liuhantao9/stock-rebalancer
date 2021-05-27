import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Plan } from 'src/app/interface/plan';
import PriorityQueue from 'javascript-priority-queue';
import { Stock } from 'src/app/interface/stock';
import { environment } from 'src/environments/environment.prod';


@Component({
  selector: 'app-stock-component-calculator',
  templateUrl: './stock-component-calculator.component.html',
  styleUrls: ['./stock-component-calculator.component.css']
})

export class StockComponentCalculatorComponent implements OnInit {

  
  constructor(private formBuilder: FormBuilder) { }

  stockForm: FormGroup;
  buyingPower: number;
  totalCapital: number;
  plans: Plan[];
  stocks: FormGroup[];

  results: Stock[] = [];
  initNmaes = ['QQQ', 'VOO', 'FIX', 'TIP', 'TLT', 'NIO'];
  initPercentage = [30, 25, 20, 10, 10, 5];
  remainBP: number;

  ngOnInit(): void {

    this.stockForm = this.formBuilder.group({
      stocks: this.formBuilder.array([])
    });

    this.stocks = <FormGroup[]>(this.stockForm.controls.stocks as FormArray).controls;

    for (var i = 0; i < 6; i++) {
      this.stocks.push(this.formBuilder.group({
        stockName: this.initNmaes[i],
        currentTotal: [''],
        stockPercentage: this.initPercentage[i],
      }));
    }

  }

  createStock(): FormGroup {
    return this.formBuilder.group({
      stockName: [''],
      currentTotal: [''],
      stockPercentage: [''],
    });
  }

  addStock() {
    this.stocks.push(this.createStock());
  }

  onRemoveStock(index) {
    this.stocks.splice(index, 1);
  }

  async onRebalance() {
    this.results = [];

    let bp = this.buyingPower;
    const tc = this.totalCapital;
    const maxHeap = new PriorityQueue('max');
    for (let i = 0; i < this.stocks.length; i++) {
      if (!!this.stocks[i].controls['stockName']['value']) {
        const stockName = this.stocks[i].controls['stockName']['value'];
        const currentTotal = this.stocks[i].controls['currentTotal']['value'];
        let stockPrice = 0;
        const targetPercentage = this.stocks[i].controls['stockPercentage']['value'];

        // Fetch a query to find out the price
        await fetch(`https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?symbol=${stockName}&region=US`, {
          "method": "GET",
          "headers": {
            "x-rapidapi-key": environment['X-RAPIDAPI-KEY'],
            "x-rapidapi-host": environment['X-RAPIDAPI-HOST']
          }
        })
        .then(response => response.text())
        .then(body => {
          try {
            return JSON.parse(body)
          } catch {
            throw Error(body)
          }
        })
        .then(body => {
          stockPrice = Number(body['price']['regularMarketPrice']['raw'])
        })
        .catch(err => {
          console.error(err);
        });

        let currPercentage = (currentTotal / tc) * 100;
        let stock: Stock = {
          stockName: stockName,
          currentTotal: Number(currentTotal),
          targetPercentage: Number(targetPercentage),
          stockPrice: stockPrice,
          currPercentage: currPercentage,
          diff: (Number(targetPercentage) - currPercentage),
          resultPercentage: currPercentage,
          numToBuy: 0,
          resultTotal: 0,
        }
        maxHeap.enqueue(stock, stock.diff);
      }
    }
    this.remainBP = this.rebalancingHelper(bp, tc, maxHeap);
    console.log(this.results);
  }

  rebalancingHelper(bp: number, tc: number, maxHeap: PriorityQueue) {
    while (maxHeap.size() != 0) {
      let stock = maxHeap.dequeue();
      let increPercentage = (Number(stock.targetPercentage) - Number(stock.currPercentage)) / 100;
      let numToBuy = Math.round(increPercentage * tc / stock.stockPrice);
      
      while (bp < numToBuy * Number(stock.stockPrice) && numToBuy > 0) numToBuy -= 1;

      let resultTotal = numToBuy * Number(stock.stockPrice) + Number(stock.currentTotal);
      let resultPercentage = resultTotal / tc * 100;
      
      if (numToBuy > 0) bp -= numToBuy * Number(stock.stockPrice);

      stock.numToBuy = numToBuy;
      stock.resultPercentage = resultPercentage;
      stock.resultTotal = resultTotal;
      this.results.push(stock);
    }
    return bp;
  }
}
