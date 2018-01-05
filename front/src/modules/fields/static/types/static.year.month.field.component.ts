import { Component } from '@angular/core';

import { StaticDateFieldComponent } from './static.date.field.component';

import { YearMonth } from 'modules/shared';



@Component({
	selector: 'static-year-month-field',
	templateUrl: './plain.static.field.component.html',
})
export class StaticYearMonthFieldComponent
		extends StaticDateFieldComponent<YearMonth> {

	protected get propertyNamesToTrack(): string[] {
		return ['year', 'month'];
	}

}