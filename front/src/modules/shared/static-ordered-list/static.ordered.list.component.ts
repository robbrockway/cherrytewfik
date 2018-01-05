// Base class for PieceListComponent and CategoryListComponent, until StaffModule is loaded; then they are replaced by other versions which derive from EditableOrderedListComponent

import {
	Input,
	Output,
	EventEmitter,
	SimpleChanges,
} from '@angular/core';

import { SlowLoadingListComponent } from 'modules/shared';
import { GalleryModel } from 'modules/main/models';
import { removeFromArray } from 'utils';



export abstract class StaticOrderedListComponent<T extends GalleryModel>
		extends SlowLoadingListComponent<T> {

	@Input() objects: T[];

	// Won't be used, but is necessary for the two-way binding with 'objects' which will later be used when this component is replaced by its editable, StaffModule version
	@Output() objectsChange = new EventEmitter<T[]>();


	ngOnChanges(changes: SimpleChanges): void {
		if(changes.objects.currentValue)
			this.recordItemsYetToLoad();
	}


	// Override; flags the list-item subcomponents that have to be ready before this component can say it's ready itself
	protected recordItemsYetToLoad(): void {
		this.itemsYetToLoad = Array.from(this.objects);
		
		if(this.allItemsHaveLoaded)
			this.onReady();
	}

}