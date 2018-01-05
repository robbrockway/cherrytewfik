// Field that stores a YearMonth instance, converted to/from a YYYY-MM or YYYY-null format on server

import { FieldDescriptor } from './base';
import { YearMonth } from 'modules/shared';
import { getNumberAsTwoDigits } from 'utils';



export class YearMonthFieldDescriptor extends FieldDescriptor {

	getTSValue(restValue: string, injector: any): YearMonth {
		if(!restValue)
			return null;

		const elements = restValue.split('-');
		const year = +elements[0];
		const month = this.getMonthFromString(elements[1]);
		return new YearMonth(year, month);
	}


	private getMonthFromString(monthString: string): number {
		if(monthString === 'null')
			return null;

		return +monthString;
	}


	getRestValue(tsValue: YearMonth): string {
		if(!tsValue)
			return tsValue as any;	// null or undefined

		const elements = [
			tsValue.year.toString(),
			this.getStringFromMonth(tsValue.month)
		];

		return elements.join('-');
	}


	private getStringFromMonth(month: number): string {
		if(!month)
			return 'null';

		return getNumberAsTwoDigits(month);
	}

}