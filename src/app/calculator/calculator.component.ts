import { Component, inject, signal, computed } from '@angular/core';
import { PwaInstallService } from '../services/pwa-install.service';

type CalcButton = {
  label: string;
  type: 'number' | 'operator' | 'action' | 'equals' | 'zero';
  value: string;
};

@Component({
  selector: 'app-calculator',
  standalone: true,
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  readonly pwa = inject(PwaInstallService);

  private expression = signal('');
  private justEvaluated = false;

  readonly display = computed(() => this.expression() || '0');

  readonly buttons: CalcButton[] = [
    { label: 'C', type: 'action', value: 'clear' },
    { label: '+/-', type: 'action', value: 'negate' },
    { label: '%', type: 'operator', value: '%' },
    { label: '÷', type: 'operator', value: '/' },

    { label: '7', type: 'number', value: '7' },
    { label: '8', type: 'number', value: '8' },
    { label: '9', type: 'number', value: '9' },
    { label: '×', type: 'operator', value: '*' },

    { label: '4', type: 'number', value: '4' },
    { label: '5', type: 'number', value: '5' },
    { label: '6', type: 'number', value: '6' },
    { label: '−', type: 'operator', value: '-' },

    { label: '1', type: 'number', value: '1' },
    { label: '2', type: 'number', value: '2' },
    { label: '3', type: 'number', value: '3' },
    { label: '+', type: 'operator', value: '+' },

    { label: '0', type: 'zero', value: '0' },
    { label: '.', type: 'number', value: '.' },
    { label: '=', type: 'equals', value: 'equals' },
  ];

  press(btn: CalcButton): void {
    switch (btn.value) {
      case 'clear':
        this.expression.set('');
        this.justEvaluated = false;
        break;

      case 'negate': {
        const val = this.expression();
        if (!val) return;
        if (val.startsWith('-')) {
          this.expression.set(val.slice(1));
        } else {
          this.expression.set('-' + val);
        }
        break;
      }

      case 'equals':
        this.evaluate();
        break;

      case '%': {
        const expr = this.expression();
        if (!expr) return;
        try {
          const result = this.safeEval(expr) / 100;
          this.expression.set(String(result));
          this.justEvaluated = true;
        } catch {
          this.expression.set('Ошибка');
        }
        break;
      }

      default:
        if (this.justEvaluated && btn.type === 'number') {
          this.expression.set(btn.value);
          this.justEvaluated = false;
        } else {
          if (this.justEvaluated && btn.type === 'operator') {
            this.justEvaluated = false;
          }
          const cur = this.expression();
          const lastChar = cur.slice(-1);
          const isOperator = ['+', '-', '*', '/'].includes(btn.value);
          const isLastOperator = ['+', '-', '*', '/'].includes(lastChar);

          if (isOperator && isLastOperator) {
            this.expression.set(cur.slice(0, -1) + btn.value);
          } else {
            this.expression.set(cur + btn.value);
          }
        }
    }
  }

  private evaluate(): void {
    const expr = this.expression();
    if (!expr) return;
    try {
      const result = this.safeEval(expr);
      this.expression.set(
        Number.isFinite(result) ? String(result) : 'Ошибка'
      );
      this.justEvaluated = true;
    } catch {
      this.expression.set('Ошибка');
    }
  }

  private safeEval(expr: string): number {
    // Allow only digits, operators, dots and parentheses
    if (!/^[\d\s+\-*/().]+$/.test(expr)) throw new Error('Invalid expression');
    return Function('"use strict"; return (' + expr + ')')() as number;
  }

  installApp(): void {
    this.pwa.install();
  }
}
