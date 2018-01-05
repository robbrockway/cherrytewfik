// Contains two images: one in front, one behind. When the 'turnaround' timer expires, they are switched, and the behind ('background') image is changed to a different source path while unseen behind the foreground image.


import {
	Component,
	Input,
	ChangeDetectorRef,
	Output,
	EventEmitter,
	SimpleChanges,
	SimpleChange,
} from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/timer';
import 'rxjs/add/observable/interval';

import { TickerImage } from './ticker.image.component';
import { SlowLoadingComponent } from 'modules/shared';

import {
	generateImgSrcset,
	generateImgSrc,
	getLastItem,
	trueForAny,
} from 'utils';



// What proportion of the overall time showing each image should be taken by a fade?
const fadeTimeMultiplier = 0.1;



@Component({
	selector: 'image-ticker',
	templateUrl: './image.ticker.component.html',
	styleUrls: ['./image.ticker.component.scss'],
})
export class ImageTickerComponent extends SlowLoadingComponent {

	@Input() imageList: TickerImage[];
	@Input() rootDirectory: string;
	@Input() widthList: number[];	// sizes of available copies of images
	@Input() turnaroundTime: number;
	@Input() showLinks: boolean = false;

	// Emits each new image as it's selected, ready for showing
	@Output() select = new EventEmitter<TickerImage>();

	// and as it actually shows
	@Output() show = new EventEmitter<TickerImage>();

	currentImagePair: TickerImage[] = [null, null];
	showingSecondImageInForeground: boolean = false;
	fadeTransition: string;
	animationDuration: number;
	
	private timerSubscription: Subscription;
	private numImagesLoaded = 0;


	constructor(private changeDetector: ChangeDetectorRef) {
		super();
	}


	ngOnInit(): void {
		this.fadeTransition = this.createFadeTransition();
		this.animationDuration = this.createAnimationDuration();		

		this.initForeground();
		this.initTimer();
		this.changeBackground();
	}


	// CSS transition property for images
	private createFadeTransition(): string {
		const fadeTime = 
			Math.floor(this.turnaroundTime * fadeTimeMultiplier);

		return `opacity ${fadeTime}ms`;
	}


	// Enough time (in ms) that each image is still moving as it fades to the next one
	private createAnimationDuration(): number {
		return this.turnaroundTime * (1 + fadeTimeMultiplier);
	}


	ngAfterViewInit(): void {
		this.showForegroundAfterInit();
	}


	private initForeground(): void {
		const image = this.getRandomImageFromList();
		this.cacheImageProperties(image);
		this.select.emit(image);
		this.foregroundImage = image;
		this.showForegroundAfterInit();
	}


	private showForegroundAfterInit(): void {
		// .visible = true must be set concurrently, so that the image element has time to initialise before it's told to fade in
		Observable.timer(0).subscribe(() => {
			if(this.foregroundImage) {
				this.foregroundImage.visible = true;
				this.foregroundImage.moving = true;
				this.show.emit(this.foregroundImage);
			}
		});
	}


	private getRandomImageFromList(): TickerImage {
		if(!this.imageList.length)
			return null;

		const index = Math.floor(Math.random() * this.imageList.length);
		return this.imageList[index];
	}


	private cacheImageProperties(image: TickerImage): void {
		if(!image)
			return;

		image.src = image.src || this.generateSrc(image);
		image.srcset = image.srcset || this.generateSrcset(image);
		image.visible = false;	// ready for fade-in
		image.moving = false;
	}


	private generateSrc(image: TickerImage, width?: number): string {
		width = width || getLastItem(this.widthList);
		return generateImgSrc(this.rootDirectory, width, image.filename);
	}


	private generateSrcset(image: TickerImage): string {
		return generateImgSrcset(
			this.rootDirectory,
			this.widthList,
			image.filename
		);
	}


	private initTimer(): void {
		if(this.timerSubscription)
			this.timerSubscription.unsubscribe();
		
		const timer = Observable.interval(this.turnaroundTime);

		this.timerSubscription = timer.subscribe(
			() => this.nextImage()
		);
	}


