import { Component, DebugElement } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';
import { BrowserAnimationsModule }
	from '@angular/platform-browser/animations';

import { LoadScreenComponent } from './load.screen.component';

import { 
	HostedComponentTest,
	mergeModuleMetadata,
} from 'testing';



@Component({
	template: `
		<load-screen 
			[visible]="visible"
			[animation]="animation"
		></load-screen>
	`,
})
class HostComponent {
	visible: boolean = false;
	animation: string = 'fadeInOut';
}



class LoadScreenComponentTest extends HostedComponentTest {

	constructor() {
		super(
			LoadScreenComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();
		const extraMetadata = {imports: [BrowserAnimationsModule]};
		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();

		let expectBackdrop: () => any;


		it(`shouldn't include icon when 'visible' is false`, () => {
			this.hostComponent.visible = false;
			this.fixture.detectChanges();
			expectBackdrop().toBeFalsy();
		});


		expectBackdrop = () => this.expectChildNativeElement('.loadScreen');


		it(`should include icon when 'visible' is true`, () => {
			this.hostComponent.visible = true;
			this.fixture.detectChanges();
			expectBackdrop().toBeTruthy();
		});


		describe('should set animation, when specified,', () => {

			let testAnimation: (handle: string) => void;


			beforeEach(() => {
				this.hostComponent.visible = true;
				this.fixture.detectChanges();
			});


			it('to fadeOut', () => {
				testAnimation('fadeOut');
			});


			testAnimation = (handle: string) => {
				this.hostComponent.animation = handle;
				this.fixture.detectChanges();

				const backdrop = 
					this.getChildDebugElementByCss('.loadScreen');
				
				const propertyNames = Object.keys(backdrop.properties);
				expect(propertyNames).toEqual([`@${handle}`]);
			};


			it('to fadeInOut', () => {
				testAnimation('fadeInOut');
			});

		});

	}

}


new LoadScreenComponentTest();
