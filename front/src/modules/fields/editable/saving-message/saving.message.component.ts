// Decides, based on field type, which kind of message to display while a field is saving or deleting. Will wrap either a PlainSavingMessageComponent or an ImageSavingMessageComponent.

import { Component, Input } from '@angular/core';

import { SavingMessageComponentBase }
	from './saving.message.component.base';

import { isImageFieldType } from 'utils';



@Component({
	selector: 'saving-message',
	templateUrl: './saving.message.component.html',
})
export class SavingMessageComponent extends SavingMessageComponentBase {

	@Input() type: string;	// Same possibilities as for the 'type' given to any field or edit component


	get hasImageType(): boolean {
		return isImageFieldType(this.type);
	}

}


