// Item for the left-hand menu (top menu on mobile) which, when clicked, shows a box that 'flies out' of the menu bar, containing whatever content is inside the <flyout> tag.

import { 
	Component,
	Input,
	Output,
	EventEmitter,
	HostListener,
	ViewChild,
	ElementRef,
} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';

import { FlyoutService } from './flyout.service';
import { WindowService } from '../window.service';



@Component({
	selector: 'flyout',
	templateUrl: './flyout.component.html',
	styleUrls: ['./flyout.component.scss'],
})
export class FlyoutComponent {

	@Input() key: string;	// for referring to this flyout, in FlyoutService
	@Input() title: string;
	@Input() icon: string;	// src

	@Input() open: boolean;
	@Output() openChange = new EventEmitter<boolean>();

	@Output() finishedClosing = new EventEmitter();

	@ViewChild('box') boxElement: ElementRef;

	private focusSub: Subscription;


	constructor(
		private flyoutService: FlyoutService,
		private windowService: WindowService
	) {}


	ngAfterViewInit(): void {
		this.focusSub =
			this.flyoutService.focus$.subscribe(this.focusOnFlyout);
	}


	private focusOnFlyout = (flyoutKey: string) => {
		if(flyoutKey === this.key)
			this.focus();
		else	// focused on another flyout; get this one out of the way
			this.closeBox();
	};


	private focus(): void {
		this.openBox();
		this.windowService.scrollTo(this.boxElement);
	}


	private openBox(): void {
		this.openChange.emit(true);
	}


	ngOnDestroy(): void {
		this.focusSub.unsubscribe();
	}


	onHeadingClick(event: MouseEvent): void {
		event.stopPropagation();	// Prevent window:click (which would close the flyout) from firing
		this.toggleBox();
	}


	private toggleBox(): void {
		if(this.open)
			this.closeBox();
		else
			this.openBox();
	}


	onBoxClick(event: Event): void {
		event.stopPropagation();
	}


	@HostListener('window:keyup.escape')
	@HostListener('window:click')
	closeBox(): void {
		this.openChange.emit(false);
	}


	onFlownInOrOut(): void {
		if(!this.open)	// fly out
			this.finishedClosing.emit();
	}

}


