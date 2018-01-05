// Common features (currently just a 'state' input) for all [...]SavingMessageComponent types as well as their container SavingMessageComponent

import { Input } from '@angular/core';


export enum SavingState {
	Saving,
	Deleting,
}



export abstract class SavingMessageComponentBase {

	SavingState = SavingState;	// for templates
	@Input() state: SavingState;

}
