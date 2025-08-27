import * as crypto from 'crypto';

export class SailthruUtil {
  static getSignatureHash(params: Record<string, any>, secret: string): string {
    return SailthruUtil.md5(SailthruUtil.getSignatureString(params, secret));
  }

  static getSignatureString(params: Record<string, any>, secret: string): string {
    return secret + SailthruUtil.extractParamValues(params).sort().join('');
  }

  static md5(data: string): string {
    const md5 = crypto.createHash('md5');
    md5.update(data, 'utf8');
    return md5.digest('hex');
  }

  static extractParamValues(params: any): (string | number)[] {
    const values: (string | number)[] = [];
    
    for (const k in params) {
      const v = params[k];
      if (v instanceof Array) {
        const temp = SailthruUtil.extractParamValues(v);
        values.push(...temp);
      } else if (typeof v === 'string' || typeof v === 'number') {
        values.push(v);
      } else if (typeof v === 'boolean') {
        values.push(v === true ? 1 : 0);
      } else if (v && typeof v === 'object') {
        values.push(...SailthruUtil.extractParamValues(v));
      }
    }
    
    return values;
  }
}

export function log(message: string): void {
  console.log(new Date().toLocaleString(), `sailthru-client - ${message}`);
}