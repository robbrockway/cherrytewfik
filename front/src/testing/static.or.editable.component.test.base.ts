// Test for components (e.g. FieldComponent, PieceListComponent) that serve as a switch between 'static' and 'editable' versions of a subcomponent depending on whether or not a staff user is logged in

import { Type } from '@angular/core';

import {
	TestModuleMetadata,
	inject,
	async,
} from '@angular/core/testing';

import { UserService } from 'modules/main/models';
import { SlowLoadingComponent } from 'modules/shared';

import { SlowLoadingHostComponent }
	from 'modules/shared/slow.loading.component.test.base';

import { HostedComponentTest } from './hosted.component.test.base';
import { MockSlowLoadingDirective } from './mock.components';
import { mergeModuleMetadata } from './test.with.module';



export type StaticOrEditableSubcomponentProfile = {
	mockComponentType: Type<MockSlowLoadingDirective>,
	realComponentName: string,
};



export type StaticOrEditableSubcomponentProfiles = {
	static: StaticOrEditableSubcomponentProfile,
	editable: StaticOrEditableSubcomponentProfile,
};



export abstract class StaticOrEditableComponentTest
		extends HostedComponentTest {

	protected mockUserService: any;


	// We use SlowLoadingComponent for both main- and subcomponents, because a load event from subcomponent must be re-emitted by main one.
	constructor(
		hostedComponentType: Type<SlowLoadingComponent>,
		hostComponentType: Type<SlowLoadingHostComponent>,
		testName?: string
	) {
		super(hostedComponentType, hostComponentType, testName);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			declarations: [
				this.subcomponentData.static.mockComponentType,
				this.subcomponentData.editable.mockComponentType,
			],

			providers: [{
				provide: UserService,
				useFactory: this.createMockUserService,
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected abstract get subcomponentData(
	): StaticOrEditableSubcomponentProfiles;


	private createMockUserService(): any {
		return {isStaff: false};
	}


	protected defineTests(): void {
		super.defineTests();
		
		const registerMockUserService = (
			injectedService: any
		) => 
			this.mockUserService = injectedService;


		beforeEach(inject([UserService], registerMockUserService));
		

		beforeEach(() => {
			Object.assign(this.hostComponent, this.inputsToBeTransmitted);
			this.fixture.detectChanges();
		});


		describe(', as non-staff user,', () => {

			this.defineTestsWithSubcomponentType(
				this.subcomponentData.static,
				this.subcomponentData.editable
			);

		});


		describe(', as staff user,', () => {

			beforeEach(() => this.becomeStaff());


			this.defineTestsWithSubcomponentType(
				this.subcomponentData.editable,
				this.subcomponentData.static
			);

		});

	}


	// Should be a dictionary, to be assigned to host component using Object.assign(); tests will check that its values are passed down to both static and editable subcomponents.
	protected abstract get inputsToBeTransmitted(): any;


	// Since we're switching between static and editable subcomponents, the tests can be similar for each. correctProfile points to the subcomponent we're meant to see (editable version if staff, static if not), and incorrectProfile points to the other.
	protected defineTestsWithSubcomponentType(
		correctProfile: StaticOrEditableSubcomponentProfile,
		incorrectProfile: StaticOrEditableSubcomponentProfile
	): void {

		let subcomponent: any;


		beforeEach(() => {
			subcomponent =
				this.getChildDirective(correctProfile.mockComponentType);
		});


		it(`should show ${correctProfile.realComponentName}`, () => {
			expect(subcomponent).toBeTruthy();
		});


		it(`should pass the correct parameters `
				+ `to ${correctProfile.realComponentName}`,	() => {

			this.checkSubcomponentMatchesHostComponentProperties(
				correctProfile.mockComponentType,
				this.inputsToBeTransmitted
			);

		});


		it(`should reemit load event when ${correctProfile.realComponentName}`
				+ ' loads', async(() => {
			subcomponent.load.emit();
			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));


		it(`shouldn't show ${incorrectProfile.realComponentName}`, () => {
			this.expectChildDirective(incorrectProfile.mockComponentType)
				.toBeFalsy();
		});

	}


	protected becomeStaff(): void {
		this.mockUserService.isStaff = true;
		this.fixture.detectChanges();
	}

}