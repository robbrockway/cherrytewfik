import {
	Directive,
	Input,
	Output,
	EventEmitter,
} from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { PieceNavigatorButton } 
	from 'modules/gallery/piece-navigator/piece.navigator.button';

import { Form, FormField } from 'modules/main/form';
import { Model, GalleryModel, Piece, Category } from 'modules/main/models';
import { TickerImage } from 'modules/shared/image-ticker';
import { LoginForm } from 'modules/main/login';
import { SpinLabeller } from 'modules/fields/editable/edit';
import { SavingState } from 'modules/fields/editable/saving-message';



@Directive({
	selector: 'load-screen',
})
export class MockLoadScreenDirective {
	@Input() visible: boolean;
}



@Directive({
	selector: 'flyout',
})
export class MockFlyoutDirective {
	@Input() key: string;
	@Input() title: string;
	@Input() icon: string;
	@Input() open: boolean;
	@Output() openChange = new EventEmitter<boolean>();
	@Output() finishedClosing = new EventEmitter();
}



@Directive({
	selector: 'notification',
})
export class MockNotificationDirective {}



@Directive({
	selector: 'dialogue',
})
export class MockDialogueDirective {}



@Directive({
	selector: 'form-comp',
})
export class MockFormDirective {
	@Input() form: Form;
}



@Directive({
	selector: 'form-field',
})
export class MockFormFieldDirective {
	@Input() field: FormField;
	@Input() inputColSpan: number;
	@Output() enter = new EventEmitter();
}



@Directive({
	selector: 'ok-cancel',
})
export class MockOkCancelDirective {
	@Input() okLabel: string;
	@Input() cancelLabel: string;

	@Output() ok = new EventEmitter();
	@Output() cancel = new EventEmitter();
}



@Directive({
	selector: 'edit-buttons',
})
export class MockEditButtonsDirective {
	@Input() placement: 'inside' | 'outside';
	@Input() upVisible: boolean;
	@Input() downVisible: boolean;
	@Input() editVisible: boolean;
	@Input() deleteVisible: boolean;

	@Output() up = new EventEmitter();
	@Output() down = new EventEmitter();
	@Output() edit = new EventEmitter();
	@Output() delete = new EventEmitter();
}



export abstract class MockSlowLoadingDirective {
	@Output() load = new EventEmitter<any>();
}



@Directive({
	selector: 'field',
})
export class MockFieldDirective extends MockSlowLoadingDirective {
	@Input() object: any;
	@Input() propertyName: string;
	@Input() type: string;
	@Input() label: string;
	@Input() widthList: number[];
	@Input() rootDirectory: string;
	@Input() prefixText: string;
}



@Directive({
	selector: 'field-switch',
})
export class MockFieldSwitchDirective
	extends MockFieldDirective {}



@Directive({
	selector: 'static-field',
})
export class MockStaticFieldDirective
	extends MockFieldDirective {}



@Directive({
	selector: 'static-string-field',
})
export class MockStaticStringFieldDirective 
	extends MockFieldDirective {
	@Input() allowLinebreaks: boolean = false;
}



@Directive({
	selector: 'static-price-field',
})
export class MockStaticPriceFieldDirective 
	extends MockFieldDirective {}



@Directive({
	selector: 'static-year-month-field',
})
export class MockStaticYearMonthFieldDirective 
	extends MockFieldDirective {}



@Directive({
	selector: 'static-image-field',
})
export class MockStaticImageFieldDirective 
	extends MockFieldDirective {}



@Directive({
	selector: 'static-thumbnail-field',
})
export class MockStaticThumbnailFieldDirective 
	extends MockFieldDirective {}



@Directive({
	selector: 'static-category-link-field',
})
export class MockStaticCategoryLinkFieldDirective 
	extends MockFieldDirective {}



@Directive({
	selector: 'editable-field',
})
export class MockEditableFieldDirective 
	extends MockFieldDirective {
	@Output() startEdit = new EventEmitter();
	@Output() endEdit = new EventEmitter();
}



@Directive({
	selector: 'static-field-prompt',
})
export class MockStaticFieldPromptDirective
	extends MockFieldDirective {}


