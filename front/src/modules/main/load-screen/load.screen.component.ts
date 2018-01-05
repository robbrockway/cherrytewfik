// Simple animation of a pot filling up, with a background that obscures whatever is currently loading. Can be faded in and out.


import {
	Component,
	Input,
} from '@angular/core';

import {
	trigger,
	style,
	transition,
	animate,
} from '@angular/animations';



// Animation data (used to be procedurally generated, but that didn't wash with AOT compiler)

const fadeTimeCss = '1s';

const transitionCss = {
	fadeIn: fadeTimeCss + ' ease-in',
	fadeOut: fadeTimeCss + ' ease-out',
};

const invisibleCss = style({	// to fade out to, or in from
	opacity: 0,
	pointerEvents: 'none',
});

const transitions = {
	fadeIn: transition(
		':enter',
		[invisibleCss, animate(transitionCss.fadeIn)]
	),

	fadeOut: transition(
		':leave',
		[animate(transitionCss.fadeOut, invisibleCss)]
	),
};



@Component({
	selector: 'load-screen',
	templateUrl: './load.screen.component.html',
	styleUrls: ['./load.screen.component.scss'],

	animations: [
		trigger('fadeOut', [transitions.fadeOut]),
		trigger('fadeInOut', [transitions.fadeIn, transitions.fadeOut]),
	],
})
export class LoadScreenComponent {
	
	@Input() visible: boolean = false;
	@Input() animation: string = 'fadeInOut';

}
