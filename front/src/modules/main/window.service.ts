// Provides information and methods for scrolling and manipulation of window size

import { Injectable, ElementRef } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';



export type WindowState = {
	scrollPos: number,
	height: number,
};



@Injectable()
export class WindowService {

	stream = new BehaviorSubject(this.windowState);


	constructor() {
		window.addEventListener('scroll', this.emitState);
		window.addEventListener('resize', this.emitState);
	}


	emitState = () => {
		this.stream.next(this.windowState);
	};


	scrollTo(elementRef: ElementRef): void {
		elementRef.nativeElement.scrollIntoView();
	}


	private get windowState(): WindowState {
		return {
			scrollPos: this.scrollPos,
			height: this.windowHeight,
		};
	}


	private get scrollPos(): number {
		return document.documentElement.scrollTop;
	}


	private get windowHeight(): number {
		return window.innerHeight;
	}

}