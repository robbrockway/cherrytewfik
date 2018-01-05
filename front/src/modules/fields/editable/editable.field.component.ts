import {
	Component,
	Input,
	Output,
	EventEmitter,
	ChangeDetectorRef,
} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/finally';

import { SavingState } from './saving-message';
import { FieldComponentBase } from 'modules/fields/field.component.base';
import { Model } from 'modules/main/models';
import { arrayContains } from 'utils';



const errorMessageFadeTime = 10000;


enum State {
	Static,
	Editing,
	Saving,
	Deleting,
}


const defaultErrorMessage = 'Error.';


// Some field types should give an 'outside' placement to EditButtonsComponent
const outsideEditButtonsTypes = ['string', 'categoryLink'];

// and the rest give 'inside'


@Component({
	selector: 'editable-field',
	templateUrl: './editable.field.component.html',
	styleUrls: ['./editable.field.component.scss'],
})
export class EditableFieldComponent extends FieldComponentBase {

	// For template, which can't access global scope
	State = State;
	SavingState = SavingState;
	private errorFadeOutTimerSubscription: Subscription;

	@Output() startEdit = new EventEmitter();
	@Output() endEdit = new EventEmitter();

	private onSuccess: () => void;
	private onError: (error: any) => void;
	private onComplete: () => void;

	private errorMessage: string;

	private state = State.Static;


	constructor(private changeDetector: ChangeDetectorRef) {
		super();

		// Callback functions for save/delete, defined here to keep 'this' intact:

		this.onSuccess = (() => {
			this.state = State.Static;
		}).bind(this);

		this.onError = ((error: any) => {
			this.errorMessage = error as string || defaultErrorMessage;
			
			this.errorFadeOutTimerSubscription = 
				Observable.timer(errorMessageFadeTime).subscribe(
					() => this.giveUpAfterError()
				);
		}).bind(this);

		this.onComplete = (() => {
			this.onEndEdit();
		}).bind(this);

	}


	private giveUpAfterError(): void {
		this.state = State.Static;
		this.clearErrorMessage();
	}


	private clearErrorMessage(): void {
		this.errorFadeOutTimerSubscription.unsubscribe();
		this.errorMessage = '';
	}

	
	private onEndEdit(): void {
		this.endEdit.emit();
	}


	onEditButton(): void {
		this.state = State.Editing;
		this.startEdit.emit();
	}


	private onValueChange(newValue: any): void {
		this.save(newValue);
	}


	private save(
		newValue: any,
		intermediateState: State = State.Saving
	): void {
		this.state = intermediateState;
		this.changeDetector.detectChanges();

		this.object.update({
			[this.propertyName]: newValue,
		}).finally(
			this.onComplete
		).subscribe(
			this.onSuccess,
			this.onError
		);
	}


	onCancel(): void {
		this.onEndEdit();
		this.state = State.Static;
	}


	onDeleteButton(): void {
		// Nullify value
		this.save(null, State.Deleting);
	}


	// Either editing or deletion, again
	private tryAgainAfterError(): void {
		this.clearErrorMessage();

		if(this.state === State.Deleting)
			this.onDeleteButton();
		else 
			this.onEditButton();
	}


	// Passed to 'label' param on the StaticFieldComponent or EditComponent contained within this component
	get labelForSubcomponents(): string {
		return this.label || this.propertyName;
	}


	get shouldShowStaticField(): boolean {
		return this.state === State.Static && !this.errorMessage
			|| this.hasImageType;	// Static image field is kept as backdrop at all times
	}


	get hasImageType(): boolean {
		return this.type === 'image' || this.type === 'thumbnail';
	}


	get editButtonsPlacement(): 'inside' | 'outside' {
		return arrayContains(outsideEditButtonsTypes, this.type) ?
			'outside' : 'inside';
	}


	get shouldShowDeleteButton(): boolean {
		return !!this.value && this.type !== 'categoryLink';
	}


	// For template
	get isThumbnail(): boolean {
		return this.type === 'thumbnail';
	}

}

