// Base class for StaticImageFieldComponent and StaticThumbnailFieldComponent, providing image-related inputs


import { Input, SimpleChanges, SimpleChange } from '@angular/core';

import { TypedStaticFieldComponent } from '../typed.static.field.component';



export abstract class StaticImageFieldComponentBase 
		extends TypedStaticFieldComponent<string> {

	// fullImageSize constant from utils.ts can be used as a 'width', as well as pixel values
	@Input() widthList: number[];
	
	@Input() rootDirectory: string;


	ngOnChanges(changes: SimpleChanges): void {
		// Parent components, once changed, need to be aware that this component is loaded and ready for business even if its image hasn't changed at all (e.g. on navigation from one PieceView to its sibling)
		if(this.objectHasChangedButImageHasnt(changes))
			this.onReady();
	}


	private objectHasChangedButImageHasnt(
		changes: SimpleChanges
	): boolean {
		if(!changes.object || !changes.object.previousValue)
			return false;

		const oldObject = changes.object.previousValue;
		const newObject = changes.object.currentValue;

		return oldObject[this.propertyName]
			=== newObject[this.propertyName];
	}

}