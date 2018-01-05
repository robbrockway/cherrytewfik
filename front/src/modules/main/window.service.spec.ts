import { ElementRef } from '@angular/core';
import { async } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/skip';

import { WindowService, WindowState } from './window.service';

import {
	setMockGetterReturnValue,
	checkEmittedValueEquals,
} from 'testing';



describe('WindowService', () => {

	const scrollPos = 30, height = 400;

	let service: WindowService;
	let checkEmittedStateIs: (state: WindowState) => void;
	let checkEmittedStateWillBe: (state: WindowState) => void;
	let setScroll: (y: number) => void;
	let setHeight: (height: number) => void;


	beforeEach(() => {
		service = new WindowService();
	});


	it('.scrollTo() should call .scrollIntoView() on native element',
			() => {
		const mockElementRef = {
			nativeElement: {
				scrollIntoView: jasmine.createSpy('scrollIntoView'),
			},
		} as ElementRef;

		service.scrollTo(mockElementRef);

		expect(mockElementRef.nativeElement.scrollIntoView)
			.toHaveBeenCalled();
	});


	it('should emit current window state, on subscription', 
			async(() => {

		checkEmittedStateIs({
			scrollPos: document.documentElement.scrollTop,
			height: window.innerHeight,
		});
	}));


	checkEmittedStateIs = (expectedState: WindowState) => {
		checkEmittedValueEquals(expectedState, service.stream);
	};
	

	it('should emit new scroll position, when it changes', async(() => {
		const defaultHeight = window.innerHeight;
		checkEmittedStateWillBe({scrollPos, height: defaultHeight});
		setScroll(scrollPos);
	}));


	checkEmittedStateWillBe = (state: WindowState) => {
		const streamToUse = service.stream.skip(1);	// Leave out value that's emitted immediately on subscription
		checkEmittedValueEquals(state, streamToUse);
	};


	setScroll = (y: number) => {
		setMockGetterReturnValue(service, 'scrollPos', y);
		window.dispatchEvent(new Event('scroll'));
	};


	it('should emit new window height, when it changes',
			async(() => {
		const defaultScrollPos = document.documentElement.scrollTop;
		checkEmittedStateWillBe({scrollPos: defaultScrollPos, height});
		setHeight(height);
	}));


	setHeight = (height: number) => {
		setMockGetterReturnValue(service, 'windowHeight', height);
		window.dispatchEvent(new Event('resize'));
	};


	it('should emit current state when .emitState() is called', done => {
		service.stream.skip(1).subscribe(done);
		service.emitState();
	});

});