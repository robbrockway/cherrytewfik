// A simple old 'Saving...' or 'Deleting...' message

import { Component } from '@angular/core';

import {
	SavingMessageComponentBase,
	SavingState,
} from './saving.message.component.base';



@Component({
	selector: 'plain-saving-message',
	templateUrl: './plain.saving.message.component.html',
})
export class PlainSavingMessageComponent extends SavingMessageComponentBase {}