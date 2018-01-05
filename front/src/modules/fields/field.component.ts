// Wrapper for FieldSwitchComponent, mainly for handling .prefixText, which will be visible if the field has a value and otherwise not.


import {
	Component,
	Input,
	Inject,
	forwardRef
} from '@angular/core';

import { UserService } from 'modules/main/models';
import { FieldComponentBase } from './field.component.base';



@Component({
	selector: 'field',
	templateUrl: './field.component.html',
})
export class FieldComponent extends FieldComponentBase {

	constructor(public userService: UserService) {
		super();
	}

}