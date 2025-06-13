import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StockBar } from '../models/share.model';

@Injectable({ providedIn: 'root' })
export class MockChartDataService {
  // Genera datos simulados para representar barras en el formato esperado por el frontend (StockBar[])
  getMockData(symbol: string): StockBar[] {
    const now = Date.now();
    const basePrice = this.getBasePrice(symbol);
    
    return Array.from({ length: 30 }, (_, i) => {
      const timestamp = new Date(now - (29 - i) * 60000);
      const randomFactor = Math.random() * 2 - 1; // Entre -1 y 1
      const volatility = 0.05; // 5% de volatilidad
      
      const closePrice = basePrice * (1 + randomFactor * volatility);
      const openPrice = closePrice * (1 + (Math.random() * 0.02 - 0.01)); // ±1% del precio de cierre
      const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * 0.01); // Al menos tan alto como el más alto entre apertura y cierre
      const lowPrice = Math.min(openPrice, closePrice) * (1 - Math.random() * 0.01); // Al menos tan bajo como el más bajo entre apertura y cierre
      
      return {
        t: timestamp.toISOString(), // Timestamp
        o: parseFloat(openPrice.toFixed(2)), // Open price
        h: parseFloat(highPrice.toFixed(2)), // High price
        l: parseFloat(lowPrice.toFixed(2)), // Low price
        c: parseFloat(closePrice.toFixed(2)), // Close price
        v: Math.floor(Math.random() * 10000 + 1000) // Volume
      };
    });
  }

  // Genera datos simulados para diferentes escenarios de mercado
  getScenarioData(type: string): StockBar[] {
    const now = Date.now();
    const basePrice = 100;
    
    return Array.from({ length: 30 }, (_, i) => {
      const timestamp = new Date(now - (29 - i) * 60000);
      let closePrice = basePrice;
      
      switch (type) {
        case 'bull': 
          closePrice += i * 1 + Math.random();
          break;
        case 'bear': 
          closePrice -= i * 0.8 + Math.random();
          break;
        case 'sideways': 
          closePrice += Math.sin(i / 2) * 2;
          break;
        case 'volatile': 
          closePrice += (Math.random() - 0.5) * 20;
          break;
        case 'gap': 
          closePrice += i === 15 ? 20 : Math.random() * 3;
          break;
        default: 
          closePrice += Math.random() * 5;
          break;
      }
      
      // Generamos el resto de valores basados en el precio de cierre
      const openPrice = closePrice * (1 + (Math.random() * 0.02 - 0.01));
      const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * 0.01);
      const lowPrice = Math.min(openPrice, closePrice) * (1 - Math.random() * 0.01);
      
      return {
        t: timestamp.toISOString(),
        o: parseFloat(openPrice.toFixed(2)),
        h: parseFloat(highPrice.toFixed(2)),
        l: parseFloat(lowPrice.toFixed(2)),
        c: parseFloat(closePrice.toFixed(2)),
        v: Math.floor(Math.random() * 10000 + 1000)
      };
    });
  }
  
  // Devuelve un precio base realista dependiendo del símbolo
  private getBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'AAPL': 180.55,
      'MSFT': 337.80,
      'GOOGL': 131.25,
      'AMZN': 178.90,
      'META': 465.20,
      'TSLA': 175.40,
      'NVDA': 830.15,
      'JPM': 195.35,
      'JNJ': 147.75
    };
    
    return prices[symbol] || 100 + Math.random() * 200; // Valor por defecto aleatorio para símbolos no conocidos
  }
}