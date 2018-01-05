// For testing FastLoadingStaticFieldComponent subclasses

import { Type } from '@angular/core';

import { FastLoadingStaticFieldComponent }
	from './fast.loading.static.field.component';

import {
	TypedStaticFieldHostComponent,
	TypedStaticFieldComponentTest,
} from './typed.static.field.component.test.base';



export abstract class FastLoadingStaticFieldComponentTest
		extends TypedStaticFieldComponentTest {

	constructor(
		protected hostedComponentType:
			Type<FastLoadingStaticFieldComponent<any>>,
		hostComponentType: Type<TypedStaticFieldHostComponent>,
		testName?: string
	) {
		super(
			hostedComponentType,
			hostComponentType,
			testName
		);
	}

	
	// No triggering necessary, apart from the basic loading of the view
	protected triggerLoadEvent(): void {
		this.fixture.detectChanges();
	}

}