import { Type } from '@angular/core';

import {
	SavingMessageComponentBase,
	SavingState,
} from './saving.message.component.base';

import { HostedComponentTest } from 'testing';



export abstract class SavingMessageHostComponent {
	state: SavingState;
}



export abstract class SavingMessageComponentTestBase
		extends HostedComponentTest {

	constructor(
		hostedComponent: Type<SavingMessageComponentBase>,
		hostComponent: Type<SavingMessageHostComponent>,
		testName?: string
	) {
		super(hostedComponent, hostComponent, testName);
	}


	protected setState(state: SavingState): void {
		this.hostComponent.state = state;
		this.fixture.detectChanges();
	}

}