import {
	Component,
	Input,
} from '@angular/core';

import { Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import {
	Category,
	CategoryService,
	CategorySelector,
	UserService,
} from 'modules/main/models';

import { NotificationService } from 'modules/main/notification';

import { EditableOrderedListComponent }
	from './editable.ordered.list.component';



@Component({
	selector: 'editable-category-list',
	templateUrl: './editable.category.list.component.html',
	styleUrls: ['./editable.category.list.component.scss'],
})
export class EditableCategoryListComponent 
		extends EditableOrderedListComponent<Category> {

	private selectedCategory: Category;
	private categorySelectorSub: Subscription;


	constructor(
		categoryService: CategoryService,
		notificationService: NotificationService,
		userService: UserService,
		private categorySelector: CategorySelector,
		private router: Router
	) {
		super(categoryService, notificationService, userService);
	}


	ngOnInit(): void {
		this.categorySelectorSub = this.categorySelector.subscribe(
			(category: Category) => this.selectedCategory = category
		);
	}


	ngOnDestroy(): void {
		this.categorySelectorSub.unsubscribe();
	}


	delete(category: Category): void {
		if(category === this.selectedCategory) {
			const homeRoute = ['/'];
			this.router.navigate(homeRoute);
		}
		
		super.delete(category);
	}

}
