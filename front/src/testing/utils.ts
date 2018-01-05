import { Component, DebugElement, Type } from '@angular/core';

import {
	Response,
	ResponseOptions,
	ResponseOptionsArgs,
} from '@angular/http';

import {
	TestBed,
	ComponentFixture,
	TestModuleMetadata,
	async,
	flushMicrotasks,
} from '@angular/core/testing';

import { By } from '@angular/platform-browser';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { Model, ModelService } from 'modules/main/models';

import {
	flatten2DArray,
	getFirstItemWhere,
	removeFromArray,
	mergeSetAIntoSetB,
} from 'utils';



type Root = ComponentFixture<any> | DebugElement;



// The following few functions take 'root' as their first argument; they then perform various searches and checks inside of the root node.


export function checkChildTextContentIs(
	root: Root,
	cssSelector: string,
	expectedContent: string
): void {

	checkChildContentIs(
		root,
		cssSelector,
		'textContent',
		expectedContent
	);
}


export function checkChildHtmlContentIs(
	root: Root,
	cssSelector: string,
	expectedContent: string
): void {

	checkChildContentIs(
		root,
		cssSelector,
		'innerHTML',
		expectedContent
	);
}


// Backend for checkChild[Text/Html]ContentIs()
function checkChildContentIs(
	root: Root,
	cssSelector: string,
	nativeElementPropertyName: 'innerHTML' | 'textContent',
	expectedContent: string
): void {

	const nativeElement = getChildNativeElementByCss(
		root,
		cssSelector
	);

	let actualContent = nativeElement[nativeElementPropertyName];
	actualContent = actualContent.trim();
	expectedContent = expectedContent.trim();

	expect(actualContent).toBe(expectedContent);
}


export function getChildBoundingRectByCss(
	root: Root,
	cssSelector: string
): ClientRect {

	const element = getChildNativeElementByCss(root, cssSelector);
	if(!element) return null;
	return element.getBoundingClientRect();
}



export function getChildNativeElementByCss(
	root: Root,
	cssSelector: string
): HTMLElement {

	const debugElement = getChildDebugElementByCss(root, cssSelector);
	if(!debugElement) return null;
	return debugElement.nativeElement;
}


export function getChildDebugElementByCss(
	root: Root,
	cssSelector: string
): DebugElement {

	if(root instanceof ComponentFixture)
		root = root.debugElement;

	return root.query(By.css(cssSelector));
}



export function getAllChildNativeElementsByCss(
	root: Root,
	cssSelector: string
): HTMLElement[] {

	return getAllChildDebugElementsByCss(root, cssSelector)
		.map((debugElement: DebugElement) => debugElement.nativeElement);
}



export function getAllChildDebugElementsByCss(
	root: Root,
	cssSelector: string
): DebugElement[] {

	if(root instanceof ComponentFixture)
		root = root.debugElement;

	return root.queryAll(By.css(cssSelector));
}



export function getChildComponentByCss(
	root: Root,
	cssSelector: string
): any {

	const debugElement = getChildDebugElementByCss(
		root,
		cssSelector
	);

	return debugElement.componentInstance;
}


export function getChildDirective(
	root: Root,
	directiveType: Type<any>
): any {

	const directiveElement =
		getChildDirectiveDebugElement(root, directiveType);

	if(!directiveElement) return null;

	return directiveElement.injector.get(directiveType);
}


export function getChildDirectiveDebugElement(
	root: Root,
	directiveType: Type<any>
): DebugElement {

	if(!root)
		return null;

	if(root instanceof ComponentFixture)
		root = root.debugElement;

	return root.query(By.directive(directiveType));
}


export function getAllChildDirectivesOfType(
	root: Root,
	directiveType: Type<any>
): any[] {

	if(!root)
		return null;

	if(root instanceof ComponentFixture)
		root = root.debugElement;

	const debugElements = root.queryAll(
		By.directive(directiveType)
	);

	return debugElements.map(
		(debugElement: DebugElement) => 
			debugElement.injector.get(directiveType)
	);
}


// Convenience function; wraps jasmine's expect()
export function expectChildDirective(
	root: Root,
	directiveType: Type<any>
): any {
	const childDirective = getChildDirective(
		root,
		directiveType
	);

	return expect(childDirective);
}



