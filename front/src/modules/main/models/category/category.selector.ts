// Service for passing messages re what category is currently being viewed to CategoryListComponent, so it can highlight the category in its list

import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { Category } from './category';



@Injectable()
export class CategorySelector {

	private selection$ = new BehaviorSubject<Category>(null);	// Start with no category selected


	subscribe(callback: (category: Category) => void): Subscription {
		return this.selection$.subscribe(callback);
	}


	select(category: Category): void {
		this.selection$.next(category);
	}

}