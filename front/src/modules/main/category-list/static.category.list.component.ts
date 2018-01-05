import { Component } from '@angular/core';

import { StaticOrderedListComponent }
	from 'modules/shared/static-ordered-list';

import { Category } from 'modules/main/models';



@Component({
	selector: 'static-category-list',
	templateUrl: './static.category.list.component.html',
})
export class StaticCategoryListComponent
	extends StaticOrderedListComponent<Category> {}
