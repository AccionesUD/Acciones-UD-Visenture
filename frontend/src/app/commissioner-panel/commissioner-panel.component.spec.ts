import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommissionerPanelComponent } from './commissioner-panel.component';

describe('CommissionerPanelComponent', () => {
  let component: CommissionerPanelComponent;
  let fixture: ComponentFixture<CommissionerPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommissionerPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommissionerPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
