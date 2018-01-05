import { Component } from '@angular/core';

import { Category } from 'modules/main/models';

import {
	EditableOrderedListItemHostComponent,
	EditableOrderedListItemComponentTest,
} from './editable.ordered.list.item.component.test.base';

import { EditableCategoryListItemComponent }
	from './editable.category.list.item.component';

import {
	MockStaticCategoryListItemDirective,
	testCategoryData,
} from 'testing';



@Component({
	template: `
		<editable-category-list-item
			[object]="object"
			[reorder$]="reorder$"
			(load)="onLoad()"
		>
			<span class="injectedContent">{{injectedText}}</span>
		</editable-category-list-item>
	`,
})
class HostComponent extends EditableOrderedListItemHostComponent<Category> {

	constructor() {
		super();

		const instanceData = testCategoryData.instances[0];
		this.object = instanceData.toModelInstance();
	}

}



class EditableCategoryListItemComponentTest
		extends EditableOrderedListItemComponentTest<Category> {

	constructor() {
		super(
			EditableCategoryListItemComponent,
			HostComponent,
			MockStaticCategoryListItemDirective
		);
	}


	protected defineTests(): void {
		super.defineTests();


		let setCategoryToDeleting: () => void;


		it('should tell StaticCategoryListItemComponent to display '
				+ `'Deleting...' message while category is being deleted`,
				() => {
			setCategoryToDeleting();

			const mockStaticCategoryListItemComponent =
				this.getChildDirective(MockStaticCategoryListItemDirective);

			expect(mockStaticCategoryListItemComponent.message)
				.toBe('Deleting...');
		});


		setCategoryToDeleting = () => {
			this.hostComponent.object.deleting = true;
			this.fixture.detectChanges();
		};

	}

}


new EditableCategoryListItemComponentTest();