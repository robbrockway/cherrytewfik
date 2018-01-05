// Left-hand nav bar ideally has a 'fixed' position, i.e. does not scroll with the rest of the page. However, sometimes it is too tall to fit in the window; then, it scrolls until its bottom is reached, when it once again becomes fixed.

import {
	Directive,
	Output,
	EventEmitter,
	ElementRef,
	HostListener,
} from '@angular/core';

import { WindowService, WindowState } from './window.service';



// fixed: fixed position, with top of nav bar at top of window
// moving: absolute position; scrolls with document
// sticky: fixed position, with bottom of nav bar at bottom of window
type NavCssClass = 'fixed' | 'moving' | 'sticky';



@Directive({
	selector: 'nav',
})
export class StickyNavBarDirective {

	private lastClass: NavCssClass;
	@Output() classChange = new EventEmitter<NavCssClass>();

	private scrollPos: number;
	private windowHeight: number;


	constructor(
		private elementRef: ElementRef,
		private windowService: WindowService
	) {
		this.windowService.stream.subscribe((state: WindowState) => {
			const newClass = this.getClassName(state);

			if(newClass !== this.lastClass)
				this.classChange.emit(newClass);

			this.lastClass = newClass;
		});
	}


	private getClassName(state: WindowState): NavCssClass {
		if(this.navHeight < state.height)
			return 'fixed';
		
		if(this.isScrolledBelowBottomOfNav(state))
			return 'sticky';

		return 'moving';
	}


	private get navHeight(): number {
		return this.nativeElement.offsetHeight;
	}


	private get nativeElement(): HTMLElement {
		return this.elementRef.nativeElement;
	};

	
	// True if bottom of window reaches below where bottom of nav would be, if it was positioned absolutely
	private isScrolledBelowBottomOfNav(state: WindowState): boolean {
		return state.scrollPos > this.navHeight - state.height;
	}

}