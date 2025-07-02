import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentPanelComponent } from './investment-panel.component';

describe('InvestmentPanelComponent', () => {
  let component: InvestmentPanelComponent;
  let fixture: ComponentFixture<InvestmentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
