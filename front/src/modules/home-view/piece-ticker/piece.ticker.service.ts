// HomeView contains two image tickers, each of which ticks through the entire catalogue of pieces. This service makes sure they don't show the same piece at the same time.

import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { PieceTickerComponent } from './piece.ticker.component';
import { TickerImage } from 'modules/shared/image-ticker';



export type TickerImageLock = {
	image: TickerImage,
	heldBy: PieceTickerComponent,
};



@Injectable()
export class PieceTickerService {

	private locks: TickerImageLock[] = [];
	private locks$ = new BehaviorSubject(this.locks);


	// Streams the TickerImages that are unavailable to the given component, i.e. locked by other components
	getLockedImages(
		forComponent: PieceTickerComponent
	): Observable<TickerImage[]> {
		
		return this.locks$.map((currentLocks: TickerImageLock[]) => {
			const locksHeldByOtherComponents = currentLocks.filter(
				(lock: TickerImageLock) =>
					lock.heldBy !== forComponent
			);

			return locksHeldByOtherComponents.map(
				(lock: TickerImageLock) => lock.image
			);
		});
	}


	// Locking an image reserves it, alerting PieceTickerComponents not to use it until it is unlocked
	lockImage(
		image: TickerImage,
		forComponent: PieceTickerComponent
	): void {
		this.locks.push({image, heldBy: forComponent});
		this.emitStream();
	}


	private emitStream(): void {
		this.locks$.next(this.locks);
	}


	unlockImage(image: TickerImage): void {
		this.locks = this.locks.filter(
			(lock: TickerImageLock) =>
				lock.image.src !== image.src
		);

		this.emitStream();
	}

}