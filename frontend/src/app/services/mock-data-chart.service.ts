import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { format, subDays } from 'date-fns';

@Injectable({ providedIn: 'root' })
export class MockChartDataService {
  getMockData(symbol: string): { x: string; y: number }[] {
    const now = Date.now();
    return Array.from({ length: 30 }, (_, i) => ({
      x: new Date(now - (29 - i) * 60000).toISOString(),
      y: 100 + Math.random() * 20
    }));
  }

  getScenarioData(type: string): { x: string; y: number }[] {
    const base = 100;
    const now = Date.now();
    const data = Array.from({ length: 30 }, (_, i) => {
      const time = new Date(now - (29 - i) * 60000).toISOString();
      let y = base;

      switch (type) {
        case 'bull': y += i * 1 + Math.random(); break;
        case 'bear': y -= i * 0.8 + Math.random(); break;
        case 'sideways': y += Math.sin(i / 2) * 2; break;
        case 'volatile': y += (Math.random() - 0.5) * 20; break;
        case 'gap': y += i === 15 ? 20 : Math.random() * 3; break;
        default: y += Math.random() * 5; break;
      }

      return { x: time, y };
    });

    return data;
  }
}