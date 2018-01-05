import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/mergeMap';

import { Form } from '../form';



export type Dialogue = {
	heading?: string,
	message?: string,
	form?: Form,
	buttonLabels: {
		ok?: string,
		cancel?: string,
	},
};



// Takes requests for dialogue boxes (type Dialogue, above), passes them to a given handler function which shows the dialogue (in practice, this is part of AppComponent), and calls a given 'onOk' or 'onCancel' function in response.
@Injectable()
export class DialogueService {

	private dialogue$ = new Subject<Dialogue>();
	private response$: Observable<any> = Observable.empty();

	
	// The handler's returned Observable should emit null if ok/yes is pressed, and throw an error if cancel/no is pressed
	registerHandler(
		onShow: (dialogue: Dialogue) => Observable<any>
	): void {
		this.response$ = this.dialogue$.mergeMap(onShow);
	}


	show(
		dialogue: Dialogue,
		onOk?: () => void,
		onCancel?: () => void
	): void {

		let sub: Subscription;

		const onSuccess = () => {
			if(onOk) onOk(); 
		};

		const onError = (error: any) => {
			if(onCancel) onCancel();
		};

		const cleanUp = () => {
			if(sub) sub.unsubscribe();
		};

		sub = this.response$.subscribe(
			onSuccess,
			onError,
			cleanUp
		);

		this.dialogue$.next(dialogue);

	}

}

