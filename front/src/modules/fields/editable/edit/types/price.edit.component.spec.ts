import { Component } from '@angular/core';
import { async } from '@angular/core/testing';

import { EditHostComponent } from '../edit.component.test.base';
import { PlainEditComponentTest } from './plain.edit.component.test.base';
import { PriceEditComponent } from './price.edit.component';



@Component({
	template: `
		<price-edit
			[(value)]="value"
			(valueChange)="onValueChange($event)"
			(cancel)="onCancel()"
			[label]="label"
		></price-edit>
	`,
})
class HostComponent extends EditHostComponent<number> {}



const testData = {
	initial: {value: 19.5, asDisplayed: '19.50'},
	changed: {value: 49.99, asDisplayed: '49.99'},
};


const illegalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	+ ',<>/?\\|[]{}!@#$%^&*()+-\'"`~';

const navigationKeys = [
	'ArrowLeft',
	'ArrowRight',
	'Backspace',
	'Delete',
	'Home',
	'End',
	'Insert',
	'Undo',
	'Redo',
	'Cut',
	'Copy',
	'Paste',
	'Control',
	'Alt',
];



class PriceEditComponentTest extends PlainEditComponentTest<number> {

	constructor() {
		super(
			PriceEditComponent,
			HostComponent,
			testData
		);
	}


	protected defineTests(): void {
		super.defineTests();


		let expectKeyPressPreventDefault: (key: string) => any;

		let expectSanitisedContentsAfterInput: (
			attemptedContents: string
		) => any;


		it(`shouldn't allow illegal key presses`, async(() => {
			for(let char of illegalChars)
				expectKeyPressPreventDefault(char).toHaveBeenCalled();
		}));


		// Dispatches key press; returns an 'expectation' about a spy on the event's .preventDefault method
		expectKeyPressPreventDefault = (key: string) => {
			const event = new KeyboardEvent('keypress', {key});
			spyOn(event, 'preventDefault');
			this.textBox.dispatchEvent(event);
			return expect(event.preventDefault);
		};


		it('should allow key presses from navigation keys', async(() => {
			for(let key of navigationKeys)
				expectKeyPressPreventDefault(key).not.toHaveBeenCalled();
		}));


		it(`shouldn't allow illegal input`, async(() => {
			for(let char of illegalChars) {
				// Initial digit, to prevent prompt message
				expectSanitisedContentsAfterInput('1' + char).toBe('1');
			}
		}));


		expectSanitisedContentsAfterInput = (
			attemptedContents: string
		) => {
			this.setContents(attemptedContents);
			return expect(this.textBox.innerHTML);
		};


		it('should allow one decimal point, by key press', async(() => {
			this.setContents('1');
			expectKeyPressPreventDefault('.').not.toHaveBeenCalled();
		}));

		
		it('should allow one decimal point, by input', async(() => {
			expectSanitisedContentsAfterInput('1.').toBe('1.');
		}));

		
		it(`shouldn't allow more than one decimal point, by key press`,
				async(() => {
			this.setContents('1.00');
			expectKeyPressPreventDefault('.').toHaveBeenCalled();
		}));


		it(`shouldn't allow more than one decimal point, by input`,
				async(() => {
			expectSanitisedContentsAfterInput('1.0.').toBe('1.0');
		}));


		it('should allow up to two decimal places, by key press',
				async(() => {
			this.setContents('1.0');
			this.cursorPosition = 2;
			expectKeyPressPreventDefault('0').not.toHaveBeenCalled();
		}));


		it(`shouldn't allow more than two decimal places, by key press`,
				async(() => {
			this.setContents('1.00');
			this.cursorPosition = 2;
			expectKeyPressPreventDefault('0').toHaveBeenCalled();
		}));


		it(`shouldn't allow more than two decimal places, by input`,
				async(() => {
			expectSanitisedContentsAfterInput('1.999').toBe('1.99');
		}));

	}

}


new PriceEditComponentTest();