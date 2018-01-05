import { Component } from '@angular/core';

import { NotificationService } from './notification.service';



export const NOTIFICATION_TIME = 5000;



@Component({
	selector: 'notification',
	templateUrl: './notification.component.html',
	styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent {

	visible: boolean = false;
	message: string = '';


	constructor(private notificationService: NotificationService) {
		notificationService.registerHandler(
			(message: string) => this.show(message)
		);
	}


	private show(message: string): void {
		this.message = message;
		this.visible = true;

		setTimeout(
			() => this.hide(),
			NOTIFICATION_TIME
		);
	}


	private hide(): void {
		this.visible = false;
	}

}
