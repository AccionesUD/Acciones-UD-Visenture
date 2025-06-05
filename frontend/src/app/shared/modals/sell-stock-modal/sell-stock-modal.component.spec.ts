import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellStockModalComponent } from './sell-stock-modal.component';

describe('SellStockModalComponent', () => {
  let component: SellStockModalComponent;
  let fixture: ComponentFixture<SellStockModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellStockModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellStockModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
