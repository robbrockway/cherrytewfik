// Page that gives a close-up view of a single piece and its properties

import { Component, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { GalleryView } from './gallery.view';

import {
	Piece,
	PieceService,
	Category,
	CategorySelector,
	UserService,
} from 'modules/main/models';

import { LoadScreenService } from 'modules/main/load-screen';



@Component({
	templateUrl: './piece.view.html',
	styleUrls: ['./piece.view.scss'],
})
export class PieceView extends GalleryView<Piece> {

	imageParams = Piece.imageParams;
	private pieceNavigatorLoaded = false;
	private imageLoaded = false;
	private pieceUpdateSubscription: Subscription;


	constructor(
		private router: Router,
		route: ActivatedRoute,
		pieceService: PieceService,
		private userService: UserService,
		categorySelector: CategorySelector,
		loadScreenService: LoadScreenService
	) {
		super(route, pieceService, categorySelector, loadScreenService);
	}


	ngOnInit(): void {
		super.ngOnInit();

		this.pieceUpdateSubscription = this.pieceService.update$.subscribe((
			updatedPiece: Piece
		) => {
			if(updatedPiece === this.piece)
				this.categorySelector.select(updatedPiece.category);	// Highlight correct category in left-hand menu
		});
	}


	ngOnDestroy(): void {
		super.ngOnDestroy();

		this.pieceUpdateSubscription.unsubscribe();
	}


	private get pieceService(): PieceService {
		return this.modelService as PieceService;
	}


	goToPiece(piece: Piece): void {
		this.router.navigate([piece.routerLink]);
	}


	// Shown if we have a price and/or a date set
	private get shouldShowPropertiesBar(): boolean {
		return !!(this.piece && (
			this.piece.price || 
			this.piece.date || 
			this.userService.isStaff
		));
	}


	// Alias, for clarity
	get piece(): Piece {
		return this.instance as Piece;
	}


	// Spacer is the little dot between price and date fields. Hide it if either is invisible
	get shouldShowSpacer(): boolean {
		return !!(this.piece.price && this.piece.date)
			|| this.userService.isStaff;	// If staff, we'll see 'Add price' and 'Add date'
	}


	protected get categoryToHighlight(): Category {
		return this.piece.category;
	}


	onPieceNavigatorLoad(): void {
		this.pieceNavigatorLoaded = true;
		this.checkIfLoaded();
	}


	private checkIfLoaded(): void {
		if(this.pieceNavigatorLoaded && this.imageLoaded)
			this.onReady();
	}


	onImageLoad(): void {
		this.imageLoaded = true;
		this.checkIfLoaded();
	}

}