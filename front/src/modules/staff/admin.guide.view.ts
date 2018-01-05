import { Component } from '@angular/core';

import { UserService } from 'modules/main/models';
import { FlyoutService } from 'modules/main/flyout';
import { LoadScreenService } from 'modules/main/load-screen';
import { View } from 'modules/shared';



@Component({
	templateUrl: './admin.guide.view.html',
	styleUrls: ['./admin.guide.view.scss'],
})
export class AdminGuideView extends View {

	constructor(
		loadScreenService: LoadScreenService,
		public userService: UserService,
		private flyoutService: FlyoutService,
	) {
		super(loadScreenService);
	}


	ngAfterViewInit(): void {
		this.onReady();
	}


	showLogin(event: Event): void {
		// Else it'll bubble up to window, and close the flyout immediately after it's opened
		event.stopPropagation(); 

		this.flyoutService.focus('login');
	}

}