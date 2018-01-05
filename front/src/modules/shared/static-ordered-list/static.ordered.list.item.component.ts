// Base class for StaticPieceListItemComponent and StaticCategoryListItemComponent

import { Input } from '@angular/core';

import { GalleryModel } from 'modules/main/models';
import { OrderedListItemComponent } from './ordered.list.item.component';



export abstract class StaticOrderedListItemComponent<T extends GalleryModel>
		extends OrderedListItemComponent<T> {

	@Input() linkEnabled = true;	// Will be disabled e.g. while item is being deleted

}