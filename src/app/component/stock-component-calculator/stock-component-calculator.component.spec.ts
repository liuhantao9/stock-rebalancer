import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockComponentCalculatorComponent } from './stock-component-calculator.component';

describe('StockComponentCalculatorComponent', () => {
  let component: StockComponentCalculatorComponent;
  let fixture: ComponentFixture<StockComponentCalculatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockComponentCalculatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockComponentCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
