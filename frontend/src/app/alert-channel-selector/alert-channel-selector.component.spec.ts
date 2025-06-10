import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertChannelSelectorComponent } from './alert-channel-selector.component';

describe('AlertChannelSelectorComponent', () => {
  let component: AlertChannelSelectorComponent;
  let fixture: ComponentFixture<AlertChannelSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertChannelSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertChannelSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
