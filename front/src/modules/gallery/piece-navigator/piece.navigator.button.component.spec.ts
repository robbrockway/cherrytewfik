import { Component, DebugElement } from '@angular/core';

import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';

import { PieceNavigatorButtonComponent }
	from './piece.navigator.button.component';

import { 
	SlowLoadingComponentTest,
	SlowLoadingHostComponent,
} from 'modules/shared/slow.loading.component.test.base';

import { PieceNavigatorButton } from './piece.navigator.button';
import { ImagePreloader } from 'modules/shared';
import { mergeModuleMetadata } from 'testing';



@Component({
	template: `
		<piece-navigator-button
			[button]="button"
			(load)="onLoad()"
		></piece-navigator-button>
	`,
})
class HostComponent extends SlowLoadingHostComponent {
	button = new PieceNavigatorButton(
		PieceNavigatorButton.Index.Previous,
		'Previous',
		'previous.svg',
		true
	);
}



class PieceNavigatorButtonComponentTest extends SlowLoadingComponentTest {

	private mockImagePreloader: any;
	private imagePreload$: Subject<any>;
	private button: PieceNavigatorButton;


	constructor() {
		super(
			PieceNavigatorButtonComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		this.mockImagePreloader = this.createMockImagePreloader();

		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			providers: [
				{provide: ImagePreloader, useValue: this.mockImagePreloader},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockImagePreloader(): any {
		this.imagePreload$ = new Subject<any>();

		const returnValues = {
			loadImages: this.imagePreload$,
		};

		return jasmine.createSpyObj('ImagePreloader', returnValues);
	}


	protected triggerLoadEvent(): void {
		this.imagePreload$.complete();
		this.fixture.detectChanges();
	}


	protected defineTests(): void {
		super.defineTests();


		let button: PieceNavigatorButton;

		let disable: () => void;
		let getMainDiv: () => DebugElement;
		let enable: () => void;
		let getAnchor: () => DebugElement;
		let getNativeImage: () => HTMLImageElement;


		beforeEach(() => {
			button = this.hostComponent.button;
		});


		it('should give main div .disabled class if disabled', () => {
			disable();
			const mainDiv = getMainDiv();
			expect(mainDiv.classes['disabled']).toBeTruthy();
		});


		disable = () => {
			button.enabled = false;
			this.fixture.detectChanges();
		};


		getMainDiv = () => this.getChildDebugElementByCss('div');


		it(`shouldn't give main div .disabled class if enabled`, () => {
			enable();
			const mainDiv = getMainDiv();
			expect(mainDiv.classes['disabled']).toBeFalsy();
		});


		enable = () => {
			button.enabled = true;
			this.fixture.detectChanges();
		};


		it(`shouldn't include anchor element if disabled`, () => {
			disable();
			expect(getAnchor()).toBeFalsy();
		});


		getAnchor = () => this.getChildDebugElementByCss('a');


		it('should include anchor element if enabled', () => {
			enable();
			expect(getAnchor()).toBeTruthy();
		});


		it('should show button.src as img src', () => {
			const filenames = ['previous.svg', 'random.svg', 'next.svg'];

			for(let filename of filenames) {
				button.filename = filename;
				this.fixture.detectChanges();
				const img = getNativeImage();
				expect(img.src).toContain(button.src);
			}
		});


		getNativeImage = () => this.getChildNativeElementByCss(
			'img'
		) as HTMLImageElement;


		it('should show button.label as main text', () => {
			const labels = ['Previous', 'Random', 'Next'];

			for(let label of labels) {
				button.label = label;
				this.fixture.detectChanges();
				this.checkChildTextContentIs('div', label);
			}
		});

	}


	protected definePreloadTests(): void {
		
		it('should preload both (enabled/disabled) images on '
				+ 'initialisation', () => {

			const button = this.hostComponent.button;
			this.fixture.detectChanges();
		
			expect(this.mockImagePreloader.loadImages)
				.toHaveBeenCalledWith(
					button.enabledSrc,
					button.disabledSrc
				);
		});

	}

}


new PieceNavigatorButtonComponentTest();