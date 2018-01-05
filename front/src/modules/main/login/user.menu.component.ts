import {
	Component,
	Output,
	EventEmitter,
} from '@angular/core';

import { UserService } from 'modules/main/models';



type MenuItem = {
	label: string,
	eventEmitter: EventEmitter<any>,
};



@Component({
	selector: 'user-menu',
	templateUrl: './user.menu.component.html',
	styleUrls: ['./user.menu.component.scss'],
})
export class UserMenuComponent {

	@Output() logout = new EventEmitter();
	@Output() close = new EventEmitter();


	constructor(public userService: UserService) {}


	menu: MenuItem[] = [
		{label: 'Sign out', eventEmitter: this.logout},
	];


	closeBox(): void {
		this.close.emit();
	}

}