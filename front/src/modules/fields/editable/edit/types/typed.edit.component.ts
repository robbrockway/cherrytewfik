// Base class for all other edit components in this folder

import { HostListener } from '@angular/core';

import { EditComponentBase } from '../edit.component.base';



export abstract class TypedEditComponent<T> extends EditComponentBase<T> {

	@HostListener('window:keyup.escape')
	onEscape(): void {
		this.cancel.emit();
	}

}
