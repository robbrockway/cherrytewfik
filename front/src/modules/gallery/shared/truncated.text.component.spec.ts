import { Component, Input } from '@angular/core';

import { TruncatedTextComponent } from './truncated.text.component';
import { HostedComponentTest } from 'testing';



@Component({
	template: `
		<truncated-text
			[text]="text"
			[maxLength]="maxLength"
		></truncated-text>
	`
})
class HostComponent {
	text: string;
	maxLength: number;
}



class TruncatedTextComponentTest extends HostedComponentTest {

	constructor() {
		super(
			TruncatedTextComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		let setParameters: (
			text: string,
			maxLength: number
		) => void;

		let checkTextIsDisplayedAs: (expectedHtml: string) => void;


		it('should show text as-is if within maximum length', () => {
			const text = 'The quick brown fox jumps over the lazy dog.';
			
			setParameters(text,	text.length);
			checkTextIsDisplayedAs(text);
		});


		setParameters = (
			text: string,
			maxLength: number
		) => {
			this.hostComponent.text = text;
			this.hostComponent.maxLength = maxLength;
			this.fixture.detectChanges();
		};


		checkTextIsDisplayedAs = (expectedHtml: string) => {
			const element =
				this.getChildNativeElementByCss('truncated-text');

			const actualHtml = element.innerHTML.trim();
			expect(actualHtml).toBe(expectedHtml);
		};


		it('should shorten text and add ellipsis at end of last word,'
				+ ' if too long', () => {

			setParameters(
				'One small step for a man, a giant leap for mankind',
				16
			);

			checkTextIsDisplayedAs('One small step...');
		});


		it('should sanitise HTML, and then trim', () => {
			setParameters(
				`<i>Imagine there's no heaven</i>\nIt's easy if you try`,
				35
			);

			checkTextIsDisplayedAs(`Imagine there's no heaven\nIt's...`);
		});


		it('should replace HTML linebreaks with spaces', () => {
			setParameters('To<br>be<br />or<p>not</p><p>to</p>be<br/>', 20);
			checkTextIsDisplayedAs('To\nbe\nor\nnot\nto\nbe');
		});

	}

}


new TruncatedTextComponentTest();