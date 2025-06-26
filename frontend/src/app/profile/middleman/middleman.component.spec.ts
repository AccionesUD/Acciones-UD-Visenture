import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddlemanComponent } from './middleman.component';

describe('MiddlemanComponent', () => {
  let component: MiddlemanComponent;
  let fixture: ComponentFixture<MiddlemanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiddlemanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiddlemanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
