// Usually just converts verbatim between REST and TypeScript values, except that a null TS value is converted to an empty string to satisfy the database

import { Injector } from '@angular/core';

import { FieldDescriptor } from './base';



export class StringFieldDescriptor extends FieldDescriptor {

	getRestValue(tsValue: string): string {
		return tsValue === null ? '' : tsValue;
	}


	getTSValue(restValue: string, injector: Injector): string {
		return restValue;
	}

}
