// Inputs and outputs for any edit component (i.e. field being actively edited)

import { Input, Output, EventEmitter, HostListener } from '@angular/core';



export abstract class EditComponentBase<T> {

	@Input() label: string;
	@Input() value: T;
	@Output() valueChange = new EventEmitter<T>();
	@Output() cancel = new EventEmitter();

}
