// YearMonth objects should be copied when used in tests, to prevent originals from modification

import { BasicTestField } from './basic.test.field';
import { YearMonth } from 'modules/shared';



export class DateTestField extends BasicTestField {

	getTSValue(): any {
		const date = super.getTSValue();
		return date.copy();
	}

}
