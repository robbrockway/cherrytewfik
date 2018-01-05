import { Component, Type } from '@angular/core';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { HostedComponentTest } from 'testing';
import { SlowLoadingComponent } from './slow.loading.component';



export abstract class SlowLoadingHostComponent {
	onLoad = jasmine.createSpy('onLoad');
}



export abstract class SlowLoadingComponentTest
		extends HostedComponentTest {

	constructor(
		hostedComponentType: Type<SlowLoadingComponent>,
		hostComponentType: Type<SlowLoadingHostComponent>,
		testName?: string
	) {
		super(
			hostedComponentType,
			hostComponentType,
			testName
		);
	}


	// definePreloadTests() and definePostloadTests() below are intended for custom testing; only override this one for tests that have no regard for whether or not the load event has been emitted
	protected defineTests(): void {
		super.defineTests();


		describe(', before loading,', () => {
			
			this.definePreloadTests();

			it('should not emit load event', () => {
				expect(this.hostComponent.onLoad).not.toHaveBeenCalled();
			});

		});


		it('should emit load event once loaded', fakeAsync(() => {
			this.load();
			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));


		describe(', once loaded,', () => {

			beforeEach(fakeAsync(() => this.load()));

			this.definePostloadTests();

		});

	}


	// Tests to be executed before load event
	protected definePreloadTests(): void {}


	protected load(): void {
		this.triggerLoadEvent();
		flushMicrotasks();
	}


	// Should do whatever is needed to make the component load
	protected abstract triggerLoadEvent(): void;


	// And, tests after
	protected definePostloadTests(): void {}


	// Sometimes, load event will need to fire again
	protected checkComponentReloads(): void {
		this.hostComponent.onLoad.calls.reset();	// Forget about the first time
		this.load();
		expect(this.hostComponent.onLoad).toHaveBeenCalled();
	}

}