import { Component } from '@angular/core';

import { Category } from '../models';
import { CategoryListComponent } from './category.list.component';

import { OrderedListHostComponent }
	from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import { StaticOrEditableSlowLoadingComponentTest }
	from 'modules/shared/static.or.editable.slow.loading.component.test.base';

import {
	StaticOrEditableSubcomponentProfiles,
	MockStaticCategoryListDirective,
	MockEditableCategoryListDirective,
	testCategoryData,
} from 'testing';



@Component({
	template: `
		<category-list
			[objects]="objects"
			(load)="onLoad()"
		></category-list>
	`,
})
class HostComponent extends OrderedListHostComponent<Category> {

	constructor() {
		super(Category, testCategoryData);
	}

}



const subcomponentData = {
	static: {
		mockComponentType: MockStaticCategoryListDirective,
		realComponentName: 'StaticCategoryListComponent',
	},

	editable: {
		mockComponentType: MockEditableCategoryListDirective,
		realComponentName: 'EditableCategoryListComponent',
	},
};



class CategoryListComponentTest
		extends StaticOrEditableSlowLoadingComponentTest {

	constructor() {
		super(CategoryListComponent, HostComponent);
	}


	protected get subcomponentData(
	): StaticOrEditableSubcomponentProfiles {
		return subcomponentData;
	}


	protected get inputsToBeTransmitted(): any {
		// 'objects' list is already provided by host component, and doesn't need to be changed
		return {
			objects: this.hostComponent.objects,
		};
	}

}


new CategoryListComponentTest();
