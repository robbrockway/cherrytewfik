import { Component } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { StaticCategoryListComponent }
	from './static.category.list.component';

import { Category } from 'modules/main/models';

import {
	StaticOrderedListComponentTest,
	OrderedListHostComponent,
} from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import {
	MockStaticCategoryListItemDirective,
	testCategoryData,
} from 'testing';



@Component({
	template: `
		<static-category-list
			[(objects)]="objects"
			(load)="onLoad()"
		></static-category-list>
	`,
})
class HostComponent extends OrderedListHostComponent<Category> {

	constructor() {
		super(Category, testCategoryData);
	}

}



class StaticCategoryListComponentTest
	extends StaticOrderedListComponentTest<Category> {

	constructor() {
		super(
			StaticCategoryListComponent,
			HostComponent,
			MockStaticCategoryListItemDirective
		);
	}

}


new StaticCategoryListComponentTest();