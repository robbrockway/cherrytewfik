// for FieldComponent and FieldSwitchComponent

import { Input } from '@angular/core';

import { SlowLoadingComponent } from 'modules/shared';



export abstract class FieldComponentBase
		extends SlowLoadingComponent {

	@Input() object: any;
	@Input() propertyName: string;
	@Input() type: string;
	@Input() label: string;
	@Input() prefixText: string = '';
	
	// Extra parameters, for image fields
	@Input() widthList: number[];
	@Input() rootDirectory: string;


	get value(): any {
		if(!this.object)
			return null;

		return this.object[this.propertyName];
	}

}