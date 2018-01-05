import { Component } from '@angular/core';

import { Category, CategoryService } from 'modules/main/models';
import { TypedEditComponent } from './typed.edit.component';
import { getFirstItemWhere } from 'utils';



const promptText = 'Select a category';



@Component({
	selector: 'category-link-edit',
	templateUrl: './category.link.edit.component.html',
	styleUrls: ['./category.link.edit.component.scss'],
})
export class CategoryLinkEditComponent extends TypedEditComponent<Category> {

	categories: Category[] = [];
	selectedCategory: Category = null;
	defaultOptionText = 'Untitled category';


	constructor(private categoryService: CategoryService) {
		super();
	}


	ngOnInit(): void {
		this.categories = this.categoryService.cache;
	}


	get defaultText(): string {
		return this.value ?
			this.value.name || this.defaultOptionText :
			promptText;
	}

	
	onChange(): void {
		this.valueChange.emit(this.selectedCategory);
	}

}
