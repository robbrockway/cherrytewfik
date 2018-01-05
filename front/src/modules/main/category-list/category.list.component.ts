import { Component } from '@angular/core';

import { SlowLoadingComponent } from 'modules/shared';

import { StaticOrderedListComponent }
	from 'modules/shared/static-ordered-list';

import { Category, UserService } from '../models';



@Component({
	selector: 'category-list',
	templateUrl: './category.list.component.html',
})
export class CategoryListComponent
		extends StaticOrderedListComponent<Category> {

	constructor(public userService: UserService) {
		super();
	}

}