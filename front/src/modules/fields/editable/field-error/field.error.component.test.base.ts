import { Type } from '@angular/core';
import { async } from '@angular/core/testing';

import { FieldErrorComponentBase } from './field.error.component.base';
import { HostedComponentTest } from 'testing';



export abstract class FieldErrorHostComponent {
	message: string;
	onTryAgain = jasmine.createSpy('onTryAgain');
}



export abstract class FieldErrorComponentTestBase 
		extends HostedComponentTest {

	constructor(
		hostedComponent: Type<FieldErrorComponentBase>,
		hostComponent: Type<FieldErrorHostComponent>,
		testName?: string
	) {
		super(hostedComponent, hostComponent, testName);
	}


	protected defineTests(): void {
		super.defineTests();


		beforeEach(() => {
			this.hostComponent.message = 'Error message';
			this.fixture.detectChanges();
		});


		it('should show error message', () => {
			this.checkChildTextContentIs(
				'.error',
				this.hostComponent.message
			);
		});


		it('should emit tryAgain event when link is clicked',
				async(() => {
			const link = this.getChildNativeElementByCss('a');
			
			const event = new Event('click');
			link.dispatchEvent(event);

			expect(this.hostComponent.onTryAgain)
				.toHaveBeenCalledWith(event);
		}));

	}

}