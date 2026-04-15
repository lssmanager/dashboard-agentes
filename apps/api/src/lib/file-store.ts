import fs from 'node:fs';
import path from 'node:path';

export class JsonFileStore<T> {
  constructor(private readonly filePath: string, private readonly fallback: T) {}

  read(): T {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.fallback;
      }
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as T;
    } catch {
      return this.fallback;
    }
  }

  write(value: T): T {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(value, null, 2), 'utf-8');
    return value;
  }
}
