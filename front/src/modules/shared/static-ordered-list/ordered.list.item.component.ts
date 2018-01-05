// Base class for StaticOrderedListItemComponent and Editable[Piece/Category]ListItemComponent

import { Input } from '@angular/core';

import { Observable } from 'rxjs/Observable';

import { GalleryModel } from 'modules/main/models';
import { SlowLoadingComponent } from 'modules/shared';



export abstract class OrderedListItemComponent<T extends GalleryModel>
		extends SlowLoadingComponent {

	@Input() object: T;
	@Input() reorder$: Observable<any>;	// Emits (no value) when list order changes

}
