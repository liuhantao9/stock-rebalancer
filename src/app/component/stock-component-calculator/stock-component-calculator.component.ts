import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Plan } from 'src/app/interface/plan';
import PriorityQueue from 'javascript-priority-queue';
import { Stock } from 'src/app/interface/stock';
import { environment } from 'src/environments/environment';


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
  currentStockValue: number;
  plans: Plan[];
  stocks: FormGroup[];

  results: Stock[] = [];
  initNames = ['QQQ', 'VOO', 'FXI', 'VEA', 'TIP', 'TLT', 'INTC', 'NIO', 'MGYOY'];
  initPercentage = [25, 20, 18, 12, 15, 5, 2, 1, 1];
  remainBP: number;

  ngOnInit(): void {

    this.stockForm = this.formBuilder.group({
      stocks: this.formBuilder.array([])
    });

    this.stocks = <FormGroup[]>(this.stockForm.controls.stocks as FormArray).controls;

    for (var i = 0; i < this.initNames.length; i++) {
      this.stocks.push(this.formBuilder.group({
        stockName: this.initNames[i],
        currentTotal: [''],
        shareNumbers: [''],
        stockPercentage: this.initPercentage[i],
      }));
    }

  }

  onCurrentStockValueChanged() {
    if (this.buyingPower) {
      this.totalCapital = Number(this.buyingPower) + Number(this.currentStockValue);
    }
  }

  onBuyingPowerChanged() {
    if (this.currentStockValue) {
      this.totalCapital = Number(this.buyingPower) + Number(this.currentStockValue);
    }
  }

  createStock(): FormGroup {
    return this.formBuilder.group({
      stockName: [''],
      shareNumbers: [''],
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
    const sum = this.initPercentage.reduce((partialSum, a) => partialSum + a, 0);

    if (sum !== 100) throw new Error("Percentage sum must equal to 100");

    this.results = [];

    let bp = this.buyingPower;
    const tc = this.totalCapital;
    const maxHeap = new PriorityQueue('max');
    for (let i = 0; i < this.stocks.length; i++) {
      if (!!this.stocks[i].controls['stockName']['value']) {
        const stockName = this.stocks[i].controls['stockName']['value'];
        const shareNumbers = this.stocks[i].controls['shareNumbers']['value'];
        let stockPrice = 0;
        const targetPercentage = this.stocks[i].controls['stockPercentage']['value'];

        const options = {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': 'b4ad6df1ebmsha41564313dcd338p185ff1jsn71767a01f781',
            'X-RapidAPI-Host': 'yh-finance.p.rapidapi.com'
          }
        };

        // Fetch a query to find out the price
        await fetch(`https://yh-finance.p.rapidapi.com/stock/v2/get-summary?symbol=${stockName}&region=US`, options)
        .then(response => response.text())
        .then(body => {
          console.log(body);
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

        const currentTotal = shareNumbers * stockPrice;
        this.stocks[i].controls['currentTotal'].setValue(currentTotal);

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
