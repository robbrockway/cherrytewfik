import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GalleryView } from './gallery.view';
import { LoadScreenService } from 'modules/main/load-screen';

import {
	Category,
	CategoryService,
	CategorySelector,
} from 'modules/main/models';




@Component({
	templateUrl: './category.view.html',
	styleUrls: ['./category.view.scss'],
})
export class CategoryView extends GalleryView<Category> {

	constructor(
		route: ActivatedRoute,
		categoryService: CategoryService,
		categorySelector: CategorySelector,
		loadScreenService: LoadScreenService
	) {
		super(route, categoryService, categorySelector, loadScreenService);
	}


	protected get categoryToHighlight(): Category {
		return this.category;
	}


	// Alias, for clarity
	get category(): Category {
		return this.instance as Category;
	}

}
