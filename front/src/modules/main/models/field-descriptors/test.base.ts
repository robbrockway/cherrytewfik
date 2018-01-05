// Common testing utilities for FieldDescriptor subclasses

import { Type } from '@angular/core';

import { FieldDescriptor } from './base';



// Registers tests to make sure that both null and undefined values are kept unchanged between their REST and TypeScript formats
export function defineTestsForConstancyOfEmptyValues<
	T extends FieldDescriptor
>(
	fieldDescriptorType: Type<T>
): void {

	describe('should leave value unchanged', () => {

		let fieldDescriptor: T;
		let testValue;


		beforeEach(() => {
			fieldDescriptor = new fieldDescriptorType('test');
		});


		it('if null', () => {
			testValue = null;
		});


		it('if undefined', () => {
			testValue = undefined;
		});


		afterEach(() => {
			expect(fieldDescriptor.getRestValue(testValue))
				.toBe(testValue);

			expect(fieldDescriptor.getTSValue(testValue, null))
				.toBe(testValue);
		});

	});

}