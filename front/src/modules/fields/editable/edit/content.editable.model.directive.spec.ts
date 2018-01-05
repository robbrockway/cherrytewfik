import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { ComponentTest } from 'testing';

import { ContentEditableModelDirective }
	from './content.editable.model.directive';



@Component({
	template: `
		<div contenteditable="true" [(contenteditableModel)]="value">
		</div>
	`,
})
class HostComponent {
	value: string = '<b>Value</b>'; // Should support rich HTML
}



class ContentEditableModelDirectiveTest extends ComponentTest {

	constructor() {
		super(HostComponent, 'ContentEditableModelDirective');
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(ContentEditableModelDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		const newValue = '<i>New value</i>';

		let element: HTMLElement;

		let setContents: (
			contents: string,
			updateEventType?: string
		) => void;

		let testUpdateEventTriggersValueChange: (
			updateEventType?: string
		) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
			element = this.getChildNativeElementByCss('div');
		});


		it('should set innerHTML to correct value on initialisation',
				() => {
			expect(element.innerHTML).toBe(this.component.value);
		});


		it('should empty contents, if no text nodes are present',
				async(() => {
			setContents('<br/>');
			expect(element.innerHTML).toBeFalsy();
		}));


		setContents = (
			contents: string,
			updateEventType = 'input'
		) => {
			element.innerHTML = contents;
			element.dispatchEvent(new Event(updateEventType));
		};


		it('should update value to innerHTML on input', async(() => {
			testUpdateEventTriggersValueChange();
		}));


		testUpdateEventTriggersValueChange = (
			updateEventType?: string
		) => {
			setContents(newValue, updateEventType);
			expect(this.component.value).toBe(newValue);
		};


		it('should update value to innerHTML on textinput, as required '
				+ 'by IE', async(() => {
			testUpdateEventTriggersValueChange('textinput');
		}));


		it('should update value to innerHTML on keyup, as required '
				+ 'by IE', async(() => {
			testUpdateEventTriggersValueChange('keyup');
		}));

	}

}


new ContentEditableModelDirectiveTest();