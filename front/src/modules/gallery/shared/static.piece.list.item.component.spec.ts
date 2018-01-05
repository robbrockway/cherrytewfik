import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { StaticPieceListItemComponent }
	from './static.piece.list.item.component';

import { Piece } from 'modules/main/models';
import { fullImageSize } from 'utils';

import {
	StaticOrderedListItemHostComponent,
	StaticOrderedListItemComponentTest,
} from 'modules/shared/static-ordered-list/static.ordered.list.item.component.test.base';

import {
	MockThumbnailDirective,
	MockStaticYearMonthFieldDirective,
	MockTruncatedTextDirective,
	mergeModuleMetadata,
	testPieceData,
	checkNumberIsAlmost,
} from 'testing';



@Component({
	template: `
		<static-piece-list-item
			[object]="object"
			[reorder$]="reorder$"
			[linkEnabled]="linkEnabled"
			(load)="onLoad()"
		>
			<span class="injectedContent">{{injectedText}}</span>
		</static-piece-list-item>
	`,
})
class HostComponent extends StaticOrderedListItemHostComponent<Piece> {

	ngOnInit(): void {
		this.object = testPieceData.instances[0].toModelInstance();
	}

}



class StaticPieceListItemComponentTest
		extends StaticOrderedListItemComponentTest<Piece> {

	private mockThumbnailComponent: any;


	constructor() {
		super(StaticPieceListItemComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			declarations: [
				MockThumbnailDirective,
				MockStaticYearMonthFieldDirective,
				MockTruncatedTextDirective,
			],

			imports: [
				RouterTestingModule,
			],
		};
		
		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();

		let piece: Piece;

		let dispatchMouseEvent: (type: string) => void;
		let getThumbnailNativeElement: () => HTMLElement;
		let checkDetailBoxIsHidden: () => void;


		beforeEach(() => {
			this.fixture.detectChanges();

			this.mockThumbnailComponent =
				this.getChildDirective(MockThumbnailDirective);

			piece = this.hostComponent.object;
		});


		it('should take injected content and inject, in turn, into '
				+ 'ThumbnailComponent', () => {
			this.checkChildTextContentIs(
				'thumbnail .injectedContent',
				this.hostComponent.injectedText
			);
		});


		it('should pass correct root directory to ThumbnailComponent',
				() => {
			expect(this.mockThumbnailComponent.rootDirectory)
				.toBe('images/pieces');
		});


		it('should pass correct width list to ThumbnailComponent', () => {
			expect(this.mockThumbnailComponent.widthList)
				.toEqual([180, 360, 720, fullImageSize]);
		});


		it('should pass correct filename to ThumbnailComponent', () => {
			expect(this.mockThumbnailComponent.filename)
				.toBe(piece.image);
		});


		it(`should pass piece's name to ThumbnailComponent as alt text`,
				() => {
			expect(this.mockThumbnailComponent.alt)
				.toBe(piece.name);
		});


		describe(`'s detail box`, () => {

			let clearProperties: () => void;
			let clearDate: () => void;


			it(`should include piece's name as heading`, () => {
				this.checkChildTextContentIs(
					'.detail .name',
					piece.name
				);
			});


			it(`should pass piece's description to TruncatedTextComponent`,
					() => {
				
				const expectedParams = {
					text: piece.description,
					maxLength: 90,
				};

				this.expectChildDirective(MockTruncatedTextDirective)
					.toEqual(jasmine.objectContaining(expectedParams));
			});


			it(`should include piece's price`, () => {
				const priceText = '£' + piece.renderedPrice;

				this.checkChildTextContentIs(
					'.detail .price',
					priceText
				);
			});


			it(`shouldn't include price if null`, () => {
				piece.price = null;
				this.fixture.detectChanges();

				this.expectChildNativeElement('.detail .price')
					.toBeFalsy();
			});


			it(`shouldn't exist if none of its properties are set`,
					() => {
				clearProperties();
				this.fixture.detectChanges();
				
				this.expectChildNativeElement('.detail').toBeFalsy();
			});


			it('should exist if only one property is set', () => {
				clearProperties();
				piece.price = 1;
				this.fixture.detectChanges();

				this.expectChildNativeElement('.detail').toBeTruthy();
			});


			clearProperties = () => {
				piece.name = piece.description = '';
				piece.date = piece.price = null;
			};


			it(`should pass piece's date to StaticYearMonthFieldComponent`,
					() => {

				const expectedParams = {
					object: piece,
					propertyName: 'date',
				};

				this.expectChildDirective(MockStaticYearMonthFieldDirective)
					.toEqual(jasmine.objectContaining(expectedParams));
			});


			describe(', if no date,', () => {

				beforeEach(() => {
					piece.date = null;
					this.fixture.detectChanges();
				});


				it(`shouldn't include .date element`, () => {
					this.expectChildNativeElement('.date').toBeFalsy();
				});


				it(`shouldn't use StaticYearMonthFieldComponent if no date`,
						() => {
					this.expectChildDirective(MockStaticYearMonthFieldDirective)
						.toBeFalsy();
				});

			});

		});


		describe(', on mouseover,', () => {

			let checkDetailBoxIsVisible: () => void;


			it('should show detail box', fakeAsync(() => {
				dispatchMouseEvent('mouseover');
				checkDetailBoxIsVisible();
			}));


			checkDetailBoxIsVisible = () =>
				this.expectChildNativeElement('.detail.visible')
					.toBeTruthy();


			describe('should position detail box', () => {

				let getThumbnailRect: () => ClientRect;
				
				let getDetailRectWithViewportSize: (
					width: number,
					height: number
				) => ClientRect;

				let getDetailRect: () => ClientRect;

				let thumbnailRect: ClientRect;
				let detailRect: ClientRect;


				beforeEach(() => {
					scrollTo(0, 0);
					thumbnailRect = getThumbnailRect();
					// Don't fetch detailRect yet, as its position will depend on window size
				});


				getThumbnailRect = () =>
					this.getChildBoundingRectByCss('.pieceListItem');


				describe('(when enough space is given)', () => {

					beforeEach(fakeAsync(() => {
						detailRect = getDetailRectWithViewportSize(
							thumbnailRect.right + 300,
							thumbnailRect.bottom + 300
						);
					}));


					it(`50px to the right of thumbnail's left`, () => {
						expect(detailRect.left)
							.toBe(thumbnailRect.left + 50);
					});


					it(`with top 25px above thumbnail's bottom`, () => {
						expect(detailRect.top)
							.toBe(thumbnailRect.bottom - 25);
					});

				});


				getDetailRectWithViewportSize = (
					width: number,
					height: number
				) => {
					innerWidth = width;
					innerHeight = height;
					dispatchMouseEvent('mouseover');
					return getDetailRect();
				};


				getDetailRect = () =>
					this.getChildBoundingRectByCss('.detail');


				describe('(when space is limited)', () => {

					beforeEach(fakeAsync(() => {
						// Stop just short of allowing thumbnail onto screen
						detailRect = getDetailRectWithViewportSize(
							thumbnailRect.left,
							thumbnailRect.top
						);
					}));


					it('25px from right of viewport', () => {
						checkNumberIsAlmost(
							detailRect.right,
							innerWidth - 25
						);
					});


					it('10px from bottom of viewport', () => {
						checkNumberIsAlmost(
							detailRect.bottom,
							innerHeight - 10
						);
					});

				});

			});

		});


		dispatchMouseEvent = (type: string) => {
			const thumbnailElement = getThumbnailNativeElement();
			thumbnailElement.dispatchEvent(new MouseEvent(type));
			flushMicrotasks();
			this.fixture.detectChanges();
		};


		getThumbnailNativeElement = () =>
			this.getChildNativeElementByCss('thumbnail');


		describe(', on mouseout,', () => {

			it('should hide detail box', fakeAsync(() => {
				dispatchMouseEvent('mouseout');
				checkDetailBoxIsHidden();
			}));

		});


		checkDetailBoxIsHidden = () =>
			this.expectChildNativeElement('.detail.visible')
				.toBeFalsy();


		it('should hide detail box when .reorder$ emits', fakeAsync(() => {
			dispatchMouseEvent('mouseover');	// show

			this.hostComponent.reorder$.next();
			flushMicrotasks();
			this.fixture.detectChanges();

			checkDetailBoxIsHidden();
		}));

	}


	protected triggerLoadEvent(): void {
		this.mockThumbnailComponent.load.emit();
	}

}


new StaticPieceListItemComponentTest();
