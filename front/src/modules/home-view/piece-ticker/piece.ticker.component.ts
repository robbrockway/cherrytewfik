// Cycles randomly through all images of pieces, providing links to them as it goes

import {
	Component,
	Input,
	SimpleChange,
	SimpleChanges,
} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { PieceTickerService } from './piece.ticker.service';
import { Piece } from 'modules/main/models';
import { SlowLoadingComponent } from 'modules/shared';
import { TickerImage } from 'modules/shared/image-ticker';
import { randomBetween, replaceArrayContents } from 'utils';



@Component({
	selector: 'piece-ticker',
	templateUrl: './piece.ticker.component.html',
	styleUrls: ['./piece.ticker.component.scss'],
})
export class PieceTickerComponent extends SlowLoadingComponent {

	@Input() pieces: Piece[];

	imageList: TickerImage[];
	private upcomingImage: TickerImage;
	private currentImage: TickerImage;

	// Some images, used by other PieceTickerComponents, are locked by PieceTickerService
	private lockedImages = new Set<TickerImage>([]);
	private lockedImagesSubscription: Subscription;
	
	turnaroundTime: number;
	imageParams = Piece.imageParams;

	static turnaroundTimeLimits = {
		min: 10000,
		max: 20000,
	};


	constructor(
		private pieceTickerService: PieceTickerService
	) {
		super();
		this.randomiseTiming();
	}


	private randomiseTiming() {
		this.turnaroundTime = randomBetween(
			PieceTickerComponent.turnaroundTimeLimits.min,
			PieceTickerComponent.turnaroundTimeLimits.max
		);
	}


	ngOnChanges(changes: SimpleChanges): void {
		if(this.imagesAreBeingInitialised(changes.pieces))
			this.watchForLockedImages();
	}


	private imagesAreBeingInitialised(
		piecesChange: SimpleChange
	): boolean {
		return !!(
			piecesChange &&
			!piecesChange.previousValue &&
			piecesChange.currentValue
		);
	}


	private watchForLockedImages(): void {
		const lockedImages$ = 
			this.pieceTickerService.getLockedImages(this);

		this.lockedImagesSubscription = lockedImages$.subscribe(
				(lockedImagesList: TickerImage[]) => {
			this.lockedImages = new Set(lockedImagesList);
			this.refreshImageList();
		});
	}


	private refreshImageList(): void {
		const pieces = this.availablePieces;

		if(!pieces.length)
			return;		// All are locked; just stay with whatever list is already in place

		const newImageList = this.availablePieces.map((piece: Piece) => {
			return {
				filename: piece.image,
				alt: piece.name,
				routerLink: piece.routerLink,
			};
		});

		// Replacing the entire array, rather than just its contents, upsets the change detector
		this.imageList = replaceArrayContents(
			this.imageList,
			newImageList
		);
	}


	// Don't use pieces whose images are locked by PieceTickerService
	private get availablePieces(): Piece[] {
		const piecesWithImages = this.piecesWithImages;

		return piecesWithImages.filter(
			(piece: Piece) => !this.imageIsLocked(piece)
		);
	}


	private get piecesWithImages(): Piece[] {
		return this.pieces.filter(
			(piece: Piece) => !!piece.image
		);
	}


	private imageIsLocked(piece: Piece): boolean {
		for(let lockedImage of Array.from(this.lockedImages)) {
			if(lockedImage.filename === piece.image)
				return true;
		}

		return false;
	}


	ngOnDestroy(): void {
		this.lockedImagesSubscription.unsubscribe();
		
		for(let image of [this.currentImage, this.upcomingImage])
			this.pieceTickerService.unlockImage(image);
	}


	// Called when ImageTickerComponent gets a new image ready for view
	onImageSelect(newImage: TickerImage): void {
		// Lock image for this component, i.e. make it unavailable to others
		this.pieceTickerService.lockImage(newImage, this);
		this.upcomingImage = newImage;
	}


	// and when this new image is actually shown, i.e. placed in foreground
	onImageShow(newImage: TickerImage): void {
		if(this.currentImage)
			this.pieceTickerService.unlockImage(this.currentImage);
	
		this.currentImage = newImage;
	}

}