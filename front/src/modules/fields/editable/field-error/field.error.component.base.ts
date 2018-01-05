// For all [...]FieldErrorComponent types, and the master FieldErrorComponent that contains them

import { Input, Output, EventEmitter } from '@angular/core';



export abstract class FieldErrorComponentBase {

	@Input() message: string;	// error message
	@Output() tryAgain = new EventEmitter();	// Emits when user clicks a 'try again' link after error


	onTryAgainClick(event: Event): void {
		this.tryAgain.emit(event);
	}

}
