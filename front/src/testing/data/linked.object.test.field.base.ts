// Common base class for LinkedObjectTestField and MultiLinkedObjectTestField; handles the choice between a PK value (if zero link depth) or a fully-defined object.


import { Model } from 'modules/main/models';

import { TestField } from './test.field';



export abstract class LinkedObjectTestFieldBase	extends TestField {

	getTSValue(linkDepth: number = 0): any {
		if(linkDepth === 0)
			return this.getTSValueStub();

		return this.getFullTSValue(linkDepth - 1);
	}


	// Could return e.g. a 'stub' model instance with only its PK set
	protected abstract getTSValueStub(): any;


	// e.g. a full model instance
	protected abstract getFullTSValue(newLinkDepth: number): any;


	getRestValue(linkDepth: number = 0): any {
		if(linkDepth === 0)
			return this.getRestValueStub();

		return this.getFullRestValue(linkDepth - 1);
	}


	// e.g. just a PK
	protected abstract getRestValueStub(): any;


	// e.g. a full dictionary of REST-formatted data
	protected abstract getFullRestValue(newLinkDepth: number): any;


	checkTSValueIs(value: any, expectedLinkDepth: number = 0): void {
		if(expectedLinkDepth === 0)
			this.checkTSValueStubIs(value);
		else
			this.checkFullTSValueIs(value, expectedLinkDepth - 1);
	}


	protected abstract checkTSValueStubIs(value: any): void;


	protected abstract checkFullTSValueIs(
		value: any,
		newExpectedLinkDepth: number
	): void;


	checkRestValueIs(value: any, expectedLinkDepth: number = 0): void {
		if(expectedLinkDepth === 0)
			this.checkRestValueStubIs(value);
		else
			this.checkFullRestValueIs(value, expectedLinkDepth - 1);
	}


	protected abstract checkRestValueStubIs(value: any): void;


	protected abstract checkFullRestValueIs(
		value: any,
		newExpectedLinkDepth: number
	): void;

}