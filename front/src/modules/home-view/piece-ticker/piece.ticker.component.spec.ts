import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Piece } from 'modules/main/models';

import {
	SlowLoadingComponentTest,
	SlowLoadingHostComponent,
} from 'modules/shared/slow.loading.component.test.base';

import { TickerImage } from 'modules/shared/image-ticker';
import { PieceTickerComponent } from './piece.ticker.component';
import { PieceTickerService } from './piece.ticker.service';

import {
	testPieceData,
	MockImageTickerDirective,
	forEachPair,
	mergeModuleMetadata,
	copy,
} from 'testing';



@Component({
	template: `
		<piece-ticker
			[pieces]="pieces"
			(load)="onLoad()"
		></piece-ticker>
	`,
})
class HostComponent extends SlowLoadingHostComponent {
	pieces = testPieceData.toListOfModelInstances();
}



class PieceTickerComponentTest extends SlowLoadingComponentTest {

	private mockPieceTickerService: any;

	// For mock service; emits an empty list to begin with
	private lockedImages$: BehaviorSubject<TickerImage[]>;


	constructor() {
		super(PieceTickerComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		this.mockPieceTickerService = this.createMockPieceTickerService();

		const extraMetadata = {
			declarations: [
				MockImageTickerDirective,
			],

			providers: [{
				provide: PieceTickerService,
				useValue: this.mockPieceTickerService,
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockPieceTickerService(): any {
		this.lockedImages$ = new BehaviorSubject([]);

		const spyMethodReturnValues = {
			lockImage: null,
			unlockImage: null,
			getLockedImages: this.lockedImages$,
		};

		return jasmine.createSpyObj(
			'pieceTickerService',
			spyMethodReturnValues
		);
	}


	protected defineTests(): void {
		super.defineTests();

		let checkTickerImageListMatchesPieces: (
			checkPair: (tickerImage: TickerImage, piece: Piece) => void
		) => void;

		let checkTickerImageHasCorrectFilename: (
			tickerImage: TickerImage,
			piece: Piece
		) => void;

		let checkTickerImageHasCorrectAltText: (
			tickerImage: TickerImage,
			piece: Piece
		) => void;

		let checkTickerImageHasCorrectRouterLink: (
			tickerImage: TickerImage,
			piece: Piece
		) => void;

		let setLockedImages: (images: TickerImage[]) => void;
		let lockAllImages: () => void;
		let selectImage: (image: TickerImage) => void;
		let showImage: (image: TickerImage) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it('should use turnaround time between min and max', () => {
			const turnaroundTime =
				this.mockImageTickerComponent.turnaroundTime;

			expect(turnaroundTime).not.toBeLessThan(
				PieceTickerComponent.turnaroundTimeLimits.min
			);

			expect(turnaroundTime).not.toBeGreaterThan(
				PieceTickerComponent.turnaroundTimeLimits.max
			);
		});


		it('should pass correct image parameters to '
				+ 'ImageTickerComponent', () => {
			expect(this.mockImageTickerComponent).toEqual(
				jasmine.objectContaining(Piece.imageParams)
			);
		});


		it('should pass correct image filenames to '
				+ 'ImageTickerComponent', () => {
			
			checkTickerImageListMatchesPieces(
				checkTickerImageHasCorrectFilename
			);
		});


		checkTickerImageHasCorrectFilename = (
			tickerImage: TickerImage,
			piece: Piece
		) => {
			expect(tickerImage.filename).toBe(piece.image);
		};


		checkTickerImageListMatchesPieces = (
			checkPair: (tickerImage: TickerImage, piece: Piece) => void
		) => {
			forEachPair(
				this.mockImageTickerComponent.imageList,
				this.piecesThatHaveImages,
				checkPair
			);
		};


		it('should pass correct piece names to '
				+ 'ImageTickerComponent as alt text', () => {

			checkTickerImageListMatchesPieces(
				checkTickerImageHasCorrectAltText
			);
		});


		checkTickerImageHasCorrectAltText = (
			tickerImage: TickerImage,
			piece: Piece
		) => {
			expect(tickerImage.alt).toBe(piece.name);
		};


		it('should pass correct router links to '
				+ 'ImageTickerComponent', () => {

			checkTickerImageListMatchesPieces(
				checkTickerImageHasCorrectRouterLink
			);
		});


		checkTickerImageHasCorrectRouterLink = (
			tickerImage: TickerImage,
			piece: Piece
		) => {
			expect(tickerImage.routerLink).toBe(piece.routerLink);
		};


		it(`shouldn't pass any null or empty-string filenames to `
				+ 'ImageTickerComponent', () => {
			for(let tickerImage of this.mockImageTickerComponent.imageList)
				expect(tickerImage.filename).toBeTruthy();
		});


		it(`shouldn't provide images to ImageTickerComponent that are `
				+ 'locked by PieceTickerService', async(() => {
			const image = this.firstImage;
			setLockedImages([image]);

			expect(this.mockImageTickerComponent.imageList)
				.not.toContain(image);
		}));


		setLockedImages = (images: TickerImage[]) => {
			this.lockedImages$.next(images);
			this.fixture.detectChanges();
		};


		it('should provide images to ImageTickerComponent that have been '
				+ 'unlocked by PieceTickerService', async(() => {
			const image = this.firstImage;
			setLockedImages([image]);
			setLockedImages([]);

			expect(this.mockImageTickerComponent.imageList)
				.toContain(image);
		}));


		it('should provide full list of images to ImageTickerComponent, '
				+ 'if they are all locked by PieceTickerService',
				async(() => {

			lockAllImages();

			checkTickerImageListMatchesPieces(
				checkTickerImageHasCorrectFilename
			);
		}));


		lockAllImages = () => {
			setLockedImages(this.mockImageTickerComponent.imageList);
		};


		it('should lock an image, when it is selected by ImageTickerComponent',
				async(() => {
			selectImage(this.firstImage);

			expect(this.mockPieceTickerService.lockImage)
				.toHaveBeenCalledWith(
					this.firstImage,
					this.hostedComponent
				);
		}));


		selectImage = (image: TickerImage) =>
			this.mockImageTickerComponent.select.emit(image);


		it('should unlock its currently-shown image, when the next one is '
				+ 'shown by ImageTickerComponent', async(() => {
			showImage(this.firstImage);

			const newImage = this.mockImageTickerComponent.imageList[1];
			showImage(newImage);

			expect(this.mockPieceTickerService.unlockImage)
				.toHaveBeenCalledWith(this.firstImage);
		}));


		showImage = (image: TickerImage) =>
			this.mockImageTickerComponent.show.emit(image);


		it('should unsubscribe from locked-images stream when destroyed',
				() => {
			this.fixture.destroy();

			const observers = this.lockedImages$.observers;
			expect(observers.length).toBe(0);
		});


		it('should unlock all images when destroyed',
				() => {
			const unlockSpy = this.mockPieceTickerService.unlockImage;
			unlockSpy.calls.reset();
			this.fixture.destroy();
			expect(unlockSpy.calls.count()).toBe(2);
		});

	}


	private get mockImageTickerComponent(): MockImageTickerDirective {
		return this.getChildDirective(MockImageTickerDirective);
	}


	private get piecesThatHaveImages(): Piece[] {
		return this.hostComponent.pieces.filter(
			(piece: Piece) => !!piece.image
		);
	}


	private get firstImage(): TickerImage {
		return this.mockImageTickerComponent.imageList[0];
	}


	protected triggerLoadEvent(): void {
		this.mockImageTickerComponent.load.emit();
	}

}


new PieceTickerComponentTest();