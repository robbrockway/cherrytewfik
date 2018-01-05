// Image that zooms and pans on mouse hover


import {
	Component,
	Input,
	Output,
	EventEmitter,
	ViewChild,
	ElementRef,
	SimpleChanges,
} from '@angular/core';

import { SlowLoadingComponent } from 'modules/shared';

import {
	generateImgSrcset,
	generateImgSrc,
	fullImageSize,
} from 'utils';



@Component({
	selector: 'thumbnail',
	templateUrl: './thumbnail.component.html',
	styleUrls: ['./thumbnail.component.scss'],
})
export class ThumbnailComponent extends SlowLoadingComponent {

	private _rootDirectory: string;
	private _widthList: number[];
	private _filename: string;
	private numImagesLoadedOrFailed = 0;

	unzoomedSrc: string;
	zoomedSrc: string;
	srcset: string;
	zoomed: boolean = false;
	transformProperty: string = 'none';		// CSS, for zoomed image

	@ViewChild('container') container: ElementRef;

	@Output() mouseover = new EventEmitter<MouseEvent>();
	@Output() mouseout = new EventEmitter<MouseEvent>();

	@Input() alt: string;

	@Input() set rootDirectory(directory: string) {
		this._rootDirectory = directory;
		this.updateImgParams();
	}


	private updateImgParams(): void {
		// When component is initialising, this function will be called three times (as rootDirectory, widthList and filename are set). It needn't do anything until they are all in place.
		if(!this.srcPropertiesAreSet())
			return;	

		const unzoomedWidth = this._widthList[0];
		const zoomedWidth = 
			this.widthsIncludeFullsize() ?
			fullImageSize : this._widthList[1];

		this.unzoomedSrc = generateImgSrc(
			this._rootDirectory,
			unzoomedWidth,
			this._filename
		);

		this.zoomedSrc = generateImgSrc(
			this._rootDirectory,
			zoomedWidth,
			this._filename
		);

		this.srcset = generateImgSrcset(
			this._rootDirectory,
			this._widthList,
			this._filename
		);
	}


	private srcPropertiesAreSet(): boolean {
		return !!(
			this._rootDirectory
			&& this._widthList
			&& this._widthList.length
			&& this._filename
		);
	}


	private widthsIncludeFullsize(): boolean {
		return this._widthList.indexOf(fullImageSize) !== -1;
	}


	@Input() set widthList(list: number[]) {
		this._widthList = list;
		this.updateImgParams();
	}


	get filename(): string {
		return this._filename;
	}


	@Input() set filename(filename: string) {
		this._filename = filename;
		this.updateImgParams();
	}


	ngOnChanges(changes: SimpleChanges): void {
		if(changes['filename'])
			this.numImagesLoadedOrFailed = 0;	// Await loading of new images
	}


	private onImageLoadOrError(): void {
		this.numImagesLoadedOrFailed++;
		
		if(this.numImagesLoadedOrFailed === 2)
			this.onReady();
	}


	onMouseOver(event: MouseEvent): void {
		this.zoomed = true;
	}


	onMouseOut(event: MouseEvent): void {
		this.zoomed = false;
	}


	onMouseMove(event: MouseEvent): void {
		const imageX = this.containerRect.left - event.clientX; 
		const imageY = this.containerRect.top - event.clientY;

		this.transformProperty =
			`translate3d(${imageX}px, ${imageY}px, 0px)`;
	}


	private get containerRect(): ClientRect {
		const container = this.container.nativeElement as HTMLDivElement;
		return container.getBoundingClientRect();
	}

}
