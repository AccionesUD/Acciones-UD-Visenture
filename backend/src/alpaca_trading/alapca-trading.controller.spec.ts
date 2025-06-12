import { Test, TestingModule } from '@nestjs/testing';
import { AlpacaTradingController} from './alpaca-trading.controller';

describe('MarketsController', () => {
  let controller: AlpacaTradingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlpacaTradingController],
    }).compile();

    controller = module.get<AlpacaTradingController>(AlpacaTradingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