	private nextImage(): void {
		this.toggleForeground();

		// Delay getting the next image ready until the previous has well-and-truly faded out
		Observable.timer(this.turnaroundTime / 2)
			.subscribe(() => this.changeBackground());
	}


	private toggleForeground(): void {
		this.showingSecondImageInForeground =
			!this.showingSecondImageInForeground;

		if(this.foregroundImage) {
			this.foregroundImage.visible = true;
			this.foregroundImage.moving = true;
		}

		this.show.emit(this.foregroundImage);
	}
	

	private changeBackground(): void {
		const newImage = this.getFreshImage();
		this.cacheImageProperties(newImage);
		this.backgroundImage = newImage;
		this.select.emit(newImage);
	}


	private getFreshImage(): TickerImage {
		if(this.imageList.length === 1)
			// Image must be foreground and background simultaneously, so we need multiple copies
			return this.copyFirstImage();

		let image: TickerImage;

		do {
			image = this.getRandomImageFromList();
		} while(!this.newImageIsFreshEnough(image));

		return image;
	}


	private copyFirstImage(): TickerImage {
		const original = this.imageList[0];
		const copy = {};

		for(let propertyName of ['filename', 'alt', 'routerLink'])
			copy[propertyName] = original[propertyName];

		return copy as TickerImage;
	}


	// Test to make sure images aren't repeating themselves too much
	private newImageIsFreshEnough(newImage: TickerImage): boolean {
		if(this.imageList.length <= 1)
			return true;	// Only one available image

		if(this.imageList.length === 2)
			return !imagesMatch(newImage, this.foregroundImage);

		if(this.imageList.length > 2
				&& this.imageIsCurrentlyUsed(newImage))
			return false;

		return true;
	}


	private imageIsCurrentlyUsed(image: TickerImage): boolean {
		return imagesMatch(image, this.foregroundImage)
			|| imagesMatch(image, this.backgroundImage);
	}


	ngOnChanges(changes: SimpleChanges): void {
		if(this.hasChanged(changes.imageList))
			this.showNewImageList();
	}


	// Only if there previously was a value, and now there's a new one
	private hasChanged(change: SimpleChange): boolean {
		return !!(
			change
			&& change.previousValue
			&& change.currentValue
		);
	}


	private showNewImageList(): void {
		// New images; previously blank
		if(!this.foregroundImage) {
			this.initForeground();
			this.showForegroundAfterInit();
			this.initTimer();
		} 

		// Had an image queued up for showing that is now defunct
		if(!this.imageIsInList(this.backgroundImage))
			this.changeBackground();

		// Have been showing one that's now defunct
		if(this.foregroundIsDefunct) {
			this.toggleForeground();
			this.backgroundImage.visible = false;
			this.initTimer();
		}
	}


	private imageIsInList(image: TickerImage): boolean {
		if(!image)
			return false;

		return trueForAny(
			this.imageList,
			(listedImage: TickerImage) =>
				listedImage.filename === image.filename
		);
	}


	private get foregroundIsDefunct(): boolean {
		return !!this.foregroundImage
			&& !this.imageIsInList(this.foregroundImage);
	}


	onImageLoad(): void {
		this.numImagesLoaded++;

		if(this.numImagesLoaded === 2)
			this.load.emit();	// ready to show
	}


	ngOnDestroy(): void {
		this.timerSubscription.unsubscribe();
	}


	private imageIsVisible(index: number): boolean {
		return this.currentImagePair[index].visible;
	}

	
	private get foregroundImage(): TickerImage {
		return this.currentImagePair[this.foregroundIndex];
	}


	private set foregroundImage(image: TickerImage) {
		this.currentImagePair[this.foregroundIndex] = image;
	}


	// Index in .currentImagePair
	private get foregroundIndex(): number {
		return +this.showingSecondImageInForeground;
	}


	private get backgroundImage(): TickerImage {
		return this.currentImagePair[this.backgroundIndex];
	}
	
	
	private get backgroundIndex(): number {
		return +!this.showingSecondImageInForeground;
	}


	private set backgroundImage(image: TickerImage) {
		this.currentImagePair[this.backgroundIndex] = image;
	}

}


function imagesMatch(a: TickerImage, b: TickerImage): boolean {
	return !!(
		a && b && a.filename === b.filename
	);
}
