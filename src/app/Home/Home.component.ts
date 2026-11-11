import { Component, inject } from '@angular/core';
import { GifListComponent } from './ui/gif-list/gif-list.component';
import { RedditService } from '../shared/data-access/reddit.service';

@Component({
  selector: 'app-home',
  imports: [GifListComponent],
  template: ` <app-gif-list class="grid-container" [gifs]="redditService.gifs()"></app-gif-list> `,
  styleUrl: './Home.css',
})
export default class HomeComponent {
  redditService = inject(RedditService);
}
