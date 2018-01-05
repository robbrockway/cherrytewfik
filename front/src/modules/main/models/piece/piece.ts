import { CategoryService } from '../category/category.service';
import { GalleryModel } from '../gallery.model';

import {
	FieldDescriptor,
	StringFieldDescriptor,
	PriceFieldDescriptor,
	SingleObjectFieldDescriptor,
	YearMonthFieldDescriptor,
} from '../field-descriptors';

import { PieceService } from './piece.service';
import { YearMonth } from 'modules/shared';
import { fullImageSize } from 'utils';



export interface Piece {
	id: number;
	name: string;
	price: number;
	date: YearMonth;
	description: string;
	image: string;
	category: any;	// Can't import Category class here, lest we get a circular dependency
}



const categoryFieldDescriptor =
	new SingleObjectFieldDescriptor(CategoryService, 'category');

// Reverse link; category.pieces[] includes this object
categoryFieldDescriptor.correspondingTSName = 'pieces';



export class Piece extends GalleryModel {
	
	static fieldDescriptors: FieldDescriptor[] = [
		new FieldDescriptor('id'),
		new StringFieldDescriptor('name'),
		new PriceFieldDescriptor('price'),
		new YearMonthFieldDescriptor('date'),
		new StringFieldDescriptor('description'),
		new FieldDescriptor('image'),
		categoryFieldDescriptor,
	];

	static imageParams = {
		widthList: [180, 360, 720, fullImageSize],
		rootDirectory: 'images/pieces',
	};


	constructor(
		pieceService: PieceService,
		properties?: any,
		isStub?: boolean
	) {
		super(pieceService, properties, isStub);
	}


	get renderedPrice(): string {
		return this.price.toFixed(2);
	}


	setProperties(properties: any): void {
		super.setProperties(properties);

		if(properties.image && this.category)	// Image has been updated
			this.category.refreshImages();
	}

}

