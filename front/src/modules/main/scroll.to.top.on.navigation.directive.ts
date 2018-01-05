// Listens for navigation by router – unless it has resulted from back/forward button – and scrolls the chosen element into view once navigation is complete

import { Directive, ElementRef } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { Location, PopStateEvent } from '@angular/common';

import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/filter';

import { WindowService } from './window.service';



@Directive({
	selector: '[scrollToTopOnNavigation]',
})
export class ScrollToTopOnNavigationDirective {

	// Set when user navigates back/forward, and unset after navigation
	private goingBackOrForwardToUrl: string;
	private locationSub: any;
	private routerSub: Subscription;


	constructor(
		private elementRef: ElementRef,
		private router: Router,
		private location: Location,
		private windowService: WindowService
	) {
		this.locationSub = location.subscribe((event: PopStateEvent) => {
			this.goingBackOrForwardToUrl = event.url || '/';
		});

		this.routerSub = router.events.filter(
			this.shouldScrollInResponseToEvent
		).subscribe((event: Event) => {
			windowService.scrollTo(elementRef);
			this.goingBackOrForwardToUrl = null;
		});
	}


	private shouldScrollInResponseToEvent = (event: Event) =>
		event instanceof NavigationEnd
			&& this.goingBackOrForwardToUrl !== event.url;


	ngOnDestroy(): void {
		for(let sub of [this.locationSub, this.routerSub])
			sub.unsubscribe();
	}

}