abstract class MockEditDirectiveBase {
	@Input() label: string;
	@Input() value: any;
	@Output() valueChange = new EventEmitter<any>();
	@Output() cancel = new EventEmitter();
}



@Directive({
	selector: 'edit',
})
export class MockEditDirective extends MockEditDirectiveBase {
	@Input() type: string;
}



@Directive({
	selector: 'string-edit',
})
export class MockStringEditDirective extends MockEditDirectiveBase {
	@Input() allowLinebreaks: boolean;
}



@Directive({
	selector: 'price-edit',
})
export class MockPriceEditDirective extends MockEditDirectiveBase {}



@Directive({
	selector: 'year-month-edit',
})
export class MockYearMonthEditDirective extends MockEditDirectiveBase {}



@Directive({
	selector: 'image-edit',
})
export class MockImageEditDirective extends MockEditDirectiveBase {}



@Directive({
	selector: 'category-link-edit',
})
export class MockCategoryLinkEditDirective extends MockEditDirectiveBase {}



export abstract class MockSavingMessageDirectiveBase {
	@Input() state: SavingState;
	@Input() previousValue: any;
}



@Directive({
	selector: 'saving-message',
})
export class MockSavingMessageDirective
		extends MockSavingMessageDirectiveBase {
	@Input() type: string;
}



@Directive({
	selector: 'plain-saving-message',
})
export class MockPlainSavingMessageDirective
		extends MockSavingMessageDirectiveBase {}



@Directive({
	selector: 'image-saving-message',
})
export class MockImageSavingMessageDirective
		extends MockSavingMessageDirectiveBase {}



export abstract class MockFieldErrorDirectiveBase {
	@Input() message: string;
	@Output() tryAgain = new EventEmitter();
}



@Directive({
	selector: 'field-error',
})
export class MockFieldErrorDirective
		extends MockFieldErrorDirectiveBase {
	@Input() type: string;
	@Output() giveUp = new EventEmitter();
}



@Directive({
	selector: 'plain-field-error',
})
export class MockPlainFieldErrorDirective
		extends MockFieldErrorDirectiveBase {}



@Directive({
	selector: 'image-field-error',
})
export class MockImageFieldErrorDirective
		extends MockFieldErrorDirectiveBase {}



@Directive({
	selector: 'thumbnail',
})
export class MockThumbnailDirective
		extends MockSlowLoadingDirective {
	@Input() rootDirectory: string;
	@Input() widthList: number[];
	@Input() filename: string;
	@Input() alt: string;
	@Output() mouseover = new EventEmitter<MouseEvent>();
	@Output() mouseout = new EventEmitter<MouseEvent>();
}



abstract class MockOrderedListDirective<T extends GalleryModel>
		extends MockSlowLoadingDirective {
	@Input() objects: T[];
	@Output() objectsChange = new EventEmitter<T[]>();
}



@Directive({
	selector: 'piece-list',
})
export class MockPieceListDirective
	extends MockOrderedListDirective<Piece> {
	@Input() category: Category;
}


@Directive({
	selector: 'static-piece-list',
})
export class MockStaticPieceListDirective
	extends MockOrderedListDirective<Piece> {}



@Directive({
	selector: 'editable-piece-list',
})
export class MockEditablePieceListDirective
	extends MockPieceListDirective {}



export abstract class MockOrderedListItemDirective<T extends GalleryModel>
		extends MockSlowLoadingDirective {
	@Input() object: T;
	@Input() reorder$: Observable<any>;
}



export abstract class
		MockStaticOrderedListItemDirective<T extends GalleryModel>
		extends MockOrderedListItemDirective<T> {
	@Input() linkEnabled = true;
}



@Directive({
	selector: 'static-piece-list-item',
})
export class MockStaticPieceListItemDirective
		extends MockStaticOrderedListItemDirective<Piece> {}



@Directive({
	selector: 'editable-piece-list-item',
})
export class MockEditablePieceListItemDirective
		extends MockOrderedListItemDirective<Piece> {}



