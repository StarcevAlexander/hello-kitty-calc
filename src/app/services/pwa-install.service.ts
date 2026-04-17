import { Injectable, signal, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: any = null;

  readonly canInstall = signal(false);
  readonly isInstalled = signal(false);
  readonly isDevMode = isDevMode();

  constructor() {
    this.detectInstalled();

    if (this.isInstalled()) return;

    if (isDevMode()) {
      // In dev mode ngsw-worker.js is not generated, so beforeinstallprompt
      // will never fire. Show a simulated install button for UI testing.
      this.canInstall.set(true);
      return;
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.deferredPrompt = null;
    });
  }

  private detectInstalled(): void {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      this.isInstalled.set(true);
      this.canInstall.set(false);
    }
  }

  async install(): Promise<void> {
    if (isDevMode()) {
      // Simulate installation in dev mode
      this.canInstall.set(false);
      this.isInstalled.set(true);
      console.info(
        '[PWA] Dev mode: install simulated. ' +
        'For real PWA install run: ng build && npx http-server dist/hello-kitty-calc/browser -p 8080'
      );
      return;
    }

    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.canInstall.set(false);
      this.isInstalled.set(true);
    }
    this.deferredPrompt = null;
  }
}
