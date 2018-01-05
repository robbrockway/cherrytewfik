// Base class for CategoryListComponent and PieceListComponent; handles reordering of objects via its moveUp() and moveDown() methods. Once reordering is done, a request is sent to the relevant service (provided by subclass), after which the list of objects is updated.

import { SimpleChanges } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/finally';

import { StaticOrderedListComponent }
	from 'modules/shared/static-ordered-list';

import {
	GalleryModel,
	ReorderableModelService,
	UserService,
} from 'modules/main/models';

import { NotificationService } from 'modules/main/notification';
import { arrayWithItemRemoved } from 'utils';



const reorderDebounceTime = 5000;



export abstract class EditableOrderedListComponent<T extends GalleryModel>
		extends StaticOrderedListComponent<T> {

	protected reorder$ = new Subject();

	// Same set of objects as our main .objects[], but these ones are rearranged immediately as up/down buttons are clicked, rather than waiting for the new order be saved on server
	objectsInPresentedOrder: T[] = [];

	addingNewObject = false; // Busy working?
	addingErrorMessage: string;


	constructor(
		private modelService: ReorderableModelService<T>,
		private notificationService: NotificationService,
		protected userService: UserService
	) {
		super();

		this.reorder$.debounceTime(reorderDebounceTime)
				.subscribe(() =>
			this.sendReorderRequest()
		);

	}


	ngOnInit(): void {
		this.showObjectsInActualOrder();
	}


	ngOnChanges(changes: SimpleChanges): void {
		super.ngOnChanges(changes);

		if(changes.objects)
			this.showObjectsInActualOrder();
	}


	protected showObjectsInActualOrder(): void {
		this.objectsInPresentedOrder =
			this.objects ? Array.from(this.objects) : [];
	}


	protected sendReorderRequest(): void {

		const onSuccess = (
			objectsInNewOrder: T[]
		) => {
			this.objectsChange.emit(
				objectsInNewOrder
			);

			this.showSuccessMessage();
		};


		const onError = (errorMessage: string) => {
			this.showObjectsInActualOrder();
			this.showReorderError(errorMessage);
		};


		this.modelService.reorder(
			this.objectsInPresentedOrder
		).subscribe(onSuccess, onError);

	}


	protected showSuccessMessage(): void {
		this.notificationService.show(
			'New sequence has been saved.'
		);
	}


	protected showReorderError(errorMessage: string): void {
		this.notificationService.show(
			'Error saving new sequence: ' + errorMessage
		);
	}


	moveUp(object: T): void {
		const currentIndex =
			this.objectsInPresentedOrder.indexOf(object);

		if(currentIndex <= 0)
			return;

		this.switchObjectIndices(currentIndex - 1, currentIndex);
	}


	protected switchObjectIndices(indexA: number, indexB: number): void {
		const objectA = this.objectsInPresentedOrder[indexA];

		this.objectsInPresentedOrder[indexA] = 
			this.objectsInPresentedOrder[indexB];

		this.objectsInPresentedOrder[indexB] = objectA;

		this.tryReorder();
	}


	protected tryReorder(): void {
		// May get through, or may be blocked by debouncer
		this.reorder$.next();
	}


	moveDown(object: T): void {
		const currentIndex =
			this.objectsInPresentedOrder.indexOf(object);

		if(currentIndex >= this.objects.length - 1)
			return;

		this.switchObjectIndices(currentIndex, currentIndex + 1);
	}


	delete(object: T): void {
		const onSuccess = () => {
			this.removeFromList(object);
		};

		const onError = (errorMessage: string) => 
			this.showDeletionError(errorMessage);

		object.delete().subscribe(onSuccess, onError);
	}


	protected showDeletionError(errorMessage: string): void {
		this.notificationService.show(
			`Error deleting ${this.lowerCaseModelName}: `
			+ errorMessage
		);
	}


	private get lowerCaseModelName(): string {
		return this.modelService.modelType.name.toLowerCase();
	}


	protected removeFromList(object: T): void {
		const newList = arrayWithItemRemoved(this.objects, object);
		this.objectsChange.emit(newList);

		this.removeFromPresentedList(object);
	}


	protected removeFromPresentedList(object: T): void {
		const index = this.objectsInPresentedOrder.indexOf(object);
		this.objectsInPresentedOrder.splice(index, 1);
	}


	addNew(): void {
		this.addingNewObject = true;
		this.addingErrorMessage = null;

		this.modelService.create(
			this.defaultPropertiesForNewObject
		).catch((errorMessage: string) => 
			this.addingErrorMessage = errorMessage
		).finally(() => 
			this.addingNewObject = false
		).subscribe((newObject: T) =>
			this.objectsInPresentedOrder.push(newObject)
		);
	}


	// Override for something more elaborate
	protected get defaultPropertiesForNewObject(): any {
		return {};
	}

}