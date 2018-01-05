import { Component } from '@angular/core';

import { Piece } from 'modules/main/models';

import { StaticPriceFieldComponent }
	from './static.price.field.component';

import { TypedStaticFieldHostComponent }
	from '../typed.static.field.component.test.base';

import { FastLoadingStaticFieldComponentTest }
	from '../fast.loading.static.field.component.test.base';



@Component({
	template: `
		<static-price-field
			[object]="object"
			[propertyName]="propertyName"
			(load)="onLoad()"
		></static-price-field>
	`,
})
class HostComponent extends TypedStaticFieldHostComponent {}



class StaticPriceFieldComponentTest extends FastLoadingStaticFieldComponentTest {

	constructor() {
		super(
			StaticPriceFieldComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();


		it('should display value to 2dp', () => {
			this.setComponentParams(this.testPiece, 'price');

			this.checkChildTextContentIs(
				'static-price-field',
				this.testPiece.renderedPrice
			);
		});

	}

}


new StaticPriceFieldComponentTest();


