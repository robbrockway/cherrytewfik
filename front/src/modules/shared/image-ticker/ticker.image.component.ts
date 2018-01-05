import { Component, Input } from '@angular/core';

import { SlowLoadingComponent } from '../slow.loading.component';



// First three properties should be set externally; rest are used internally by this component and ImageTickerComponent
export type TickerImage = {
	filename: string;
	alt?: string;
	routerLink?: string;

	src?: string;
	srcset?: string;
	preloadedImage?: HTMLImageElement;
	visible?: boolean;
	moving?: boolean;	// Animation is running
};



@Component({
	selector: 'ticker-image',
	templateUrl: './ticker.image.component.html',
	styleUrls: ['./ticker.image.component.scss'],
})
export class TickerImageComponent extends SlowLoadingComponent {

	@Input() image: TickerImage;
	@Input() fadeTransition: string;	// CSS transition property
	@Input() animationDuration: number;	// in ms
	@Input() foreground = false;
	@Input() showLink = false;

}