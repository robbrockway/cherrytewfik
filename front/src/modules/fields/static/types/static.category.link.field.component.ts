// Field, for pieces, that takes the form of a link back to the piece's parent category

import { Component } from '@angular/core';

import { Category } from 'modules/main/models';

import { FastLoadingStaticFieldComponent }
	from '../fast.loading.static.field.component';



const defaultLinkText = 'Untitled category';



@Component({
	selector: 'static-category-link-field',
	templateUrl: './static.category.link.field.component.html'
})
export class StaticCategoryLinkFieldComponent 
		extends FastLoadingStaticFieldComponent<Category> {

	get linkText(): string {
		return this.category.name || defaultLinkText;
	}


	// Alias
	get category(): Category {
		return this.value;
	}

}