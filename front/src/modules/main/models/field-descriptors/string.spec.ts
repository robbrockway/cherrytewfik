import { StringFieldDescriptor } from './string';



describe('StringFieldDescriptor', () => {

	const stringValue = 'Value';

	let fieldDescriptor: StringFieldDescriptor;


	beforeEach(() => {
		fieldDescriptor = new StringFieldDescriptor('name');
	});


	it('should convert null tsValue to empty string restValue', () => {
		expect(fieldDescriptor.getRestValue(null)).toBe('');
	});


	it('should leave truthy tsValue unchanged as restValue', () => {
		expect(fieldDescriptor.getRestValue(stringValue))
			.toBe(stringValue);
	});


	it('should leave undefined tsValue unchanged as restValue', () => {
		expect(fieldDescriptor.getRestValue(undefined))
			.toBe(undefined);
	});


	it('should leave restValue unchanged as tsValue', () => {
		for(let value of ['string', null, undefined])
			expect(fieldDescriptor.getTSValue(value, null)).toBe(value);
	});

});