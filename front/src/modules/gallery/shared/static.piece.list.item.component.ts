import {
	Component,
	Input,
	ViewChild,
	ElementRef,
} from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { StaticOrderedListItemComponent }
	from 'modules/shared/static-ordered-list';

import { Piece } from 'modules/main/models';

import {
	getViewportRight,
	getViewportBottom,
} from 'utils';



type Coordinates = {left: number, top: number};

const defaultDetailBoxOffset: Coordinates = {
	left: 50,	// pixels, relative to left of thumbnail
	top: -25,	// relative to bottom of thumbnail
};

// Minimum clearance between detail box and right/bottom of screen (pixels)
const detailBoxPadding = {
	right: 25,
	bottom: 10,
}



@Component({
	selector: 'static-piece-list-item',
	templateUrl: './static.piece.list.item.component.html',
	styleUrls: ['./static.piece.list.item.component.scss'],
})
export class StaticPieceListItemComponent
		extends StaticOrderedListItemComponent<Piece> {

	private reorderSubscription: Subscription;

	@ViewChild('container') containerRef: ElementRef;
	@ViewChild('detail') detailBoxRef: ElementRef;


	detailBoxParams = {
		visible: false,
		left: 0,	// pixels, absolute
		top: 0,
	};

	imageParams = Piece.imageParams;


	ngOnInit(): void {
		if(this.reorder$) {
			this.reorderSubscription = this.reorder$.subscribe(
				() => this.detailBoxParams.visible = false
			);
		}
	}


	ngOnDestroy(): void {
		if(this.reorderSubscription)
			this.reorderSubscription.unsubscribe();
	}


	// Only if there are details to show
	private get shouldIncludeDetailBox(): boolean {
		return this.piece.hasValueForOneOf(
			'name',
			'price',
			'date',
			'description'
		);
	}


	get piece(): Piece {
		return this.object;
	}


	onThumbnailLoad(): void {
		this.load.emit();	// Let parent know we're ready
	}


	onMouseOver(): void {
		if(!this.shouldIncludeDetailBox)
			return;

		this.locateDetailBox();
		this.detailBoxParams.visible = true;
	}


	// Puts it in the correct position
	private locateDetailBox(): void {
		const defaultCoordinates = this.defaultDetailBoxCoordinates;
		const maxCoordinates = this.maxDetailBoxCoordinates;

		for(let coordinate of ['left', 'top']) {
			this.detailBoxParams[coordinate] = Math.min(
				defaultCoordinates[coordinate],
				maxCoordinates[coordinate]
			);
		}
	}


	private get defaultDetailBoxCoordinates(): Coordinates {
		return {
			left: this.container.offsetLeft + defaultDetailBoxOffset.left,

			top: this.container.offsetTop
				+ this.container.offsetHeight
				+ defaultDetailBoxOffset.top,
		};
	}


	private get container(): HTMLElement {
		return this.containerRef.nativeElement;
	}


	// i.e. maximum left value, maximum top value
	private get maxDetailBoxCoordinates(): Coordinates {
		return {
			left: 
				getViewportRight()
				- detailBoxPadding.right
				- this.detailBox.offsetWidth,

			top: 
				getViewportBottom() 
				- detailBoxPadding.bottom
				- this.detailBox.offsetHeight,
		};
	}


	private get detailBox(): HTMLElement {
		return this.detailBoxRef.nativeElement;
	}


	onMouseOut(): void {
		this.detailBoxParams.visible = false;
	}


	private onDetailBoxTransitionEnd(): void {
		// Rather than resetting position immediately after hiding, it needs to fade out first, so reset is triggered from here
		if(!this.detailBoxParams.visible)
			this.resetDetailBoxPosition();
	}


	// An invisible detail box can sometimes create a huge, empty scrollable area off the bottom of the page's content, so it needs to be placed somewhere that's definitely within the content area
	private resetDetailBoxPosition(): void {
		Object.assign(this.detailBoxParams, {
			left: 0,
			top: 0,
		});
	}

}