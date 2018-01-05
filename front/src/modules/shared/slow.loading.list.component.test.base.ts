// Base class for testing subclasses of SlowLoadingListComponent

import { Type } from '@angular/core';

import {
	TestModuleMetadata,
	async,
} from '@angular/core/testing';

import { SlowLoadingListComponent } from './slow.loading.list.component';

import {
	SlowLoadingHostComponent,
	SlowLoadingComponentTest,
} from './slow.loading.component.test.base';

import {
	MockSlowLoadingDirective
} from 'testing';



// T: same type argument (i.e. list item type) as taken by SlowLoadingListComponent
export abstract class SlowLoadingListComponentTest<T>
		extends SlowLoadingComponentTest {

	constructor(
		hostedComponentType: Type<SlowLoadingListComponent<T>>,
		hostComponentType: Type<SlowLoadingHostComponent>,
		protected mockSubcomponentType: Type<MockSlowLoadingDirective>,	// for each item of the list
		testName?: string
	) {
		super(
			hostedComponentType,
			hostComponentType,
			testName
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(this.mockSubcomponentType);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		
		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it(`shouldn't emit load event until all subcomponents have `
				+ 'loaded', async(() => {

			const allSubcomponentsButOne = this.mockSubcomponents.slice(1);
			for(let mockSubcomponent of allSubcomponentsButOne)
				mockSubcomponent.load.emit();

			expect(this.hostComponent.onLoad).not.toHaveBeenCalled();
		}));

	}


	protected get mockSubcomponents(): MockSlowLoadingDirective[] {
		return this.getAllChildDirectivesOfType(this.mockSubcomponentType);
	}


	protected triggerLoadEvent(): void {
		// Ready once all list items have loaded
		for(let mockSubcomponent of this.mockSubcomponents)
			mockSubcomponent.load.emit();
	}

}