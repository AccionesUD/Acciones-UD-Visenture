import { TestBed } from '@angular/core/testing';

import { AlpacaDataService } from './alpaca-data.service';

describe('AlpacaDataService', () => {
  let service: AlpacaDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlpacaDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
