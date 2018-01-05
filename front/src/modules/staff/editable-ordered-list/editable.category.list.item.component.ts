import { Component } from '@angular/core';

import { Category } from 'modules/main/models';

import { OrderedListItemComponent }
	from 'modules/shared/static-ordered-list/ordered.list.item.component';



@Component({
	selector: 'editable-category-list-item',
	templateUrl: './editable.category.list.item.component.html',
})
export class EditableCategoryListItemComponent
		extends OrderedListItemComponent<Category> {

	get message(): string {
		return this.category.deleting ? 'Deleting...' : null;
	}


	get category(): Category {
		return this.object;
	}

}