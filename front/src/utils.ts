import { Type } from '@angular/core';

import {
	AnimationTriggerMetadata,
	AnimationStyleMetadata,
	style,
	trigger,
	transition,
	animate,
} from '@angular/animations';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';



export function capitaliseWord(lowercase: string): string {
	const firstLetter = lowercase.charAt(0).toUpperCase();
	return firstLetter + lowercase.slice(1);
}



export function directoryWithTrailingSlash(directory: string): string {
	if(directory.slice(-1) === '/')
		return directory;

	return directory + '/';
}


export const fullImageSize = -1;


export function generateImgSrcset(
	rootDirectory: string,
	widthList: number[],
	filename: string
): string {

	// Leave 'fullsize' out as we can't specify exactly what width the image will be for srcset
	const widthListWithoutFullsize = widthList.filter(
		(width: number) => width !== fullImageSize
	);

	return widthListWithoutFullsize.map(
		(width: number) => generateImgSrcsetItem(
			rootDirectory,
			width,
			filename
		)
	).join(', ');
}


export function generateImgSrcsetItem(
	rootDirectory: string,
	width: number,
	filename: string
): string {
	return [
		generateImgSrc(rootDirectory, width, filename),
		width + 'w',
	].join(' ');
}


export function generateImgSrc(
	rootDirectory: string,
	width: number,
	filename: string
): string {
	return directoryWithTrailingSlash(rootDirectory)
		+ generateImgWidthDirectoryName(width)
		+ '/' + filename;
}


export function generateImgWidthDirectoryName(width: number): string {
	if(width === fullImageSize)
		return 'fullsize';

	return width + 'w';
}


export const validImageTypes = ['jpg', 'jpeg', 'png'];


export function isValidImage(file: File): boolean {
	const filenameParts = file.name.split('.');
	const extension = getLastItem(filenameParts);
	return arrayContains(validImageTypes, extension);
}


export function arrayContains<T>(array: T[], value: T): boolean {
	return array.indexOf(value) !== -1;
}


// Document-relative coordinate of the right hand side of viewport
export function getViewportRight(): number {
	return pageXOffset + innerWidth;
}


export function getViewportBottom(): number {
	return pageYOffset + innerHeight;
}


export function randInt(min: number, max: number): number {
	return Math.floor(
		min + Math.random() * max
	);
}


export function getNumberAsTwoDigits(num: number): string {
	return ('0' + num).slice(-2);
}


// Workaround for a suprisingly hard problem in JS/TS.
export function getStaticMember(
	objectOrType: any,
	memberName: string
): any {

	const prototype = objectOrType.prototype || objectOrType.__proto__;
	return prototype.constructor[memberName];
}


// Unfortunately doesn't work for abstract classes, but is good for concrete ones e.g. model types
export function isInstance(object: any,	type: Type<any>): boolean {
	return object instanceof type.prototype.constructor;
}


export function isDigit(character: string): boolean {
	const number = parseInt(character);
	return !isNaN(number);
}


// True if value could be a valid primary key
export function isPKType(value: any): boolean {
	const valueType = typeof value;

	return valueType === 'number'
		|| valueType === 'string';
}


export function arrayWithItemRemoved(array: any[], item: any): any[] {
	const indexOfItem = array.indexOf(item);
	const output = Array.from(array);

	if(indexOfItem !== -1)
		output.splice(indexOfItem, 1);

	return output;
}


export function arrayXor(a: any[], b: any[]): any[] {
	const aMinusB = arrayDifference(a, b);
	const bMinusA = arrayDifference(b, a);
	return aMinusB.concat(bMinusA);
}


export function arrayDifference(a: any[], b: any[]): any[] {
	const bSet = new Set(b);
	return a.filter((element: any) => !bSet.has(element));
}


export function flatten2DArray(array: any[]): any[] {
	return array.reduce((accum: any[], current: any) => {
		if(isArray(current))
			accum.push(...current);
		else
			accum.push(current);

		return accum;
	}, []);
}


export function isArray(value: any): boolean {
	if(!value || !value.constructor)
		return false;

	return value.constructor === Array;
}


export function getFirstItemWhere<T>(
	array: T[],
	test: (item: T) => boolean
): any {
	return array.filter(test)[0];
}


export function getLastItem<T>(array: T[]): T {
	const index = array.length - 1;
	return array[index];
}


// In place
export function removeFromArray<T>(array: T[], item: T): void {
	const index = array.indexOf(item);
	if(index === -1)	// No occurrence
		return;

	array.splice(index, 1);
}


export function trueForAny<T>(
	array: T[],
	predicate: (item: T) => boolean
): boolean {
	const itemsSatisfyingPredicate = array.filter(predicate);
	return !!itemsSatisfyingPredicate.length;
}


// Empties array; loads new contents inside; returns the original instance
export function replaceArrayContents(
	array: any[],
	newContents: any[]
): any[] {
	array = array || [];
	
	while(array.length)
		array.pop();

	array.push(...newContents);

	return array;
}


export function mergeSetAIntoSetB<T>(a: Set<T>, b: Set<T>): void {
	a.forEach((item: T) => b.add(item));
}
	

export function forEachProperty(
	object: any,
	func: (key: string, value: any) => void
): void {
	for(let key of Object.keys(object))
		func(key, object[key]);
}


// A bit like Object.assign(), but only copies the properties that are named
export function copyObjectProperties(
	destinationObject: any,
	sourceObject: any,
	propertyNames: string[]
): void {
	for(let propertyName of propertyNames)
		destinationObject[propertyName] = sourceObject[propertyName];
}


// Does the object have this value for at least one of its properties?
export function objectHasPropertyValue(object: any, value: any): boolean {
	const allValues = getObjectPropertyValues(object);
	return arrayContains(allValues, value);
}


// Returns an array of property values
export function getObjectPropertyValues(object: any): any[] {
	const keys = Object.keys(object);

	return keys.reduce((valuesArray: any[], currentKey: string) => {
		const currentValue = object[currentKey];
		valuesArray.push(currentValue);
		return valuesArray;
	}, []);
}


export function objectHasPropertyOfType(
	object: any,
	type: Type<any>
): boolean {
	if(!object)
		return false;

	for(let propertyName of Object.keys(object)) {
		const value = object[propertyName];
		if(isInstance(value, type))
			return true;
	}

	return false;
}


export function runAsync(func: () => void): void {
	setTimeout(func);
}


export function getCookie(name: string): string {
	// Find any string of non-semicolon characters preceded by name, preceded in turn either by beginning of string, whitespace, or another semicolon
	const pattern = new RegExp(`(?<=(^|;| )${name}=)[^;]*`, 'g');

	const matches = document.cookie.match(pattern);
	return matches ? matches[0] : null;
}


export function mainButtonIsHeld(event: MouseEvent): boolean {
	return !!(event.buttons & 1);	// Final bit is on
}


export function getCurrentYear(): number {
	const date = new Date();
	return date.getFullYear();
}


export function isImageFieldType(fieldType: string): boolean {
	return fieldType === 'image' || fieldType === 'thumbnail';
}


export function comesFromNonCharacterKey(event: KeyboardEvent): boolean {
	return event.key.length > 1		// Character keys give only that character as event.key; others have a full name
		|| event.ctrlKey || event.altKey || event.metaKey;
}


export function randomBetween(min: number, max: number): number {
	const range = max - min;
	return min + Math.random() * range;
}