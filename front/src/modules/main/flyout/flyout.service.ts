// Passes messages to flyouts from other components, requesting their focus – e.g. a 'log in' link on the page will pass the 'login' key through .focus$, and the flyout itself will receive it.

import { Injectable } from '@angular/core';

import { Subject } from 'rxjs/Subject';



@Injectable()
export class FlyoutService {

	private focusSubject = new Subject<string>();
	focus$ = this.focusSubject.asObservable();


	// Key should match with the [key] input of one FlyoutComponent
	focus(flyoutKey: string): void {
		this.focusSubject.next(flyoutKey);
	}

}
