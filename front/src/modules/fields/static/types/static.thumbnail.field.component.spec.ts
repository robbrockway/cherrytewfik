import { Component } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { Piece } from 'modules/main/models';

import { StaticThumbnailFieldComponent }
	from './static.thumbnail.field.component';

import {
	StaticImageFieldHostComponent,
	StaticImageFieldComponentTestBase,
} from './static.image.field.component.test.base';

import {
	MockThumbnailDirective,
} from 'testing';



@Component({
	template: `
		<static-thumbnail-field
			[object]="object"
			[propertyName]="propertyName"
			[widthList]="widthList"
			[rootDirectory]="rootDirectory"
			(load)="onLoad()"
		></static-thumbnail-field>
	`,
})
class HostComponent extends StaticImageFieldHostComponent {}



class StaticThumbnailFieldComponentTest
		extends StaticImageFieldComponentTestBase {

	constructor() {
		super(
			StaticThumbnailFieldComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(MockThumbnailDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let checkThumbnailHasCorrectFilename: () => void;
		let triggerPlaceholderLoadEvent: () => void;


		beforeEach(() => {
			this.initComponentParams();
		});


		it('should pass correct parameters to ThumbnailComponent', () => {
			this.checkSubcomponentMatchesHostComponentProperties(
				MockThumbnailDirective,
				['widthList', 'rootDirectory']
			);

			checkThumbnailHasCorrectFilename();
		});


		checkThumbnailHasCorrectFilename = () => {
			expect(this.mockThumbnailComponent.filename)
				.toBe(this.testPiece.image);
		};


		it('should emit load event if no image is given, once placeholder '
				+ 'image has loaded', fakeAsync(() => {
			this.setValueToNothing();
			triggerPlaceholderLoadEvent();
			flushMicrotasks();
			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));


		triggerPlaceholderLoadEvent = () =>
			this.img.dispatchEvent(new Event('load'));

	}


	private initComponentParams(): void {
		this.setComponentParams(this.testPiece, 'image');
	}


	protected get mockThumbnailComponent(): MockThumbnailDirective {
		return this.getChildDirective(MockThumbnailDirective);
	}


	protected get placeholderImgSrc(): string {
		return 'images/placeholders/dark.svg';
	}


	protected triggerLoadEvent(): void {
		// Ready once the thumbnail itself has loaded
		this.mockThumbnailComponent.load.emit();
	}

}


new StaticThumbnailFieldComponentTest();