export function expectChildNativeElement(
	root: Root,
	cssSelector: string
): any {
	const childNativeElement = getChildNativeElementByCss(
		root,
		cssSelector
	);

	return expect(childNativeElement);
}


// Convenience for setting multiple values, as below. Takes a dictionary of {[name]: value} pairs.
export function setChildInputValues(
	root: Root,
	dict: any
): void {

	for(let inputName of Object.keys(dict)) {
		const selector = `[ng-reflect-name="${inputName}"]`;
		const value = dict[inputName];
		setChildInputValue(root, selector, value);
	}
}


// Finds an <input> element, and assigns value
export function setChildInputValue(
	root: Root,
	cssSelector: string,
	value: any
): void {
	const input = getChildNativeElementByCss(
		root,
		cssSelector
	) as HTMLInputElement;

	input.value = value;
	input.dispatchEvent(new Event('input'));
	flushMicrotasks();
}


export function getCellFromTableRowByIndex(
	row: DebugElement,
	index: number
): HTMLTableCellElement {

	const cells = row.queryAll(By.css('td'));
	const cellDebugElement = cells[index];
	return cellDebugElement.nativeElement;
}


export function spyOnIfNotAlready(object: any, methodName: string): any {
	if(isSpy(object[methodName]))
		return object[methodName];

	return spyOn(object, methodName);
}


export function isSpy(func: any): boolean {
	return !!(
		func.and && func.calls
	);
}


export function forNextTenCallsToSpy(
	spy: any,
	fakeFunc: (...args: any[]) => void,
	doneFunc: () => void,
	skipFirstNCalls = 0
): void {

	let cycleNum = 0;
	const numTestCycles = 10;

	spy.and.callFake((...args: any[]) => {
		if(cycleNum >= skipFirstNCalls)
			fakeFunc(...args);

		cycleNum++;
		if(cycleNum >= numTestCycles)
			doneFunc();
	});

}


// A bit like spyOn(...).and.returnValue(...), but for getters
export function setMockGetterReturnValue(
	object: any,
	propertyName: string,
	returnValue: any
): void {
	const mockGetter = () => returnValue;

	Object.defineProperty(
		object,
		propertyName,
		{get: mockGetter}
	);
}


// JSON response, as readable by ModelService classes
export function createErrorResponse(
	message: string,
	httpStatusCode: number = 500
): Response {
	const body = JSON.stringify({detail: message});
	return createResponse({body, status: httpStatusCode});
}


export function createResponse(args: any): Response {
	const options = new ResponseOptions(args);
	return new Response(options);
}


// A 'linked object' is one referred to by the initial object, e.g. Piece.category, or User.basket, or a member of the Category.pieces[] list.
export function getLinkedObjectsFromModelInstance(
	instance: Model,
	linkDepth = 3
): Set<Model> {

	if(!linkDepth) {
		const emptySet = new Set<Model>([]);
		return emptySet;
	}

	const linkedObjects =
		getDirectlyLinkedObjectsFromModelInstance(instance);


	linkedObjects.forEach((linkedObject: Model) => {
		const furtherLinkedObjects = getLinkedObjectsFromModelInstance(
			linkedObject,
			linkDepth - 1
		);

		mergeSetAIntoSetB(furtherLinkedObjects, linkedObjects);
	});


	return linkedObjects;
}


export function getDirectlyLinkedObjectsFromModelInstance(
	instance: Model
): Set<Model> {
	
	let valuesList = getValuesListFromModelInstance(instance);

	// Iron out any lists of values
	valuesList = flatten2DArray(valuesList);

	const linkedObjectsList =
		valuesList.filter((value: any) => value instanceof Model);

	return new Set(linkedObjectsList);
}


export function getValuesListFromModelInstance(
	instance: Model
): any[] {
	const dict = instance.toDict();
	const keys = Object.keys(dict);

	return keys.map((key: string) => instance[key]);
}


export function getModelInstancesFromDict(dict: any): Model[] {
	const propertyNames = Object.keys(dict);

	const propertyValues =
		propertyNames.map((name: string) => dict[name]);

	return propertyValues.filter(
		(value: any) => value instanceof Model
	);
}


