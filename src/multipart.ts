import * as fs from 'fs';
import * as path from 'path';

export class MultipartFile {
  public buffer: Buffer;
  public filename: string;
  public content_type: string;

  constructor(filePath: string, filename?: string, contentType?: string) {
    this.buffer = fs.readFileSync(filePath);
    this.filename = filename || this._basename(filePath);
    this.content_type = contentType || 'application/octet-stream';
  }

  private _basename(filePath: string): string {
    return path.basename(filePath);
  }
}

export function file(filePath: string, filename?: string, contentType?: string): MultipartFile {
  return new MultipartFile(filePath, filename, contentType);
}