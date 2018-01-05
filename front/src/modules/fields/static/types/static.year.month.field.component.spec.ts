import { Component } from '@angular/core';

import { Piece } from 'modules/main/models';

import { StaticYearMonthFieldComponent }
	from './static.year.month.field.component';

import {
	TypedStaticFieldHostComponent,
	TypedStaticFieldComponentTest,
} from '../typed.static.field.component.test.base';



@Component({
	template: `
		<static-year-month-field
			[object]="object"
			[propertyName]="propertyName"
			(load)="onLoad()"
		></static-year-month-field>
	`,
})
class HostComponent extends TypedStaticFieldHostComponent {}



class StaticYearMonthFieldComponentTest 
		extends TypedStaticFieldComponentTest {

	constructor() {
		super(
			StaticYearMonthFieldComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		const newYearValue = 2018;

		let checkDateIsDisplayedCorrectly: () => void;


		it(`should display date's string representation`, () => {
			this.initComponentParams();
			checkDateIsDisplayedCorrectly();
		});


		checkDateIsDisplayedCorrectly = () => {
			this.checkChildTextContentIs(
				'static-year-month-field',
				this.testPiece.date.toString()
			);
		};


		it('should change display when date changes', () => {
			this.initComponentParams();
			this.testPiece.date.year = newYearValue;
			this.fixture.detectChanges();
			checkDateIsDisplayedCorrectly();
		});

	}


	private initComponentParams(): void {
		this.setComponentParams(this.testPiece, 'date');
	}


	protected triggerLoadEvent(): void {
		this.fixture.detectChanges();
	}

}


new StaticYearMonthFieldComponentTest();


