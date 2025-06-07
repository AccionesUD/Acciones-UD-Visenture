import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { format, subDays } from 'date-fns';

@Injectable({ providedIn: 'root' })
export class MockChartDataService {
  // Método base modificable para todos los escenarios
  private generateBaseData(
    symbol: string,
    days: number,
    trend: number = 0, // 0 = neutral, >0 = alcista, <0 = bajista
    volatility: number = 0.02,
    startPrice?: number
  ) {
    const mockData = [];
    let basePrice = startPrice || this.getBasePrice(symbol);
    const baseVolume = 1000000;

    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      
      // Aplicar tendencia (pequeño incremento/decremento diario)
      const dailyTrend = basePrice * (trend / days);
      basePrice += dailyTrend;
      
      // Generar valores OHLC con volatilidad
      const open = basePrice;
      const high = open * (1 + volatility * Math.random());
      const low = open * (1 - volatility * Math.random());
      const close = low + (high - low) * Math.random();
      
      // Asegurar que la tendencia general se mantenga
      basePrice = close;
      
      // Ajustar máximos y mínimos según la tendencia
      const adjustedHigh = trend >= 0 ? high : high * 0.98;
      const adjustedLow = trend <= 0 ? low : low * 1.02;
      const adjustedClose = trend > 0 
        ? Math.max(close, open * 1.01) 
        : trend < 0 
          ? Math.min(close, open * 0.99)
          : close;

      mockData.push({
        t: format(date, 'yyyy-MM-dd'),
        o: parseFloat(open.toFixed(2)),
        h: parseFloat(adjustedHigh.toFixed(2)),
        l: parseFloat(adjustedLow.toFixed(2)),
        c: parseFloat(adjustedClose.toFixed(2)),
        v: Math.floor(baseVolume * (0.8 + 0.4 * Math.random()))
      });
    }

    return mockData;
  }

  // Mercado Alcista (precios suben consistentemente)
  generateBullMarket(symbol: string, days: number = 30): any {
    const trend = 0.05; // 5% de tendencia alcista total
    const startPrice = this.getBasePrice(symbol) * 0.7; // Empieza bajo
    
    return of({
      bars: this.generateBaseData(symbol, days, trend, 0.03, startPrice),
      symbol: symbol,
      next_page_token: null
    });
  }

  // Mercado Bajista (precios caen consistentemente)
  generateBearMarket(symbol: string, days: number = 30): any {
    const trend = -0.05; // 5% de tendencia bajista total
    const startPrice = this.getBasePrice(symbol) * 1.3; // Empieza alto
    
    return of({
      bars: this.generateBaseData(symbol, days, trend, 0.04, startPrice),
      symbol: symbol,
      next_page_token: null
    });
  }

  // Mercado Lateral (sin tendencia clara)
  generateSidewaysMarket(symbol: string, days: number = 30): any {
    return of({
      bars: this.generateBaseData(symbol, days, 0, 0.015),
      symbol: symbol,
      next_page_token: null
    });
  }

  // Mercado Volátil (grandes fluctuaciones)
  generateVolatileMarket(symbol: string, days: number = 30): any {
    return of({
      bars: this.generateBaseData(symbol, days, 0, 0.08),
      symbol: symbol,
      next_page_token: null
    });
  }

  // Mercado con Gap (simula noticias impactantes)
  generateMarketWithGap(symbol: string, days: number = 30, gapDay: number = 15, gapPercent: number = 0.1): any {
    const data = this.generateBaseData(symbol, days);
    
    // Aplicar un gap significativo en el día especificado
    if (data[gapDay]) {
      const isPositiveGap = Math.random() > 0.5;
      const gapMultiplier = isPositiveGap ? (1 + gapPercent) : (1 - gapPercent);
      
      data[gapDay].o = data[gapDay-1].c * gapMultiplier;
      data[gapDay].h = data[gapDay].o * (1 + 0.02);
      data[gapDay].l = data[gapDay].o * (1 - 0.02);
      data[gapDay].c = data[gapDay].o * (1 + (isPositiveGap ? 0.01 : -0.01));
    }
    
    return of({
      bars: data,
      symbol: symbol,
      next_page_token: null
    });
  }

  private getBasePrice(symbol: string): number {
    const basePrices: {[key: string]: number} = {
      'AAPL': 180, 'MSFT': 340, 'TSLA': 200, 
      'AMZN': 145, 'GOOGL': 135, 'META': 320,
      'NVDA': 300, 'NFLX': 350, 'SPY': 450
    };
    return basePrices[symbol] || 100;
  }

  generateMockData(symbol: string): Observable<{ bars: any[] }> {
    // Generate mock bar data for the chart
    const bars = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      bars.push({
        t: date.toISOString(),
        o: 100 + Math.random() * 10,
        h: 110 + Math.random() * 10,
        l: 90 + Math.random() * 10,
        c: 100 + Math.random() * 10,
        v: Math.floor(Math.random() * 1000 + 100)
      });
    }
    return of({ bars });
  }
}