// Base class for the various types of Static[x]FieldComponent

import { Input } from '@angular/core';

import { SlowLoadingComponent } from 'modules/shared';


// Takes the field's 'tsValue' data type as a type parameter
export class TypedStaticFieldComponent<T> 
		extends SlowLoadingComponent {

	@Input() object: any;
	@Input() propertyName: string;
	@Input() label: string;


	get value(): T {
		try {
			return this.object[this.propertyName];
		} catch(TypeError) {
			return null;
		}
	}

}
