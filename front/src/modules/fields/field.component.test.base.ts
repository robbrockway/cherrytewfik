// For testing FieldComponent and the static version of FieldSwitchComponent. Takes a subcomponentType, which should represent whichever type of component is receiving the same three parameters verbatim (FieldComponent has FieldSwitchComponent, mocked by MockFieldSwitchDirective; FieldSwitchComponent has StaticFieldComponent, mocked by MockStaticFieldDirective).

import { Type } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';

import { 
	SlowLoadingComponentTest,
	SlowLoadingHostComponent,
} from 'modules/shared/slow.loading.component.test.base';

import { FieldComponentBase } from './field.component.base';

import {
	testPieceData,
	MockFieldDirective,
} from 'testing';



export abstract class FieldHostComponent 
		extends SlowLoadingHostComponent {

	object: any;
	propertyName: string;
	type: string;
	label: string;
	prefixText: string;
	widthList: number[];
	rootDirectory: string;
}



export abstract class FieldComponentTestBase
		extends SlowLoadingComponentTest {

	constructor(
		hostedComponentType: Type<FieldComponentBase>,
		protected mockSubcomponentType: Type<MockFieldDirective>,
		hostComponentType: Type<FieldHostComponent>,
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

		let testObject: any;


		beforeEach(() => {
			this.initHostComponentParams();
			this.fixture.detectChanges();
		});


		it('should pass the correct parameters to subcomponent', () => {
			
			this.checkSubcomponentMatchesHostComponentProperties(
				this.mockSubcomponentType,
				[
					'object', 
					'propertyName', 
					'type', 
					'label',
					'prefixText',
					'widthList', 
					'rootDirectory',
				]
			);

		});

	}


	protected initHostComponentParams(): void {
		const testData = testPieceData.instances[0];
		const testObject = testData.toModelInstance();

		Object.assign(
			this.hostComponent,
			{
				object: testObject,
				propertyName: 'image',
				type: 'thumbnail',
				label: 'label',
				prefixText: 'Prefix',
				widthList: [100, 200],
				rootDirectory: 'directory',
			}
		);
	}


	// By default, should load once subcomponent has loaded
	protected triggerLoadEvent(): void {
		const mockSubcomponent = 
			this.getChildDirective(this.mockSubcomponentType);

		mockSubcomponent.load.emit();
	}


	protected clearValue(): void {
		// If propertyName points to a nonexistent field, value will be undefined
		this.hostComponent.propertyName = 'fakeProperty';
		this.fixture.detectChanges();
	}

}