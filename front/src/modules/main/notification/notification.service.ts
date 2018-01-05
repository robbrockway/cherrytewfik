// 'Notifications' are short plain-text messages that appear in the top right of the screen, then fade out after a few seconds.

import { Injectable } from '@angular/core';

import { Subject } from 'rxjs/Subject';



@Injectable()
export class NotificationService {

	private notification$ = new Subject<string>();


	registerHandler(
		onShow: (message: string) => void
	): void {
		this.notification$.subscribe(onShow);
	}


	show(message: string): void {
		this.notification$.next(message);
	}

}