@Directive({
	selector: 'category-list',
})
export class MockCategoryListDirective
	extends MockOrderedListDirective<Category> {}



@Directive({
	selector: 'static-category-list',
})
export class MockStaticCategoryListDirective
	extends MockOrderedListDirective<Category> {}



@Directive({
	selector: 'editable-category-list',
})
export class MockEditableCategoryListDirective
	extends MockOrderedListDirective<Category> {}



@Directive({
	selector: 'static-category-list-item',
})
export class MockStaticCategoryListItemDirective
		extends MockStaticOrderedListItemDirective<Category> {
	@Input() message: string;
}



@Directive({
	selector: 'editable-category-list-item',
})
export class MockEditableCategoryListItemDirective
		extends MockOrderedListItemDirective<Category> {}



@Directive({
	selector: 'truncated-text',
})
export class MockTruncatedTextDirective {
	@Input() text: string;
	@Input() maxLength: number;
}



@Directive({
	selector: 'image-ticker',
})
export class MockImageTickerDirective
		extends MockSlowLoadingDirective {
	@Input() imageList: TickerImage[];
	@Input() rootDirectory: string;
	@Input() widthList: number[];
	@Input() turnaroundTime: number;
	@Input() showLinks: boolean = false;
	@Output() show = new EventEmitter<TickerImage>();
	@Output() select = new EventEmitter<TickerImage>();
}



@Directive({
	selector: 'ticker-image',
})
export class MockTickerImageDirective
		extends MockSlowLoadingDirective {
	@Input() image: TickerImage;
	@Input() foreground: boolean;
	@Input() showLink: boolean;
	@Input() fadeTransition: string;
	@Input() animationDuration: number;
}



@Directive({
	selector: 'piece-ticker',
})
export class MockPieceTickerDirective
		extends MockSlowLoadingDirective {
	@Input() pieces: Piece[];
}



@Directive({
	selector: 'piece-navigator',
})
export class MockPieceNavigatorDirective
		extends MockSlowLoadingDirective {
	@Input() pieces: Piece[];
	@Input() currentPiece: Piece;
	@Output() currentPieceChange = new EventEmitter<Piece>();
}



@Directive({
	selector: 'piece-navigator-button',
})
export class MockPieceNavigatorButtonDirective
		extends MockSlowLoadingDirective {
	@Input() button: PieceNavigatorButton;
	@Output() click = new EventEmitter<Event>();
}



@Directive({
	selector: 'spacer',
})
export class MockSpacerDirective {}



@Directive({
	selector: 'login',
})
export class MockLoginDirective {}



@Directive({
	selector: 'login-form',
})
export class MockLoginFormDirective {
	@Input() form: LoginForm;
	@Output() submit = new EventEmitter();
}



@Directive({
	selector: 'login-form-field',
})
export class MockLoginFormFieldDirective {
	@Input() field: FormField;
	@Output() enter = new EventEmitter();
}



@Directive({
	selector: 'user-menu',
})
export class MockUserMenuDirective {
	@Output() logout = new EventEmitter();
	@Output() close = new EventEmitter();
}



@Directive({
	selector: 'spin',
})
export class MockSpinDirective {
	@Input() min: number;
	@Input() max: number;
	@Input() value: number;
	@Output() valueChange = new EventEmitter<number>();
	@Input() defaultValue: number;
	@Input() labeller: SpinLabeller;
	@Input() labelWhenNull: string;
}



// The following are genuine mock directives, rather than directives masquerading as components



@Directive({
	selector: '[contenteditableModel]',
})
export class MockContentEditableModelDirective {
	@Input('contenteditableModel') value: string;
	
	@Output('contenteditableModelChange')
	valueChange = new EventEmitter<string>();
}



@Directive({
	selector: 'input[fileSelect]',
})
export class MockFileSelectDirective {
	@Output() fileSelect = new EventEmitter<FileList>();
}



@Directive({
	selector: 'nav',
})
export class MockStickyNavBarDirective {
	@Output() classChange = new EventEmitter<string>();
}



@Directive({
	selector: '[scrollToTopOnNavigation]',
})
export class MockScrollToTopOnNavigationDirective {}
