// Base class for testing subclasses of StaticOrderedListComponent

import { Type } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GalleryModel } from 'modules/main/models';

import { SlowLoadingHostComponent }
	from 'modules/shared/slow.loading.component.test.base';

import { SlowLoadingListComponentTest }
	from 'modules/shared/slow.loading.list.component.test.base';

import {
	ModelTestData,
	MockOrderedListItemDirective,
	mergeModuleMetadata,
} from 'testing';

import { StaticOrderedListComponent }
	from './static.ordered.list.component';



export abstract class OrderedListHostComponent<T extends GalleryModel> 
		extends SlowLoadingHostComponent {

	objects: T[] = [];


	constructor(
		modelType: Type<T>,
		testData?: ModelTestData<T>
	) {
		super();

		if(testData)
			this.objects = testData.toListOfModelInstances();
	}

}



export abstract class StaticOrderedListComponentTest<T extends GalleryModel>
		extends SlowLoadingListComponentTest<T> {

	constructor(
		hostedComponentType: Type<StaticOrderedListComponent<T>>,
		hostComponentType: Type<OrderedListHostComponent<T>>,
		mockSubcomponentType: Type<MockOrderedListItemDirective<T>>,	// for each item of the list
		testName?: string
	) {
		super(
			hostedComponentType,
			hostComponentType,
			mockSubcomponentType,
			testName
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			imports: [
				RouterTestingModule
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();


		it('should list objects in their initial order', () => {
			this.checkObjectsAreDisplayedInCorrectOrder();
		});


		it('should emit load event if list is empty', async(() => {
			this.hostComponent.objects = [];
			this.fixture.detectChanges();
			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));

	}


	protected checkObjectsAreDisplayedInCorrectOrder(): void {
		this.hostComponent.objects.forEach(
				(object: T, index: number) => {
			this.checkObjectIsDisplayedAtIndex(index, object);
		});
	}


	protected checkObjectIsDisplayedAtIndex(
		indexInList: number,
		expectedObject: T
	): void {
		const allMockOrderedListItemComponents =
			this.getAllChildDirectivesOfType(this.mockSubcomponentType);

		const mockOrderedListItemComponent =
			allMockOrderedListItemComponents[indexInList];

		expect(mockOrderedListItemComponent.object).toBe(expectedObject);
	}

}