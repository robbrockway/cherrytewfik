// Shows an error message after an attempt to edit a field

import {
	Component,
	Input,
	Output,
	EventEmitter,
	HostListener,
} from '@angular/core';

import { FieldErrorComponentBase } from './field.error.component.base';
import { isImageFieldType } from 'utils';



@Component({
	selector: 'field-error',
	templateUrl: './field.error.component.html',
})
export class FieldErrorComponent extends FieldErrorComponentBase {

	@Input() type: string;	// field type ('string', 'multiline', 'image' etc)
	@Output() giveUp = new EventEmitter();	// Stop trying to edit; return to static field


	get hasImageType(): boolean {
		return isImageFieldType(this.type);
	}


	onTryAgainClick(event: Event): void {
		// If click bubbles up to window level, it could mess with other components' input
		if(event)
			event.stopPropagation();

		super.onTryAgainClick(event);
	}


	@HostListener('window:keyup.escape')
	@HostListener('window:click')
	triggerGiveUp(): void {
		this.giveUp.emit();
	}

}