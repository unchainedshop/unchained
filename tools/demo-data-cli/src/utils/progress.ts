// CLI progress reporting utilities

export interface ProgressConfig {
  total: number;
  label: string;
}

export class ProgressReporter {
  private current = 0;
  private startTime: number;
  private label: string;
  private total: number;

  constructor(config: ProgressConfig) {
    this.total = config.total;
    this.label = config.label;
    this.startTime = Date.now();
  }

  update(current: number, message?: string): void {
    this.current = current;
    const percent = Math.round((current / this.total) * 100);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const bar = this.createBar(percent);

    process.stdout.write(
      `\r${this.label}: ${bar} ${percent}% (${current}/${this.total}) ${elapsed}s${message ? ` - ${message}` : ''}`,
    );
  }

  increment(message?: string): void {
    this.update(this.current + 1, message);
  }

  complete(): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    process.stdout.write(
      `\r${this.label}: ${this.createBar(100)} 100% (${this.total}/${this.total}) ${elapsed}s\n`,
    );
  }

  private createBar(percent: number): string {
    const width = 20;
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
  }
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

export function logSection(title: string): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(50));
}

export function logSuccess(message: string): void {
  console.log(`[OK] ${message}`);
}

export function logError(message: string): void {
  console.error(`[ERROR] ${message}`);
}

export function logInfo(message: string): void {
  console.log(`[INFO] ${message}`);
}
