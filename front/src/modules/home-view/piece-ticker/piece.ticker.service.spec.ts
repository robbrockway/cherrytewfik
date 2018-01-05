import { async } from '@angular/core/testing';

import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/take';

import { PieceTickerService, TickerImageLock }
	from './piece.ticker.service';

import { PieceTickerComponent } from './piece.ticker.component';
import { TickerImage } from 'modules/shared/image-ticker';
import { testTickerImages } from 'testing';



describe('PieceTickerService', () => {

	let service: PieceTickerService;


	beforeEach(() => {
		service = new PieceTickerService();
	});


	describe('.getLockedImages()', () => {

		const mainTickerComponent = {} as PieceTickerComponent;
		const otherTickerComponent = {} as PieceTickerComponent;
		const mainImage = testTickerImages[0];

		let onNextEmission: (
			toComponent: PieceTickerComponent,
			func: (images: TickerImage[]) => void
		) => void;


		it('should emit set of locked images, on subscription', async(() => {
			// Locking image 'from' otherTickerComponent makes it unavailable to mainTickerComponent
			service.lockImage(mainImage, otherTickerComponent);
			
			service.getLockedImages(mainTickerComponent)
					.subscribe((images: TickerImage[]) => {
				expect(images).toEqual([mainImage]);
			});
		}));


		it(`should emit set of locked images, once one is locked`,
				async(() => {
			onNextEmission(mainTickerComponent, (images: TickerImage[]) => {
				expect(images).toEqual([mainImage]);
			});

			service.lockImage(mainImage, otherTickerComponent);
		}));


		// Different sets of images will be emitted, depending on which component has subscribed; images locked by component A will only be marked as locked to component B
		onNextEmission = (
			toComponent: PieceTickerComponent,
			func: (images: TickerImage[]) => void
		) => {
			// Skip the first emission, which occurs when subscribing
			service.getLockedImages(toComponent)
				.skip(1).take(1).subscribe(func);
		};


		it('should emit set of remaining locked images, once one is '
				+ 'unlocked', async(() => {

			for(let image of testTickerImages)
				service.lockImage(image, otherTickerComponent);

			onNextEmission(mainTickerComponent, (images: TickerImage[]) => {
				expect(images).not.toContain(mainImage);
			});

			service.unlockImage(mainImage);
		}));


		it(`shouldn't emit images that have been locked by same `
				+ 'component as has subscribed', async(() => {
			onNextEmission(mainTickerComponent, (images: TickerImage[]) => {
				expect(images.length).toBe(0);
			});

			service.lockImage(mainImage, mainTickerComponent);
		}));

	});

});