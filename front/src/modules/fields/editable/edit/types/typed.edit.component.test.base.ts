// For testing subclasses of TypedEditComponent

import { Type } from '@angular/core';
import { async } from '@angular/core/testing';

import { HostedComponentTest } from 'testing';
import { TypedEditComponent } from './typed.edit.component';
import { EditHostComponent } from '../edit.component.test.base';



export abstract class TypedEditComponentTestBase<T>
		extends HostedComponentTest {

	constructor(
		hostedComponentType: Type<TypedEditComponent<T>>,
		hostComponentType: Type<EditHostComponent<T>>,
		testName?: string
	) {
		super(hostedComponentType, hostComponentType, testName);
	}


	protected defineTests(): void {
		super.defineTests();


		it('should emit cancel event when escape is pressed',
				async(() => {
			const event = new KeyboardEvent('keyup', {key: 'escape'});
			window.dispatchEvent(event);
			expect(this.hostComponent.onCancel).toHaveBeenCalled();
		}));

	}

}
