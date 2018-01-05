import { Component, Type } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';

import { SavingMessageComponent } from './saving.message.component';
import { SavingState } from './saving.message.component.base';

import { SavingMessageHostComponent }
	from './saving.message.component.test.base';

import {
	HostedComponentTest,
	MockSavingMessageDirectiveBase,
	MockPlainSavingMessageDirective,
	MockImageSavingMessageDirective,
} from 'testing';



@Component({
	template: `
		<saving-message
			[type]="type"
			[state]="state"
		></saving-message>
	`,
})
class HostComponent extends SavingMessageHostComponent {
	type: string;
}



// Some types use ImageSavingMessageComponent; others use PlainSavingMessageComponent
export const typesPassedTo = {
	imageSubcomponent: ['image', 'thumbnail'],

	plainSubcomponent: [
		'string',
		'multiline',
		'yearMonth',
		'categoryLink',
		'price',
	],
};



class SavingMessageComponentTest extends HostedComponentTest {

	constructor() {
		super(SavingMessageComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();

		metadata.declarations.push(
			MockPlainSavingMessageDirective,
			MockImageSavingMessageDirective
		);

		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();


		beforeEach(() => {
			this.hostComponent.state = SavingState.Saving;
		});


		for(let fieldType of typesPassedTo.plainSubcomponent) {
			this.defineTestsForFieldType(
				fieldType, 
				MockPlainSavingMessageDirective,
				'PlainSavingMessageComponent'
			);
		}


		for(let fieldType of typesPassedTo.imageSubcomponent) {
			this.defineTestsForFieldType(
				fieldType,
				MockImageSavingMessageDirective,
				'ImageSavingMessageComponent'
			);
		}

	}


	// Sets up tests to check that parameters are passed to whichever subcomponent is appropriate
	private defineTestsForFieldType(
		fieldType: string,
		mockSubcomponentType: Type<MockSavingMessageDirectiveBase>,
		realSubcomponentName: string
	): void {

		it(`should pass correct parameters to ${realSubcomponentName}, `
				+ `when '${fieldType}' type is used`, () => {

			this.hostComponent.type = fieldType;
			this.fixture.detectChanges();

			this.checkSubcomponentMatchesHostComponentProperties(
				mockSubcomponentType,
				['state'],
			);

		});

	}

}


new SavingMessageComponentTest();