import { Component, Type } from '@angular/core';

import {
	TestBed,
	TestModuleMetadata,
	async,
} from '@angular/core/testing';

import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import {
	Category,
	CategoryService,
	CategorySelector,
	ReorderableModelService,
} from 'modules/main/models';

import { EditableCategoryListComponent }
	from './editable.category.list.component';

import { EditableOrderedListComponentTest }
	from './editable.ordered.list.component.test.base';

import { OrderedListHostComponent }
	from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import {
	testCategoryData,
	MockEditableCategoryListItemDirective,
	MockEditButtonsDirective,
	checkPKsAreEqual,
	mergeModuleMetadata,
} from 'testing';



@Component({
	template: `
		<editable-category-list
			[(objects)]="objects"
			(load)="onLoad()"
		></editable-category-list>
	`,
})
class HostComponent extends OrderedListHostComponent<Category> {

	constructor() {
		super(Category, testCategoryData);
	}

}



class EditableCategoryListComponentTest 
		extends EditableOrderedListComponentTest<Category> {

	private selectedCategory$ = new BehaviorSubject<Category>(null);


	constructor() {
		super(
			EditableCategoryListComponent,
			HostComponent,
			MockEditableCategoryListItemDirective
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			providers: [
				{
					provide: Router,
					useFactory: this.createMockRouter,
				},

				{
					provide: CategorySelector,
					useValue: this.selectedCategory$,
				},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockRouter(): any {
		const methodNames = ['navigate'];
		return jasmine.createSpyObj('Router', methodNames);
	}


	protected defineTests(): void {
		super.defineTests();

		let selectFirstCategory: () => void;
		let deleteFirstCategory: () => void;


		it('should navigate back to home view when currently-selected '
				+ 'category is deleted', async(() => {
			selectFirstCategory();
			deleteFirstCategory();

			const mockRouter = TestBed.get(Router);
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
		}));


		selectFirstCategory = () => {
			const firstCategory = this.hostComponent.objects[0];
			this.selectedCategory$.next(firstCategory);
		};

		
		deleteFirstCategory = () => {
			const firstMockEditButtonsComponent =
				this.getChildDirective(MockEditButtonsDirective);

			firstMockEditButtonsComponent.delete.emit();
		};

	}


	protected get modelType(): Type<Category> {
		return Category;
	}


	protected get modelServiceType():
			Type<ReorderableModelService<Category>> {

		return CategoryService;
	}

}


new EditableCategoryListComponentTest();