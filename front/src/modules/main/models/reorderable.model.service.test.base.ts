import { async } from '@angular/core/testing';
import { RequestMethod } from '@angular/http';

import { ModelServiceTest } from './model.service.test.base';
import { ReorderableModelService } from './reorderable.model.service';
import { Model } from './model';

import {
	TestField,
	checkArrayPKsAreEqual,
} from 'testing';



export abstract class ReorderableModelServiceTest<T extends Model>
		extends ModelServiceTest<T> {


	protected defineTests(): void {
		super.defineTests();

		let service: ReorderableModelService<T>;


		beforeEach(() => {
			service = this.modelService as ReorderableModelService<T>;
		});


		describe('.reorder()', () => {

			const testDataInReverseOrder =
				this.testData.getInReverse();

			const objectsInReverseOrder =
				this.generateObjectsInReverseOrder();

			let getExpectedRequestData: () => {reorder: number[]};

		
			it('should send correct HTTP request', done => {
				this.setMockResponseData(
					testDataInReverseOrder
				);
				
				this.watchForRequest(
					RequestMethod.Put,
					null,	// no pk, i.e. pure /<model> url
					getExpectedRequestData(),
					done
				);

				service.reorder(objectsInReverseOrder);
			});


			getExpectedRequestData = () => {
				const pksInReverseOrder = objectsInReverseOrder.map(
					(object: Model) => object.pk as number
				);

				return {
					reorder: pksInReverseOrder,
				};
			};


			it('should return Observable of list of objects in new order',
					async(() => {

				this.setMockResponseData(
					testDataInReverseOrder
				);
				
				service.reorder(objectsInReverseOrder).subscribe(
						(objectsInConfirmedOrder: Model[]) => {

					checkArrayPKsAreEqual(
						objectsInConfirmedOrder,
						objectsInReverseOrder
					);

				});

			}));


			it('should throw error on failure',
				this.testRequestThrowsErrorOnFailure(() =>
					service.reorder(objectsInReverseOrder)
				)
			);

		});

	}


	private generateObjectsInReverseOrder(): T[] {
		const objectsInOriginalOrder =
			this.testData.toListOfModelInstances(this.modelService);

		return objectsInOriginalOrder.reverse();
	}

}
