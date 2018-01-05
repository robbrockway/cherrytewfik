import { Component } from '@angular/core';

import { SavingState } from './saving.message.component.base';

import {
	SavingMessageHostComponent,
	SavingMessageComponentTestBase,
} from './saving.message.component.test.base';

import { ImageSavingMessageComponent }
	from './image.saving.message.component';



@Component({
	template: `
		<image-saving-message
			[state]="state"
		></image-saving-message>
	`,
})
class HostComponent extends SavingMessageHostComponent {}



class ImageSavingMessageComponentTest
		extends SavingMessageComponentTestBase {

	constructor() {
		super(ImageSavingMessageComponent, HostComponent);
	}


	protected defineTests(): void {
		super.defineTests();

		let checkMessageIs: (expectedMessage: string) => void;


		describe(', in saving state,', () => {

			beforeEach(() => {
				this.setState(SavingState.Saving);
			});


			it(`should show 'Uploading...' message`, () => {
				checkMessageIs('Uploading...');
			});

		});


		checkMessageIs = (expectedMessage: string) =>
			this.checkChildTextContentIs('span', expectedMessage);


		describe(', in deleting state,', () => {

			beforeEach(() => {
				this.setState(SavingState.Deleting);
			});


			it(`should show 'Deleting...' message`, () => {
				checkMessageIs('Deleting...');
			});

		});

	}

}


new ImageSavingMessageComponentTest();