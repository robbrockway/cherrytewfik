import { Subject } from 'rxjs/Subject';

import { GalleryModel } from '../gallery.model';
import { Model } from '../model';
import { PieceService } from '../piece/piece.service';

import {
	FieldDescriptor,
	StringFieldDescriptor,
	MultiObjectFieldDescriptor,
} from '../field-descriptors';

import { CategoryService } from './category.service';



export interface Category {
	id: number;
	name: string;
	description: string;
	pieces: any[];	// Can't import Piece class here, lest we get a circular dependency
}



const piecesFieldDescriptor = 
	new MultiObjectFieldDescriptor(PieceService, 'pieces');

// Reverse link; pieces[x].category refers back to this object
piecesFieldDescriptor.correspondingTSName = 'category';



export class Category extends GalleryModel {

	static fieldDescriptors: FieldDescriptor[] = [
		new FieldDescriptor('id'),
		new StringFieldDescriptor('name'),
		new StringFieldDescriptor('description'),
		piecesFieldDescriptor,
	];


	private imageRefreshSubject = new Subject<any>();
	imageRefresh$ = this.imageRefreshSubject.asObservable();


	constructor(
		categoryService: CategoryService,
		properties?: any,
		isStub?: boolean
	) {
		super(categoryService, properties, isStub);
	}


	// Called whenever this category's list of pieces, or their images, change; emits signal to the site's left-hand category menu to take stock of new images, or of newly absent ones
	refreshImages(): void {
		this.imageRefreshSubject.next();
	}


	// If a piece is added/removed from this category, images in category menu must be refreshed
	removeReferenceTo(linkedObject: Model, propertyName: string): void {
		super.removeReferenceTo(linkedObject, propertyName);

		if(propertyName === 'pieces')
			this.refreshImages();
	}


	addReferenceTo(linkedObject: Model, propertyName: string): void {
		super.addReferenceTo(linkedObject, propertyName);

		if(propertyName === 'pieces')
			this.refreshImages();
	}

}