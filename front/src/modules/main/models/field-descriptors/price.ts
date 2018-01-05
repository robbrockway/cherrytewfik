import { FieldDescriptor } from './base';



export class PriceFieldDescriptor extends FieldDescriptor {

	getTSValue(restValue: string): number {
		if(restValue === null) return null;
		if(restValue === undefined) return undefined;

		return +restValue;
	}


	getRestValue(tsValue: number): string {
		if(tsValue === null) return null;
		if(tsValue === undefined) return undefined;

		return tsValue.toFixed(2);
	}

}
