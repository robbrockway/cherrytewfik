import { Injector, ReflectiveInjector } from '@angular/core';

import { SingleObjectFieldDescriptor } from './single.object';

import { RestConversionError } from './base';
import { defineTestsForConstancyOfEmptyValues } from './test.base';
import { Piece, PieceService } from '../piece';



describe('SingleObjectFieldDescriptor', () => {
	
	let modelInstance: Piece;
	let mockPieceService: any;
	let injector: Injector;
	let fieldDescriptor: SingleObjectFieldDescriptor<Piece>;


	beforeEach(() => {
		mockPieceService = {
			createLocalModelInstance: (restData: any) => null,
		};

		injector = ReflectiveInjector.resolveAndCreate([{
			provide: PieceService,
			useValue: mockPieceService,
		}]);

		fieldDescriptor = new SingleObjectFieldDescriptor(
			PieceService,
			'testField'
		);

		modelInstance = new Piece(mockPieceService, {id: 42});
	});


	it('should convert restValue to instance of the appropriate model '
			+ `using service's .createLocalModelInstance()`, () => {

		const restValue = {rest: 'value'};
		
		spyOn(mockPieceService, 'createLocalModelInstance')
			.and.returnValue(modelInstance);
		
		const tsValue = fieldDescriptor.getTSValue(
			restValue,
			injector
		);

		expect(mockPieceService.createLocalModelInstance)
			.toHaveBeenCalledWith(restValue);
		
		expect(tsValue).toBe(modelInstance);
	});


	it(`should give object's PK as restValue`, () => {
		expect(fieldDescriptor.getRestValue(modelInstance))
			.toBe(modelInstance.pk);
	});


	defineTestsForConstancyOfEmptyValues(SingleObjectFieldDescriptor);

});