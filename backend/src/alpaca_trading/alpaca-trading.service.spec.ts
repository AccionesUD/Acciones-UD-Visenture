import { Test, TestingModule } from '@nestjs/testing';
import { AlpacaTradingService } from './alpaca-trading.service';

describe('MarketsService', () => {
  let service: AlpacaTradingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlpacaTradingService],
    }).compile();

    service = module.get<AlpacaTradingService>(AlpacaTradingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
