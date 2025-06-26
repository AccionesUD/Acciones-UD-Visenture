import { Module } from '@nestjs/common';
import { AlpacaMarketService } from './services/alpaca_market.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                baseURL: configService.get('ALPACA_MARKET_BASE_URL'),
                headers: {
                    'APCA-API-KEY-ID': configService.get('ALPACA_API_KEY'),
                    'APCA-API-SECRET-KEY': configService.get('ALPACA_SECRET_KEY')
                }
            })
        })],
    providers: [AlpacaMarketService],
    exports: [AlpacaMarketService]
})
export class AlpacaMarketModule { }
