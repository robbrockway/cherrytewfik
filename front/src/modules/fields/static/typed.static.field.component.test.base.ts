// Base class for testing Static[x]FieldComponent classes

import { Type } from '@angular/core';

import {
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { Model, Piece } from 'modules/main/models';
import { TypedStaticFieldComponent } from './typed.static.field.component';

import {
	SlowLoadingHostComponent,
	SlowLoadingComponentTest,
} from 'modules/shared/slow.loading.component.test.base';

import { 
	ModelInstanceTestData,
	testPieceData
} from 'testing';

import { getStaticMember } from 'utils';



export abstract class TypedStaticFieldHostComponent
		extends SlowLoadingHostComponent {
	object: any;
	propertyName: string;
}



export abstract class TypedStaticFieldComponentTest
		extends SlowLoadingComponentTest {

	private _testObject: Model;


	constructor(
		protected hostedComponentType: Type<TypedStaticFieldComponent<any>>,
		hostComponentType: Type<TypedStaticFieldHostComponent>,
		testName?: string
	) {
		super(
			hostedComponentType,
			hostComponentType,
			testName
		);
	}


	protected defineTests(): void {
		super.defineTests();
		this.defineNoValueTest();
	}


	// Test for empty display is defined by default, but this can be overridden
	protected defineNoValueTest(): void {
		it('should display nothing if no value', () => {
			this.setValueToNothing();
			this.checkNothingIsDisplayed();
		});
	}


	protected setValueToNothing(): void {
		this.setComponentParams({}, 'fakePropertyName');
	}


	protected setComponentParams(
		object: any,
		propertyName: string
	): void {
		this.hostComponent.object = object;
		this.hostComponent.propertyName = propertyName;
		this.fixture.detectChanges();
	}


	protected checkNothingIsDisplayed(): void {
		this.checkChildTextContentIs('*', '');
	}


	protected definePostloadTests(): void {

		it('should re-emit load event after object has switched, and '
				+ 'new content has loaded', fakeAsync(() => {
			const newObject = this.alternateTestData.toModelInstance();
			this.hostComponent.object = newObject;
			this.checkComponentReloads();
		}));

	}


	// Other object, for switching
	protected get alternateTestData(): ModelInstanceTestData<any> {
		return testPieceData.instances[1];
	}


	// Test object might not actually be a piece, but it usually is; this provides a concise reference
	protected get testPiece(): Piece {
		return this.testObject as Piece;
	}


	protected get testObject(): Model {
		this._testObject = this._testObject ||
			this.testData.toModelInstance();

		return this._testObject;
	}


	// Override and use a different dataset if desired
	protected get testData(): ModelInstanceTestData<any> {
		return testPieceData.instances[0];
	}

}