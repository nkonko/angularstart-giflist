import { Component, computed, effect, ElementRef, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { fromEvent, Subject, switchMap } from 'rxjs';

interface GifPlayerState {
  playing: boolean;
  status: 'initial' | 'loading' | 'loaded';
}

@Component({
  imports: [MatProgressSpinnerModule],
  selector: 'app-gif-player',
  styleUrls: ['./gif-player.css'],
  template: `
    @if (status() === 'loading') {
      <mat-progress-spinner mode="indeterminate" diameter="50" />
    }
    <div
      class="preload-background"
      [style.background]="'url(' + thumbnail() + ') 50% 50% / cover no-repeat'"
      [class.blur]="
        status() !== 'loaded' && !['/assets/nsfw.png', '/assets/default.png'].includes(thumbnail())
      "
    >
      <video
        (click)="togglePlay$.next()"
        #gifPlayer
        playsinline
        [src]="src()"
        [muted]="true"
        [loop]="true"
        preload="none"
      ></video>
    </div>
  `,
})
export class GifPlayerComponent {
  src = input.required<string>();
  thumbnail = input.required<string>();

  videoElement = viewChild.required<ElementRef<HTMLVideoElement>>('gifPlayer');
  videoElement$ = toObservable(this.videoElement);

  state = signal<GifPlayerState>({
    playing: false,
    status: 'initial',
  });

  playing = computed(() => this.state().playing);
  status = computed(() => this.state().status);

  togglePlay$ = new Subject<void>();

  videoLoadStart$ = this.togglePlay$.pipe(
    switchMap(() => this.videoElement$),
    switchMap(({ nativeElement }) => fromEvent(nativeElement, 'loadeddata')),
  );

  videoLoadComplete$ = this.videoElement$.pipe(
    switchMap(({ nativeElement }) => fromEvent(nativeElement, 'loadeddata')),
  );

  constructor() {
    this.videoLoadStart$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.state.update((state) => ({ ...state, status: 'loading' })));

    this.videoLoadComplete$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.state.update((state) => ({ ...state, status: 'loaded' })));

    this.togglePlay$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.state.update((state) => ({ ...state, playing: !state.playing })));

    effect(() => {
      const { nativeElement: video } = this.videoElement(); /// => const video = this.videoElement().nativeElement;
      const playing = this.playing();
      const status = this.status();

      if (!video) return;

      if (playing && status === 'initial') {
        video.load();
      }

      if (status === 'loaded') {
        playing ? video.play() : video.pause();
      }
    });
  }
}
