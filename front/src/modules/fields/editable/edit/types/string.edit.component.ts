// Content-editable span element that outputs its new contents when blurred. Displays an 'Add <label>' message when empty.


import { Component,	ChangeDetectorRef } from '@angular/core';

import { PlainEditComponent } from './plain.edit.component';
import { isInstance, getLastItem } from 'utils';



@Component({
	selector: 'string-edit',
	templateUrl: './plain.edit.component.html',
	inputs: ['allowLinebreaks'],
})
export class StringEditComponent extends PlainEditComponent<string> {

	constructor(changeDetector: ChangeDetectorRef) {
		super(changeDetector);
	}


	protected internalValueToString(value: string) {
		return value;
	}


	protected stringToInternalValue(string: string) {
		return string;
	}

}