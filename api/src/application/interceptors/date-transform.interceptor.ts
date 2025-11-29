import { formatDateToString } from '../../common/utils/date.util';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.transformDates(data);
      }),
    );
  }

  private transformDates(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Se for um array, transforma cada item
    if (Array.isArray(data)) {
      return data.map((item) => this.transformDates(item));
    }

    // Se for um objeto, transforma recursivamente
    if (typeof data === 'object') {
      const transformed: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Se for a propriedade 'date', converte para string yyyy-mm-dd usando Luxon
          if (key === 'date') {
            if (typeof data[key] === 'string') {
              // Se já é string, garante que está no formato YYYY-MM-DD
              const dateStr = data[key] as string;
              if (dateStr.includes('T')) {
                // Se tem timestamp, pega apenas a parte da data
                transformed[key] = dateStr.split('T')[0];
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                // Já está no formato correto YYYY-MM-DD
                transformed[key] = dateStr;
              } else {
                // Tenta converter usando Luxon
                try {
                  const date = new Date(dateStr);
                  transformed[key] = formatDateToString(date);
                } catch {
                  transformed[key] = dateStr;
                }
              }
            } else if (data[key] instanceof Date) {
              // Converte Date para string yyyy-mm-dd usando Luxon no timezone America/Sao_Paulo
              transformed[key] = formatDateToString(data[key] as Date);
            } else {
              transformed[key] = data[key];
            }
          } else {
            // Recursivamente transforma outras propriedades
            transformed[key] = this.transformDates(data[key]);
          }
        }
      }
      return transformed;
    }

    return data;
  }
}
