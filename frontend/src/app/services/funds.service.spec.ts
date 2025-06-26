import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FundsService } from './funds.service';

describe('FundsService', () => {
  let service: FundsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FundsService]
    });
    service = TestBed.inject(FundsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
