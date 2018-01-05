import { Component,	Input } from '@angular/core';

import { TickerImage } from 'modules/shared/image-ticker';

import { StaticOrderedListItemComponent }
	from './static.ordered.list.item.component';

import { Subscription } from 'rxjs/Subscription';

import { Category, Piece } from 'modules/main/models';

import { CategorySelector }
	from 'modules/main/models/category/category.selector';

import { randomBetween } from 'utils';



const defaultHeading = 'Untitled category';



@Component({
	selector: 'static-category-list-item',
	templateUrl: './static.category.list.item.component.html',
	styleUrls: ['./static.category.list.item.component.scss'],
})
export class StaticCategoryListItemComponent
		extends StaticOrderedListItemComponent<Category> {

	// How often should the image ticker refresh? Times are randomised and saved on initialisation of component, so that each list item moves at vaguely the same speed but they don't change at the same time
	static minImageTurnaroundTime = 20000;
	static maxImageTurnaroundTime = 40000;

	@Input() message: string;	// Custom message, which will display in place of category name

	category: Category;
	imageList: TickerImage[];
	turnaroundTime: number;
	highlighted = false;

	imageParams = Piece.imageParams;	// Root directory, sizes, etc

	private animationTime: number;
	private subscriptions: Subscription[] = [];


	constructor(private categorySelector: CategorySelector) {
		super();
		this.randomiseTiming();
	}


	ngOnInit(): void {
		const selectorSubscription = this.categorySelector.subscribe(
			(category: Category) => this.selectCategory(category)
		);

		const imageSubscription = this.category.imageRefresh$.subscribe(
			() => this.updateImageList()
		);

		this.subscriptions.push(selectorSubscription);
	}


	// If the selected category is this one, we highlight; else, not
	private selectCategory(category: Category): void {
		this.highlighted =
			category === this.category;
	}


	get object(): Category {
		return this.category;
	}


	@Input() set object(category: Category) {
		this.category = category;
		this.updateImageList();
	}


	private updateImageList(): void {
		const createTickerImage = (piece: Piece) => {
			return {filename: piece.image};
		};

		this.imageList =
			this.piecesWithImages.map(createTickerImage);
	}


	private get piecesWithImages(): Piece[] {
		return this.category.pieces.filter(
			(piece: Piece) => piece.image
		);
	}


	ngOnDestroy(): void {
		for(let sub of this.subscriptions)
			sub.unsubscribe();
	}


	onTickerLoad(): void {
		this.load.emit();
	}


	private randomiseTiming(): void {
		this.turnaroundTime = randomBetween(
			StaticCategoryListItemComponent.minImageTurnaroundTime,
			StaticCategoryListItemComponent.maxImageTurnaroundTime
		);
	}


	get heading(): string {
		return this.message || this.category.name || defaultHeading;
	}


	get headingShouldBeFaint(): boolean {
		return !!this.message || !this.category.name;
	}

}