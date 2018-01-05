import { ImagePreloader } from './image.preloader';



describe('ImagePreloader', () => {

	const realImgSrc = 'images/banner.svg';
	const fakeImgSrc = 'images/notarealimage.svg';
	const otherRealImgSrc = 'images/placeholders/dark.svg';
	
	let preloader: ImagePreloader;


	beforeEach(() => {
		preloader = new ImagePreloader();
	});


	describe('.loadImage()', () => {

		it('should emit load event once image has loaded', done => {
			const onSuccess = (event: Event) => {
				expect(event.type).toBe('load');
				done();
			};

			const onError = fail;
			
			preloader.loadImage(realImgSrc).subscribe(onSuccess, onError);
		});


		it('should complete stream once image has loaded', done => {
			const onComplete = done;
			preloader.loadImage(realImgSrc)
				.subscribe(null, null, onComplete);
		});


		it('should emit error event if image fails to load', done => {
			const onSuccess = fail;		// Shouldn't succeed!

			const onError = (event: Event) => {
				expect(event.type).toBe('error');
				done();
			};

			preloader.loadImage(fakeImgSrc).subscribe(onSuccess, onError);
		});

	});


	describe('.loadImages()', () => {

		it('should load all images, and then complete', done => {
			const loadEvents: Event[] = [];
			const errorEvents: Event[] = [];

			const onNext = (event: Event) => {
				const eventList = 
					event.type === 'error' ? errorEvents : loadEvents;

				eventList.push(event);
			};

			const onComplete = () => {
				expect(loadEvents.length).toBe(2);
				expect(errorEvents.length).toBeTruthy(1);
				done();
			};

			preloader.loadImages(realImgSrc, fakeImgSrc, otherRealImgSrc)
				.subscribe(onNext, null, onComplete);
		});

	});

});