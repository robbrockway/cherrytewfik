// Sends messages from views (router components) to the main AppComponent, to handle hiding and showing of the load screen


import { Injectable } from '@angular/core';

import { Subject } from 'rxjs/Subject';



@Injectable()
export class LoadScreenService {

	private visibilitySubject = new Subject<boolean>();	// true for visible; false for hidden
	visibility$ = this.visibilitySubject.asObservable();	// public, but not writable


	show(): void {
		this.visibilitySubject.next(true);
	}


	hide(): void {
		this.visibilitySubject.next(false);
	}

}
