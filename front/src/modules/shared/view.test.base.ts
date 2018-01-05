// For testing subclasses of View

import { Type } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { View } from './view';
import { LoadScreenService } from 'modules/main/load-screen';

import {
	ComponentTest,
	mergeModuleMetadata,
} from 'testing';



export abstract class ViewTest extends ComponentTest {

	protected mockLoadScreenService: any;


	constructor(
		viewType: Type<View>,
		testName?: string
	) {
		super(viewType, testName);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();
		this.mockLoadScreenService = this.createMockLoadScreenService();

		const extraMetadata = {
			providers: [{
				provide: LoadScreenService,
				useValue: this.mockLoadScreenService,
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockLoadScreenService(): any {
		return jasmine.createSpyObj(
			'LoadScreenService',
			['show', 'hide']
		);
	}


	protected defineTests(): void {
		super.defineTests();


		it(`shouldn't hide load screen until ready`, () => {
			expect(this.mockLoadScreenService.hide).not.toHaveBeenCalled();
		});


		it('should hide load screen when ready', fakeAsync(() => {
			this.makeReady();
			flushMicrotasks();
			expect(this.mockLoadScreenService.hide).toHaveBeenCalled();
		}));


		it('should show load screen on destroy', fakeAsync(() => {
			this.makeReady();
			this.fixture.destroy();
			flushMicrotasks();
			expect(this.mockLoadScreenService.show).toHaveBeenCalled();
		}));

	}


	private makeReady(): void {
		this.fixture.detectChanges();
		this.triggerLoadScreenHide();
	}


	// Should do whatever is needed to make the load screen disappear and reveal the view itself (default: nothing)
	protected triggerLoadScreenHide(): void {}

}