// Loads an image file, and emits its load event or error through an Observable when it's done

import { Injectable } from '@angular/core';

import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/catch';



@Injectable()
export class ImagePreloader {

	// Emits each load/error event as it occurs, and completes when all have loaded or failed
	loadImages(...srcList: string[]): Observable<Event> {
		// Convert errors into regular values, to avoid disrupting the sequence
		const passErrorBy = (error: any) => {
			return Observable.of(error);
		};
		
		const streams = srcList.map(
			(src: string) =>
				this.loadImage(src).catch(passErrorBy)
		);

		return Observable.merge(...streams);
	}


	loadImage(src: string): Observable<Event> {
		const img = new Image();

		const img$ = Observable.create((observer: Observer<Event>) => {
			const onLoad = (event: Event) => {
				observer.next(event);
				observer.complete();
			};

			const onError = (event: Event) => {
				observer.error(event);
			};

			img.addEventListener('load', onLoad);
			img.addEventListener('error', onError);
		});

		img.src = src;
		return img$;
	}

}
