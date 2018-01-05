import {
	FieldDescriptor,
	WritingCapability,
} from './base';



describe('FieldDescriptor', () => {

	const testTSName = 'tsName', testRestName = 'restName';
	const testValue = 'value';
	let fieldDescriptor: FieldDescriptor;


	beforeEach(() => {
		fieldDescriptor = new FieldDescriptor(
			testTSName,
			testRestName
		);
	});


	it('should return correct restName', () => {
		expect(fieldDescriptor.restName).toBe(testRestName);
	});


	it('should return tsName in absence of restName', () => {
		fieldDescriptor.restName = '';
		expect(fieldDescriptor.restName).toBe(testTSName);
	});


	it('should convert tsValue to identical restValue', () => {
		const restValue = fieldDescriptor.getRestValue(testValue);
		expect(restValue).toBe(testValue);
	});


	it('should convert restValue to identical tsValue', () => {
		const tsValue = fieldDescriptor.getTSValue(testValue, null);
		expect(tsValue).toBe(testValue);
	});


	describe('.canWriteToServer', () => {

		it('should be false when not writable', () => {
			fieldDescriptor.writingCapability =
				WritingCapability.CannotWriteToServer;

			expect(fieldDescriptor.canWriteToServer).toBe(false);
		});


		it('should be true when writable', () => {
			fieldDescriptor.writingCapability =
				WritingCapability.CanWriteToServer;

			expect(fieldDescriptor.canWriteToServer).toBe(true);
		});


		it('should make field non-writable when set to false', () => {
			fieldDescriptor.canWriteToServer = false;

			expect(fieldDescriptor.writingCapability)
				.toBe(WritingCapability.CannotWriteToServer);
		});


		it('should make field writable when set to true', () => {
			fieldDescriptor.canWriteToServer = true;

			expect(fieldDescriptor.writingCapability)
				.toBe(WritingCapability.CanWriteToServer);
		});

	});

});