import { PriceFieldDescriptor } from './price';
import { defineTestsForConstancyOfEmptyValues } from './test.base';


describe('PriceFieldDescriptor', () => {

	let fieldDescriptor: PriceFieldDescriptor;


	beforeEach(() => {
		fieldDescriptor = new PriceFieldDescriptor('price');
	});


	it('should convert to correct tsValues', () => {
		expect(fieldDescriptor.getTSValue('150.00'))
			.toBe(150);

		expect(fieldDescriptor.getTSValue('150.01'))
			.toBe(150.01);
	});


	it('should render restValue to two decimal places', () => {
		expect(fieldDescriptor.getRestValue(150))
			.toBe('150.00');

		expect(fieldDescriptor.getRestValue(150.5))
			.toBe('150.50');

		expect(fieldDescriptor.getRestValue(150.505))
			.toBe('150.50');
	});


	defineTestsForConstancyOfEmptyValues(PriceFieldDescriptor);

});