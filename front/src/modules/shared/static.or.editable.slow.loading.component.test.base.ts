// An amalgam of StaticOrEditableComponentTest and SlowLoadingComponentTest, for want of multiple inheritance

import { Type } from '@angular/core';
import { async } from '@angular/core/testing';

import { SlowLoadingComponent } from './slow.loading.component';

import { SlowLoadingHostComponent }
	from './slow.loading.component.test.base';

import {
	StaticOrEditableComponentTest,
	StaticOrEditableSubcomponentProfile,
} from 'testing';



export abstract class StaticOrEditableSlowLoadingComponentTest
		extends StaticOrEditableComponentTest {

	constructor(
		hostedComponentType: Type<SlowLoadingComponent>,
		hostComponentType: Type<SlowLoadingHostComponent>,
		testName?: string
	) {
		super(hostedComponentType, hostComponentType, testName);
	}


	protected defineTestsWithSubcomponentType(
		correctProfile: StaticOrEditableSubcomponentProfile,
		incorrectProfile: StaticOrEditableSubcomponentProfile
	): void {
		
		super.defineTestsWithSubcomponentType(
			correctProfile,
			incorrectProfile
		);


		const subcomponentName = correctProfile.realComponentName;


		it(`should reemit load event from ${subcomponentName}`,
				async(() => {

			const mockSubcomponent =
				this.getChildDirective(correctProfile.mockComponentType);

			mockSubcomponent.load.emit();

			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));

	}

}