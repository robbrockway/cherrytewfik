import { Component } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { StringEditComponent } from './string.edit.component';
import { EditHostComponent } from '../edit.component.test.base';
import { PlainEditComponentTest } from './plain.edit.component.test.base';

import { ContentEditableModelDirective }
	from '../content.editable.model.directive';

import { getLastItem } from 'utils';



@Component({
	template: `
		<string-edit
			[(value)]="value"
			(valueChange)="onValueChange($event)"
			(cancel)="onCancel()"
			[label]="label"
			[allowLinebreaks]="allowLinebreaks"
		></string-edit>
	`,
})
class HostComponent extends EditHostComponent<string> {
	allowLinebreaks: boolean = true;
}


const initialValue = '<b>Initial</b>', changedValue = '<i>Changed</i>';

const testData = {
	initial: {value: initialValue, asDisplayed: initialValue},
	changed: {value: changedValue, asDisplayed: changedValue},
};



class StringEditComponentTest extends PlainEditComponentTest<string> {

	constructor() {
		super(StringEditComponent, HostComponent, testData);
	}


	protected defineTests(): void {
		super.defineTests();


		// Blur, when detected by ContentEditableModelDirective, will trigger save
		describe(', when enter is pressed and released,', () => {

			let enterKeyUp: KeyboardEvent;
			let enterKeyPress: KeyboardEvent;
			let shiftEnterKeyPress: KeyboardEvent;
			let setAllowLinebreaksProperty: (value: boolean) => void;


			beforeEach(() => {
				enterKeyUp =
					new KeyboardEvent('keyup', {key: 'Enter'});

				enterKeyPress =
					new KeyboardEvent('keypress', {key: 'Enter'});

				shiftEnterKeyPress = new KeyboardEvent(
					'keypress',
					{key: 'Enter', shiftKey: true}
				);

				for(let event of [enterKeyPress, shiftEnterKeyPress])
					spyOn(event, 'preventDefault');
			});


			it('should prevent linebreak', fakeAsync(() => {
				this.textBox.dispatchEvent(enterKeyPress);
				flushMicrotasks();
				expect(enterKeyPress.preventDefault).toHaveBeenCalled();
			}));


			describe('if allowLinebreaks == false,', () => {

				beforeEach(() => {
					setAllowLinebreaksProperty(false);
				});


				it('should blur text box', fakeAsync(() => {
					this.checkTextBoxBlursAfterEvent(enterKeyUp);
				}));

			});


			setAllowLinebreaksProperty = (value: boolean) => {
				this.hostComponent.allowLinebreaks = value;
				this.fixture.detectChanges();
			};


			describe('if allowLinebreaks == true,', () => {

				beforeEach(() => {
					setAllowLinebreaksProperty(true);
				});


				it(`should blur text box, if shift isn't held`, fakeAsync(() => {
					this.checkTextBoxBlursAfterEvent(enterKeyUp);
				}));


				describe('and shift is held,', () => {

					it(`shouldn't blur text box`, fakeAsync(() => {
						const shiftEnterKeyUp = new KeyboardEvent(
							'keyup',
							{key: 'Enter', shiftKey: true}
						);
						
						this.checkTextBoxDoesntBlurAfterEvent(shiftEnterKeyUp);
					}));


					it('should allow linebreak', fakeAsync(() => {
						this.textBox.dispatchEvent(shiftEnterKeyPress);
						flushMicrotasks();

						expect(shiftEnterKeyPress.preventDefault)
							.not.toHaveBeenCalled();
					}));

				});

			});

		});

	}

}


new StringEditComponentTest();

