import { TestModuleMetadata, async } from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';

import { Category } from './category';
import { CategoryService } from './category.service';
import { PieceService } from '../piece';

import { ReorderableModelServiceTest }
	from '../reorderable.model.service.test.base';

import {
	ModelTestData,
	testCategoryData,
	mergeModuleMetadata,
} from 'testing';



class CategoryServiceTest extends ReorderableModelServiceTest<Category> {

	constructor() {
		super(CategoryService, Category);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();
		const extraMetadata = {providers: [PieceService]};
		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected initTestData(): ModelTestData<Category> {
		return testCategoryData;
	}

}


new CategoryServiceTest();
