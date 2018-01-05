// Type of TestField that works with all values except linked objects; stores a .restValue and a .tsValue, which are returned invariably by their corresponding getters


import { TestField } from './test.field';



export class BasicTestField extends TestField {

	private restValue: any;


	constructor(
		tsName: string,
		private tsValue: any,
		restName?: string,
		restValue?: any
	) {
		super(tsName, restName);

		this.restValue = restValue;
	}


	getTSValue(): any {
		return this.tsValue;
	}


	getRestValue(): any {
		return this.restValue || this.tsValue;
	}


	checkTSValueIs(value: any): void {
		expect(this.getTSValue()).toEqual(value);
	}


	checkRestValueIs(value: any): void {
		expect(this.getRestValue()).toEqual(value);
	}

}