// mainInstance must include and agree with with all of otherInstance's properties, but not necessarily vice versa (mainInstance might have extra ones).
export function checkModelInstanceHasPropertiesOfOther<T extends Model>(
	mainInstance: T,
	otherInstance: T
): void {
	const requiredProperties = otherInstance.toDict();

	expect(mainInstance).toEqual(
		jasmine.objectContaining(requiredProperties)
	);
}


export function getConstructorOf<T>(object: T): Type<T> {
	const prototype = Object.getPrototypeOf(object);
	return prototype.constructor;
}


export function getFirstPropertyName(object: any): string {
	const keys = Object.keys(object);
	return keys[0];
}


export function filterObjectByPropertyValues(
	object: any,
	predicate: (value: any) => boolean
): any {
	const keys = Object.keys(object);

	return keys.reduce((accumulator: any, key: string) => {
		const value = object[key];

		if(predicate(value))
			accumulator[key] = value;

		return accumulator;
	}, {});
}


export function checkObjectHasProperty(
	object: any,
	propertyValue: any
): void {
	const keys = Object.keys(object);
	const values = keys.map((key: string) => object[key]);
	expect(values).toContain(propertyValue);
}


export function copy(object: any): any {
	return Object.assign({}, object);
}


export function stripLeadingSlash(string: string): string {
	if(string.slice(0, 1) === '/')
		return string.slice(1);

	return string;
}


// Quick and usually-reliable way of comparing two model instances
export function checkPKsAreEqual(objectA: Model, objectB: Model): void {
	expect(objectA.pk).toBe(objectB.pk);
}


// Same as above, for lists of instances rather than single ones
export function checkArrayPKsAreEqual(arrayA: Model[], arrayB: Model[]): void {
	expect(arrayA.length).toBe(arrayB.length);

	forEachPair(
		arrayA,
		arrayB,
		checkPKsAreEqual
	);
}


export function getSortedCopy<T>(
	array: T[],
	compareFunc?: (a: T, b: T) => number
): T[] {

	const copy = Array.from(array);
	copy.sort(compareFunc);
	return copy;
}


export function isInArray<T>(array: T[], item: T): boolean {
	return array.indexOf(item) !== -1;
}


export function removeFromArrayWhere<T>(
	array: T[],
	predicate: (item: T) => boolean
): void {
	for(let item of array) {
		if(predicate(item))
			removeFromArray(array, item);
	}
}


export function getMostRecentCallArg(
	spyFunc: any,
	argIndex: number = 0
): any {
	const call = spyFunc.calls.mostRecent();
	return call.args[argIndex];
}


export const mockCachedObject = {} as Model; // used by function below


// Creates a shell of a ModelService, for caching by objects linked to whichever main object is being tested
export function createMockLinkedObjectService(): ModelService<any> {
	const returnValues = {
		destroy: Observable.of(null),
		update: Observable.of({}),
		getFromCache: null,
	};
	
	const service = jasmine.createSpyObj(
		'mockLinkedObjectService',
		returnValues
	) as ModelService<any>;

	service.updateCache =
		jasmine.createSpy('updateCache').and.callFake(identity);

	return service;
}


// Fake method, to take the place of various mock/spy functions
function identity(arg: any): any {
	return arg;
}


// Zips two arrays and iterates through them together
export function forEachPair<T1, T2>(
	arrayA: T1[],
	arrayB: T2[],
	func: (itemA: T1, itemB: T2) => void
): void {

	const numIterations = Math.max(
		arrayA.length,
		arrayB.length
	);

	for(let i = 0; i < numIterations; i++)
		func(arrayA[i], arrayB[i]);
}


export function forEachEnumItem(
	enumeration: any,
	func: (index: number) => void
): void {

	for(let item of Object.keys(enumeration)) {
		const num = +item;
		if(!isNaN(num))
			func(num);
	}
}


export function checkNumberIsAlmost(
	actualValue: number,
	expectedValue: number
): void {
	expect(actualValue).toBeGreaterThan(expectedValue - 1);
	expect(actualValue).toBeLessThan(expectedValue + 1);
}


export function clickOnWindow(): void {
	window.dispatchEvent(new MouseEvent('click'));
}


export function checkEmittedValueEquals<T>(
	expectedValue: T,
	stream: Observable<T>
): void {
	stream.subscribe(
		(emittedValue: T) =>
			expect(emittedValue).toEqual(expectedValue)
	);
}
