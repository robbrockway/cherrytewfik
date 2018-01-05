import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';

import { PieceView } from './piece.view';
import { GalleryViewTest } from './gallery.view.test.base';

import {
	Piece,
	PieceService,
	Category,
	UserService,
} from 'modules/main/models';

import {
	mergeModuleMetadata,
	MockSpacerDirective,
	MockPieceNavigatorDirective,
	MockFieldDirective,
	testPieceData,
	getChildDirective,
} from 'testing';



class PieceViewTest extends GalleryViewTest<Piece> {

	constructor() {
		super(
			PieceView,
			Piece,
			PieceService,
			testPieceData
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			declarations: [
				MockSpacerDirective,
				MockPieceNavigatorDirective
			],

			providers: [{
				provide: UserService,
				useFactory: this.createMockUserService,
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockUserService(): any {
		return {isStaff: false};
	}


	protected createMockModelService(): any {
		const service = super.createMockModelService();
		service.update$ = new Subject<Piece>();
		return service;
	}


	protected defineTests(): void {
		super.defineTests();

		let allPieces: Piece[];	// current piece, and siblings

		let getPropertiesBar: () => DebugElement;


		beforeEach(() => {
			allPieces = this.currentPiece.category.pieces;
		});


		describe('should show properties bar, if piece has', () => {

			it('price but no date', () => {
				this.currentPiece.date = null;
			});


			it('date but no price', () => {
				this.currentPiece.price = null;
			});


			it('neither price nor date, but user is staff', () => {
				this.currentPiece.date = this.currentPiece.price = null;

				const mockUserService = TestBed.get(UserService);
				mockUserService.isStaff = true;
			});


			afterEach(() => {
				this.fixture.detectChanges();
				expect(getPropertiesBar()).toBeTruthy();
			});

		});


		getPropertiesBar = () =>
			this.getChildDebugElementByCss('.properties');


		it('should hide properties bar, if piece has neither '
				+ 'price nor date', () => {

			this.currentPiece.price = this.currentPiece.date = null;
			this.fixture.detectChanges();
			expect(getPropertiesBar()).toBeFalsy();
		});


		describe(`'s PieceNavigatorComponent`, () => {

			let otherPiece: Piece;

			let switchToPiece: (piece: Piece) => void;


			beforeEach(() => {
				otherPiece = allPieces[1];	// for switching to
			});


			it('should receive list of pieces', () => {
				expect(this.mockPieceNavigatorComponent.pieces)
					.toBe(allPieces);
			});


			it('should receive current piece, in particular', () => {
				expect(this.mockPieceNavigatorComponent.currentPiece)
					.toBe(this.currentPiece);
			});


			it('should receive no list if piece has no category', () => {
				this.currentPiece.category = null;
				this.fixture.detectChanges();
				
				expect(this.mockPieceNavigatorComponent.pieces).toBeFalsy();
			});


			it('should navigate to new piece using router', 
					fakeAsync(() => {
				
				const router = TestBed.get(Router);
				spyOn(router, 'navigate');

				switchToPiece(otherPiece);
				
				expect(router.navigate).toHaveBeenCalledWith(
					[otherPiece.routerLink]
				);
			}));


			switchToPiece = (piece: Piece) => {
				this.mockPieceNavigatorComponent.currentPieceChange
					.emit(piece);

				flushMicrotasks();
				this.fixture.detectChanges();
			};

		});


		describe(`'s .image div`, () => {

			it(`shouldn't have .empty class if there is an image`, 
					() => {
				this.expectChildNativeElement('.image.empty')
					.toBeFalsy();

				this.expectChildNativeElement('.image:not(.empty)')
					.toBeTruthy();
			});


			it('should have .empty class if there is no image', () => {
				this.currentPiece.image = null;
				this.fixture.detectChanges();

				this.expectChildNativeElement('.image.empty')
					.toBeTruthy();

				this.expectChildNativeElement('.image:not(.empty)')
					.toBeFalsy();
			});

		});


		describe(', when piece is emitted by PieceService.update$, ', () => {

			beforeEach(() => {
				this.mockCategorySelector.select.calls.reset();
			});


			it(`should select piece's category using CategorySelector, `
					+ 'if piece is currently being displayed', async(() => {
			
				this.mockModelService.update$.next(this.currentPiece);

				expect(this.mockCategorySelector.select)
					.toHaveBeenCalledWith(this.currentPiece.category);
			}));


			it('should ignore, if piece is not currently being displayed',
					async(() => {
			
				const otherPiece = allPieces[1];
				this.mockModelService.update$.next(otherPiece);

				expect(this.mockCategorySelector.select)
					.not.toHaveBeenCalled();
			}));

		});

	}


	private get mockPieceNavigatorComponent(): MockPieceNavigatorDirective {
		return this.getChildDirective(MockPieceNavigatorDirective);
	}


	// Should select the current piece's parent category to be highlighted on nav bar
	protected get expectedCategoryToHighlight(): Category {
		return this.currentPiece.category;
	}


	// Alias, to aid clarity
	private get currentPiece(): Piece {
		return this.currentInstance;
	}


	private set currentPiece(piece: Piece) {
		this.currentInstance = piece;
	}


	protected triggerLoadScreenHide(): void {
		// Should hide load screen once navigator thumbnail field has loaded
		const subcomponents = [
			this.mockPieceNavigatorComponent,
			this.mockThumbnailFieldComponent,
		];
		
		for(let subcomponent of subcomponents)
			subcomponent.load.emit();
	}


	private get mockThumbnailFieldComponent(): MockFieldDirective {
		const imageDiv = this.getChildDebugElementByCss('.image');
		return getChildDirective(imageDiv, MockFieldDirective);
	}

}


new PieceViewTest();