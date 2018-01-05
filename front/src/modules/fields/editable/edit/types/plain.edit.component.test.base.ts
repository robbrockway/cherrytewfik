import { Type } from '@angular/core';

import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { ContentEditableModelDirective }
	from '../content.editable.model.directive';

import { PlainEditComponent } from './plain.edit.component';

import { EditHostComponent } from '../edit.component.test.base';

import { TypedEditComponentTestBase }
	from './typed.edit.component.test.base';

import { HostedComponentTest } from 'testing';


export type PlainEditComponentTestDataPoint<T> = {
	value: T,	// in its internal format (number for price, string for most others)
	asDisplayed: string,
};


export type PlainEditComponentTestData<T> = {
	initial: PlainEditComponentTestDataPoint<T>,	
	changed: PlainEditComponentTestDataPoint<T>,
};



export abstract class PlainEditComponentTest<T> 
		extends TypedEditComponentTestBase<T> {

	protected textBox: HTMLSpanElement;


	constructor(
		hostedComponentType: Type<PlainEditComponent<T>>,
		hostComponentType: Type<EditHostComponent<T>>,
		protected testData: PlainEditComponentTestData<T>,
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
		metadata.declarations.push(ContentEditableModelDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let checkAllIsSelected: () => void;
		let pressKey: () => void;
		let checkPromptIsShowing: () => void;
		let checkKeyDownDoesntDisturbPrompt: (key: string) => void;
		let expectKeyDownPreventDefault: (key: string) => any;

		let saveValueAs: (
			value: PlainEditComponentTestDataPoint<T>
		) => void;
		
		let triggerSave: () => void;


		beforeEach(async(() => {
			this.hostComponent.value = this.testData.initial.value;
			this.fixture.detectChanges();

			this.textBox = 
				this.getChildNativeElementByCss('span')	as HTMLSpanElement;
		}));


		it(`'s content should be editable`, () => {
			expect(this.textBox.getAttribute('contenteditable'))
				.toBeTruthy();
		});


		it(`'s text box should have everything selected, on initialisation`,
				() => {
			checkAllIsSelected();
		});


		checkAllIsSelected = () => {
			const selection = window.getSelection();

			expect(selection).toEqual(jasmine.objectContaining({
				anchorNode: this.textBox,
				anchorOffset: 0,
				focusNode: this.textBox,
				focusOffset: 1,
			}));
		};


		it('should display the given value', () => {
			expect(this.textBox.innerHTML)
				.toBe(this.testData.initial.asDisplayed);
		});

		
		it(`should display 'Add <label>' prompt message when contents `
				+ 'are emptied', async(() => {
			this.setContents('');
			checkPromptIsShowing();
		}));


		checkPromptIsShowing = () => {
			const expectedMessage = `Add ${this.hostComponent.label}`;
			expect(this.textBox.innerHTML).toBe(expectedMessage);
		};


		it('should select all when contents are emptied', () => {
			this.setContents('');
			checkAllIsSelected();
		});


		it('should select all when contents are empty and a key is '
				+ 'pressed', async(() => {
			this.setContents('');
			pressKey();
			checkAllIsSelected();
		}));


		pressKey = () => {
			const event = new KeyboardEvent(
				'keypress',
				{key: '1'}	// Any old key will do
			);

			this.textBox.dispatchEvent(event);
		};


		it('should block delete/backspace events when prompt is showing',
				async(() => {
			for(let key of ['Delete', 'Backspace'])
				checkKeyDownDoesntDisturbPrompt(key);
		}));


		checkKeyDownDoesntDisturbPrompt = (key: string) => {
			this.setContents('');
			expectKeyDownPreventDefault(key).toHaveBeenCalled();
		};


		// Dispatches key press; returns an 'expectation' about a spy on the event's .preventDefault method
		expectKeyDownPreventDefault = (key: string) => {
			const event = new KeyboardEvent('keydown', {key});
			spyOn(event, 'preventDefault');
			this.textBox.dispatchEvent(event);
			return expect(event.preventDefault);
		};


		it(`shouldn't emit 'valueChange' until text box is blurred`,
				fakeAsync(() => {
			this.setContents(this.testData.changed.asDisplayed);
			
			expect(this.hostComponent.onValueChange)
				.not.toHaveBeenCalled();
		}));


		it(`should emit 'valueChange', with correct value, when saving`, 
				fakeAsync(() => {
			saveValueAs(this.testData.changed);
			
			// Directive's valueChange should trigger main component's valueChange
			expect(this.hostComponent.onValueChange)
				.toHaveBeenCalledWith(this.testData.changed.value);
		}));


		saveValueAs = (data: PlainEditComponentTestDataPoint<T>) => {
			this.setContents(data.asDisplayed);
			triggerSave();
		};


		triggerSave = () => {
			this.textBox.dispatchEvent(new FocusEvent('blur'));
			flushMicrotasks();
		};

	}

		
	protected setContents(contents: string) {
		this.textBox.innerHTML = contents;
		this.textBox.dispatchEvent(new Event('input'));
		this.fixture.detectChanges();
	}


	protected set cursorPosition(position: number) {
		const selection = window.getSelection();
		const range = selection.getRangeAt(0);
		const node = this.textBox.childNodes[0];
		range.setStart(node, position);
		range.setEnd(node, position);
	}


	protected checkTextBoxBlursAfterEvent(event: Event): void {
		this.triggerTextBoxEvent(event);
		expect(document.activeElement).not.toBe(this.textBox);
	}


	private triggerTextBoxEvent(event: Event): void {
		this.textBox.dispatchEvent(event);
		flushMicrotasks();
	}


	protected checkTextBoxDoesntBlurAfterEvent(event: Event): void {
		this.textBox.focus();
		this.triggerTextBoxEvent(event);
		expect(document.activeElement).toBe(this.textBox);
	}

}