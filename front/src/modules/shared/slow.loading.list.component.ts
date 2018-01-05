// A component consisting of a list of subcomponents of a particular type. Each subcomponent emits a load event, and when they've all emitted, this component in turn emits its own load event.

import { SlowLoadingComponent } from './slow.loading.component';
import { removeFromArray } from 'utils';



// T: type of object (e.g. Piece, or PieceNavigatorButton) that's being listed
export abstract class SlowLoadingListComponent<T> 
		extends SlowLoadingComponent {

	protected itemsYetToLoad: T[];	// to be filled by subclass


	onItemLoad(item: T) {
		removeFromArray(
			this.itemsYetToLoad,
			item
		);

		if(this.allItemsHaveLoaded)
			this.load.emit();
	}


	protected get allItemsHaveLoaded(): boolean {
		return this.itemsYetToLoad.length === 0;
	}

}
