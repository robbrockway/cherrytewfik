import { Component } from '@angular/core';

import { Piece } from 'modules/main/models';

import { StaticStringFieldComponent }
	from './static.string.field.component';

import { TypedStaticFieldHostComponent }
	from '../typed.static.field.component.test.base';

import { FastLoadingStaticFieldComponentTest }
	from '../fast.loading.static.field.component.test.base';



@Component({
	template: `
		<static-string-field
			[object]="object"
			[propertyName]="propertyName"
			[allowLinebreaks]="allowLinebreaks"
			(load)="onLoad()"
		></static-string-field>
	`,
})
class HostComponent extends TypedStaticFieldHostComponent {

	allowLinebreaks: boolean = false;

}



class StaticStringFieldComponentTest extends FastLoadingStaticFieldComponentTest {

	constructor() {
		super(
			StaticStringFieldComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		const stringWithLinebreaks =
			`<p>Hi.</p><br/>How's it going?<br style="">`;

		const stringWithSanitizedLinebreaks =
			`<p>Hi.</p><br>How's it going?<br>`;

		const stringWithoutLinebreaks = `Hi. How's it going?`;

		let useStringWithLinebreaks: () => void;


		it('should display value literally', () => {
			this.setComponentParams(this.testPiece, 'name');

			this.checkChildTextContentIs(
				'static-string-field',
				this.testPiece.name
			);
		});


		it('should remove linebreaks if .allowLinebreaks == false',
				() => {
			this.hostComponent.allowLinebreaks = false;
			useStringWithLinebreaks();
			this.checkChildHtmlContentIs('span', stringWithoutLinebreaks);
		});


		useStringWithLinebreaks = () => {
			const testPiece = {property: stringWithLinebreaks};
			this.setComponentParams(testPiece, 'property');
		};


		it(`shouldn't remove linebreaks if .allowLinebreaks == true`,
				() => {
			this.hostComponent.allowLinebreaks = true;
			useStringWithLinebreaks();

			this.checkChildHtmlContentIs(
				'span',
				stringWithSanitizedLinebreaks
			);
		});

	}

}


new StaticStringFieldComponentTest();


