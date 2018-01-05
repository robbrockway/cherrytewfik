// Subclass of TypedStaticFieldComponent and superclass of most of the fields in ./types; emits its load event immediately after view is initialised

import { SimpleChanges } from '@angular/core';

import { TypedStaticFieldComponent }
	from './typed.static.field.component';



export abstract class FastLoadingStaticFieldComponent<T>
		extends TypedStaticFieldComponent<T> {

	ngOnChanges(changes: SimpleChanges): void {
		if(changes['object'])	// new object
			this.load.emit();
	}

}