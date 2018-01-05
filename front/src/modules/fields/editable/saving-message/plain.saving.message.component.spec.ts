import { Component } from '@angular/core';

import { PlainSavingMessageComponent }
	from './plain.saving.message.component';

import { SavingState } from './saving.message.component.base';

import {
	SavingMessageHostComponent,
	SavingMessageComponentTestBase,
} from './saving.message.component.test.base';

import { HostedComponentTest } from 'testing';



@Component({
	template: `
		<plain-saving-message [state]="state"></plain-saving-message>
	`,
})
class HostComponent extends SavingMessageHostComponent {}



class PlainSavingMessageComponentTest
		extends SavingMessageComponentTestBase {

	constructor() {
		super(PlainSavingMessageComponent, HostComponent);
	}


	protected defineTests(): void {
		super.defineTests();

		let checkMessageIs: (expectedMessage: string) => void;


		it(`should show 'Saving...' message in saving state`, () => {
			this.setState(SavingState.Saving);
			checkMessageIs('Saving...');
		});


		checkMessageIs = (expectedMessage: string) =>
			this.checkChildTextContentIs('span', expectedMessage);


		it(`should show 'Deleting...' message in deleting state`, () => {
			this.setState(SavingState.Deleting);
			checkMessageIs('Deleting...');
		});

	}

}


new PlainSavingMessageComponentTest();