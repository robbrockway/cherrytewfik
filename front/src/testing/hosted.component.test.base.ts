// Many (most!) components are contained within a specially-defined host component when testing. This base class makes those tests easier.

import { Type } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';

import { ComponentTest } from './component.test.base';



export abstract class HostedComponentTest extends ComponentTest {

	protected hostComponent: any;


	constructor(
		protected hostedComponentType: Type<any>,
		hostComponentType: Type<any>,
		testName: string = hostedComponentType.name
	) {
		super(hostComponentType, testName);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		// Add the main component to module
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(this.hostedComponentType);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		beforeEach(() => {
			// more descriptive alias
			this.hostComponent = this.component;
		});
	}


	protected setInputValues(properties: any): void {
		Object.assign(this.hostComponent, properties);
		this.fixture.detectChanges();
	}


	// Finds a mock subcomponent and makes sure it inherits the same values for the given keys as held by our host component, transmitted through the tested component
	protected checkSubcomponentMatchesHostComponentProperties(
		mockSubcomponentType: Type<any>,
		propertyNames: string[]
	): void {

		const mockSubcomponent =
			this.getChildDirective(mockSubcomponentType);

		for(let propertyName of propertyNames) {
			expect(mockSubcomponent[propertyName])
				.toBe(this.hostComponent[propertyName]);
		}
	}


	protected get hostedComponent(): any {
		return this.getChildDirective(this.hostedComponentType);
	}

}