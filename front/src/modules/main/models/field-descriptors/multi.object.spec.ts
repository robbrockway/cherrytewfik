import { Injector, ReflectiveInjector } from '@angular/core';

import { MultiObjectFieldDescriptor } from './multi.object';
import { RestConversionError } from './base';

import { Piece, PieceService } from '../piece';



describe('MultiObjectFieldDescriptor', () => {
	
	let modelInstanceList: Piece[];
	let mockPieceService: any;
	let injector: Injector;
	let fieldDescriptor: MultiObjectFieldDescriptor<Piece>;
	let nextModelInstanceIndex = 0;

	let initModelInstanceList: () => void;
	let getNextModelInstance: () => Piece;


	beforeEach(() => {
		mockPieceService = {
			createLocalModelInstance: (restData: any) => null,
		};

		injector = ReflectiveInjector.resolveAndCreate([{
			provide: PieceService,
			useValue: mockPieceService,
		}]);

		fieldDescriptor = new MultiObjectFieldDescriptor(
			PieceService,
			'testField'
		);

		initModelInstanceList();
	});


	initModelInstanceList = () => {
		const ids = [42, 43, 44, 45, 46];

		modelInstanceList = ids.map(
			(id: number) =>
				new Piece(mockPieceService, {id: id})
		);
	};


	it('should convert restValue to list of instances of the '
			+ `appropriate model using service's .createLocalModelInstance()`,
			() => {

		spyOn(mockPieceService, 'createLocalModelInstance')
			.and.callFake(getNextModelInstance);
		
		// Would be dictionaries and not numbers in reality, but we just need any old unique identifiers here
		const restValueList = [
			1, 2, 3, 4, 5
		];
		
		const tsValue = fieldDescriptor.getTSValue(
			restValueList,
			injector
		);
		
		for(let restValue of restValueList) {
			expect(mockPieceService.createLocalModelInstance)
				.toHaveBeenCalledWith(restValue);
		}
		
		expect(tsValue).toEqual(modelInstanceList);
	});


	it('should convert null or undefined restValue to empty array as '
			+ 'tsValue', () => {

		for(let restValue of [null, undefined]) {
			const tsValue = fieldDescriptor.getTSValue(
				restValue,
				injector
			);

			expect(tsValue).toEqual([]);
		}
	});


	getNextModelInstance = () =>
		modelInstanceList[nextModelInstanceIndex++];


	it('.getRestValue() should throw error', () => {
		try {
			fieldDescriptor.getRestValue(modelInstanceList);
		} catch(RestConversionError) {
			return;
		}

		fail();	 // Didn't throw error
	});

});