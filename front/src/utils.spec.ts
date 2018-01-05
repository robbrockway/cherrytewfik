import { Type } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';

import {
	AnimationMetadata,
	AnimationTriggerMetadata,
	AnimationTransitionMetadata,
	AnimationAnimateMetadata,
} from '@angular/animations';

import {
	Model,
	Piece,
	Category,
	User,
	FieldDescriptor,
} from 'modules/main/models';

import {
	FadeAnimation,
	createFadeAnimation,
	directoryWithTrailingSlash,
	fullImageSize,
	generateImgSrcset,
	generateImgSrcsetItem,
	generateImgSrc,
	generateImgWidthDirectoryName,
	isValidImage,
	getViewportRight,
	getViewportBottom,
	randInt,
	getNumberAsTwoDigits,
	arrayWithItemRemoved,
	getStaticMember,
	isInstance,
	isPKType,
	arrayDifference,
	arrayXor,
	flatten2DArray,
	isArray,
	arrayContains,
	getFirstItemWhere,
	getLastItem,
	removeFromArray,
	trueForAny,
	replaceArrayContents,
	mergeSetAIntoSetB,
	forEachProperty,
	copyObjectProperties,
	objectHasPropertyOfType,
	getObjectPropertyValues,
	objectHasPropertyValue,
	runAsync,
	getCookie,
	mainButtonIsHeld,
	isImageFieldType,
	randomBetween,
} from './utils';



describe('directoryWithTrailingSlash()', () => {

	it('should add slash to directory without one', () => {
		expect(directoryWithTrailingSlash('directory'))
			.toBe('directory/');
	});


	it('should leave directory with slash unaltered', () => {
		expect(directoryWithTrailingSlash('directory/'))
			.toBe('directory/');
	});

});



const imgDirectory = 'directory';
const imgWidthList = [180, 360, 720];
const imgFilename = 'image.jpg';


describe('generateImgSrcset()', () => {

	const expectedSrcset = 
		'directory/180w/image.jpg 180w, '
		+ 'directory/360w/image.jpg 360w, '
		+ 'directory/720w/image.jpg 720w';


	it('should supply correct filenames and widths', () => {
		const actualSrcset = generateImgSrcset(
			imgDirectory,
			imgWidthList,
			imgFilename
		);

		expect(actualSrcset).toBe(expectedSrcset);
	});


	it('should leave out full-size image', () => {
		const actualSrcset = generateImgSrcset(
			imgDirectory,
			imgWidthList.concat([fullImageSize]),
			imgFilename
		);

		expect(actualSrcset).toBe(expectedSrcset);
	});

});



describe('generateImgSrcsetItem()', () => {

	it('should return correct filename and width', () => {
		const actualSrcsetItem = generateImgSrcsetItem(
			imgDirectory,
			imgWidthList[0],
			imgFilename
		);

		expect(actualSrcsetItem).toBe(
			'directory/180w/image.jpg 180w'
		);
	});

});



describe('generateImgSrc()', () => {

	it('should return correct filename for numbered width', () => {
		const actualSrc = generateImgSrc(
			imgDirectory,
			imgWidthList[0],
			imgFilename
		);

		expect(actualSrc).toBe('directory/180w/image.jpg');
	});


	it('should return correct filename for full-size image', () => {
		const actualSrc = generateImgSrc(
			imgDirectory,
			fullImageSize,
			imgFilename
		);

		expect(actualSrc).toBe('directory/fullsize/image.jpg');
	});

});



describe('generateImgWidthDirectoryName()', () => {

	let testWithWidth: (width: number) => void;


	it('should return correct directory name', () => {
		for(let width of imgWidthList)
			testWithWidth(width);
	});


	testWithWidth = (width: number) => {
		expect(
			generateImgWidthDirectoryName(width)
		).toBe(width + 'w');
	};

});



describe('isValidImage()', () => {

	let getResultForExtension: (fileExtension: string) => boolean;


	it('should return true for allowed file extensions', () => {
		for(let extension of ['jpg', 'jpeg', 'png'])
			expect(getResultForExtension(extension)).toBe(true);
	});


	getResultForExtension = (fileExtension: string) => {
		const filename = 'file.' + fileExtension;
		const file = new File([], filename);
		return isValidImage(file);
	};


	it('should return false for disallowed file extensions', () => {
		for(let extension of ['tiff', 'html', 'exe'])
			expect(getResultForExtension(extension)).toBe(false);
	});

});



const numViewportTestReps = 5;



describe('getViewportRight()', () => {

	it('should return scroll position + window width', () => {
		for(let i = 0; i < numViewportTestReps; i++) {
			pageXOffset = randInt(0, 100);
			innerWidth = randInt(0, 1000);
			expect(getViewportRight()).toBe(pageXOffset + innerWidth);
		}
	});

});



describe('getViewportBottom()', () => {

	it('should return scroll position + window height', () => {
		for(let i = 0; i < numViewportTestReps; i++) {
			pageYOffset = randInt(0, 100);
			innerHeight = randInt(0, 500);
			expect(getViewportBottom()).toBe(pageYOffset + innerHeight);
		}
	});

});



describe('getNumberAsTwoDigits()', () => {

	it('should add a zero to a one-digit number', () => {
		expect(getNumberAsTwoDigits(7)).toBe('07');
		expect(getNumberAsTwoDigits(3)).toBe('03');
	});


	it('should render a two-digit number as-is', () => {
		expect(getNumberAsTwoDigits(23)).toBe('23');
		expect(getNumberAsTwoDigits(99)).toBe('99');
	});


	it('should truncate a number longer than two digits', () => {
		expect(getNumberAsTwoDigits(100)).toBe('00');
		expect(getNumberAsTwoDigits(4589)).toBe('89');
	});

});



describe('arrayWithItemRemoved()', () => {

	it('should remove correct item', () => {
		expect(
			arrayWithItemRemoved([1, 2, 3], 2)
		).toEqual(
			[1, 3]
		);
	});


	it(`should leave array the same if item isn't found`, () => {
		const array = [1, 2, 3];

		expect(arrayWithItemRemoved(array, 4)).toEqual(array);
	});

});



describe('getStaticMember()', () => {

	let runChecks: (
		getFieldDescriptors: (type: Type<Model>) => FieldDescriptor[]
	) => void;

	
	it('should return correct values when used with Type', () => {
		const getFieldDescriptors = (type: Type<Model>) =>
			getStaticMember(type, 'fieldDescriptors');

		runChecks(getFieldDescriptors);
	});


	// Several types. getFieldDescriptors will retrieve the static .fieldDescriptors property either straight from the Type (above) or from an instance (below).
	runChecks = (
		getFieldDescriptors: (type: Type<Model>) => FieldDescriptor[]
	) => {
		expect(getFieldDescriptors(Piece))
			.toBe(Piece.fieldDescriptors);

		expect(getFieldDescriptors(Category))
			.toBe(Category.fieldDescriptors);

		expect(getFieldDescriptors(User))
			.toBe(User.fieldDescriptors);
	};


	it('should return correct values when used with '
			+ 'class instance', () => {
		const getFieldDescriptors = (type: Type<Model>) => {
			const instance = new type(null, {});
			return getStaticMember(instance, 'fieldDescriptors');
		};

		runChecks(getFieldDescriptors);
	});

});



describe('isInstance()', () => {

	it('should return correct values', () => {
		const piece = new Piece(null, {});
		const category = new Category(null, {});

		expect(isInstance(piece, Piece)).toBeTruthy();
		expect(isInstance(piece, Category)).toBeFalsy();
		expect(isInstance(category, Piece)).toBeFalsy();
		expect(isInstance(category, Category)).toBeTruthy();
	});

});



describe('isPKType()', () => {

	it('should be true for string', () =>
		expect(isPKType('yo')).toBe(true)
	);


	it('should be true for number', () =>
		expect(isPKType(9999)).toBe(true)
	);


	it('should be false for other types', () => {
		const values = [true, [], new Object()];

		for(let value of values)
			expect(isPKType(value)).toBe(false);
	});

});



describe('arrayXor()', () => {


	it('should return correct array', () => {

		expect(
			arrayXor(['a', 'b', 'c'], ['b', 'c', 'd']).sort()
		).toEqual(['a', 'd']);

		expect(
			arrayXor(['a', 'b', 'c'], ['b']).sort()
		).toEqual(['a', 'c']);

		expect(
			arrayXor(['a'], ['a', 'b', 'c']).sort()
		).toEqual(['b', 'c']);

		expect(
			arrayXor(['a', 'b'], ['a', 'b'])
		).toEqual([]);

	});


});



describe('arrayDifference()', () => {

	it('should return correct array', () => {

		expect(
			arrayDifference(['a', 'b', 'c'], ['b', 'c'])
		).toEqual(['a']);

		expect(
			arrayDifference(['b', 'c'], ['a', 'b'])
		).toEqual(['c']);

		expect(
			arrayDifference(['a', 'b'], ['a', 'b'])
		).toEqual([]);

	});

});



describe('flatten2DArray()', () => {

	it('should return a flattened version of a fully-2D array', () => {
		expect(
			flatten2DArray([[1, 2], [3, 4, 5], [6, 7], [8]])
		).toEqual(
			[1, 2, 3, 4, 5, 6, 7, 8]
		);
	});


	it('should return a flattened version of an array that '
			+ 'has some already-flat elements', () => {
		expect(
			flatten2DArray([1, 2, [3, 4], 5, [6, 7, 8]])
		).toEqual(
			[1, 2, 3, 4, 5, 6, 7, 8]
		);
	});

});



describe('isArray()', () => {

	const nonArrays = [
		42,
		'blahblahblah',
		null,
		new Piece(null, {}),
	];

	const arrays = [
		[],
		[1, 2, 3],
		['foo', 'bar', 'baz'],
		[new Piece(null, {}), new Piece(null, {})],
	];


	it('should return false for non-arrays', () => {
		for(let nonArray of nonArrays)
			expect(isArray(nonArray)).toBe(false);
	});


	it('should return true for arrays', () => {
		for(let array of arrays)
			expect(isArray(array)).toBe(true);
	});

});


describe('arrayContains()', () => {

	const array = ['bleep', 'blarp', 'bloop'];
	const otherItems = ['gleep', 'glarp', 'gloop'];


	it('should return true for items in array', () => {
		for(let item of array)
			expect(arrayContains(array, item)).toBe(true);
	});


	it('should return false for items not in array', () => {
		for(let item of otherItems)
			expect(arrayContains(array, item)).toBe(false);
	});

});


describe('getFirstItemWhere()', () => {

	it('should return first, and not any other, item that satisfies test',
			() => {
		
		let first = getFirstItemWhere(
			[1, 2, 3, 4, 5, 6],
			(num: number) => num % 2 === 0	// even number
		);

		expect(first).toBe(2);


		first = getFirstItemWhere(
			[5, 'blah', true, null, 'boom'],
			(item: any) => typeof item === 'string'
		);

		expect(first).toBe('blah');
	});

});


describe('getLastItem()', () => {

	it('should return last item', () => {
		expect(
			getLastItem([0, 3, 1, 2])
		).toBe(2);

		expect(
			getLastItem([4.3, true, {}, 'aaa'])
		).toBe('aaa');
	});


	it('should return undefined for empty array', () => {
		expect(getLastItem([])).toBe(undefined);
	});

});



describe('removeFromArray()', () => {

	let array: number[];
	

	beforeEach(() =>
		array = [2, 3, 5, 7, 11, 13]
	);


	it('should remove item', () => {
		removeFromArray(array, 5);
		expect(array).toEqual([2, 3, 7, 11, 13]);
	});


	it('should do nothing if array does not contain item', () => {
		removeFromArray(array, 6);
		expect(array).toEqual([2, 3, 5, 7, 11, 13]);
	});

});



describe('trueForAny()', () => {

	const array = [1, 2, 3, 4, 5];


	it('should return true if condition is true for one item in array',
			() => {
		expect(
			trueForAny(array, (item: number) => item === 5)
		).toBe(true);
	});


	it('should return false if condition is false for all items in array',
			() => {
		expect(
			trueForAny(array, () => false)
		).toBe(false);
	});

});



describe('replaceArrayContents()', () => {

	let array = [1, 2, 3];
	const newContents = [4, 5, 6];


	it('should return array with new contents', () => {
		expect(
			replaceArrayContents(array, newContents)
		).toEqual(newContents);
	});


	it('should create new array, when initial one is falsy', () => {
		expect(
			replaceArrayContents(null, newContents)
		).toEqual(newContents);
	});


	it('should return original array instance, having altered it', () => {
		expect(
			replaceArrayContents(array, newContents)
		).toBe(array);
	});

});



describe('mergeSetAIntoSetB()', () => {
	
	it(`should add set A's items to B, in place`, () => {
		const a = new Set([0, 1, 2]);
		const b = new Set([2, 3, 4]);

		mergeSetAIntoSetB(a, b);

		expect(b).toEqual(new Set([2, 3, 4, 0, 1]));
	});

});



describe('forEachProperty()', () => {

	const testObject = {a: 1, b: 'two', c: null};


	it('should execute callback for each key/value pair', () => {
		const reconstructedObject = {};

		forEachProperty(testObject, (key: string, value: any) => {
			reconstructedObject[key] = value;
		});

		expect(reconstructedObject).toEqual(testObject);
	});

});



describe('copyObjectProperties()', () => {

	let a: any, b: any;


	beforeEach(() => {
		a = {w: 'aaaa', x: 42, y: true};
		b = {x: 43, y: false, z: 'zzzz'};
	});


	it('should copy all named properties from source to destination', () => {
		copyObjectProperties(a, b, ['x', 'y', 'z']);
		expect(a).toEqual(jasmine.objectContaining(b));
	});


	it('should not copy unnamed properties from source to destination', () => {
		copyObjectProperties(a, b, ['y', 'z']);
		expect(a.x).not.toBe(b.x);
	});

});



describe('objectHasPropertyValue()', () => {

	const object = {
		a: 1,
		b: 'foo',
		c: true,
	};


	it('should return true if value is contained as property', () => {
		for(let value of getObjectPropertyValues(object))
			expect(objectHasPropertyValue(object, value)).toBe(true);
	});


	it('should return false if value is not contained', () => {
		for(let value of [42, 'bar', false])
			expect(objectHasPropertyValue(object, value)).toBe(false);
	});

});



describe('objectHasPropertyOfType()', () => {

	const object = {
		a: new FormData(),
		b: document.createElement('div'),
	};

	let checkTypesGetResult: (
		types: Type<any>[],
		expectedResult: boolean
	) => void;


	it('should return true for types included', () => {
		checkTypesGetResult([FormData, HTMLDivElement], true);
	});


	checkTypesGetResult = (
		types: Type<any>[],
		expectedResult: boolean
	) => {
		for(let type of types)
			expect(objectHasPropertyOfType(object, type))
				.toBe(expectedResult);
	};


	it('should return true for superclasses of types included', () => {
		checkTypesGetResult([Object, HTMLElement], true);
	});


	it('should return false for types not included', () => {
		checkTypesGetResult([XMLHttpRequest, HTMLSpanElement], false);
	});

});



describe('getObjectPropertyValues()', () => {

	const object = {
		a: 5,
		b: 'boing',
		c: true,
	};

	const expectedValues = [5, 'boing', true];


	it(`should return a list of object's property values`, () => {
		const actualValues = getObjectPropertyValues(object);
		expect(actualValues.sort()).toEqual(expectedValues.sort());
	});

});



describe('runAsync()', () => {

	let spy: () => void;


	beforeEach(() => {
		spy = jasmine.createSpy('func');
	});


	it(`shouldn't execute callback on same thread`, () => {
		runAsync(spy);
		expect(spy).not.toHaveBeenCalled();
	});


	it('should execute callback on different thread', fakeAsync(() => {
		runAsync(spy);
		tick();
		expect(spy).toHaveBeenCalled();
	}));

});


describe('getCookie()', () => {

	const key = 'cookie';
	const value = 'Value value value';
	const cookie = `${key}=${value}`;

	const wholeCookieStrings = [
		cookie,
		`${cookie};blah=blah`,
		`boom=blah;${cookie};blah=boom`,
		`boom=blah; ${cookie}; blah=boom`,
	];


	it('should return correct value', () => {
		for(let wholeCookieString of wholeCookieStrings) {
			document.cookie = wholeCookieString;
			expect(getCookie(key)).toBe(value);
		}
	});
	
});


describe('mainButtonIsHeld()', () => {

	let getResultWithButtons: (eventButtonsValue: number) => boolean;


	it(`should return true for odd-numbered values of 'buttons'`, () => {
		for(let value of [1, 3, 5, 7, 17, 249])
			expect(getResultWithButtons(value)).toBe(true);
	});


	getResultWithButtons = (eventButtonsValue: number) => {
		const event = new MouseEvent(
			'click',
			{buttons: eventButtonsValue}
		);

		return mainButtonIsHeld(event);
	};


	it(`should return false for even-numbered values of 'buttons'`, () => {
		for(let value of [2, 4, 6, 8, 18, 250])
			expect(getResultWithButtons(value)).toBe(false);
	});

});



describe('isImageFieldType()', () => {

	it('should return true for image', () => {
		expect(isImageFieldType('image')).toBe(true);
	});


	it('should return true for thumbnail', () => {
		expect(isImageFieldType('thumbnail')).toBe(true);
	});


	it('should return false for others', () => {
		for(let fieldType of ['string', 'price', 'whatevs'])
			expect(isImageFieldType(fieldType)).toBe(false);
	});

});


describe('randomBetween()', () => {

	const min = -50, max = 50;


	it('should produce numbers between min and max', () => {
		for(let i = 0; i < 10; i++) {
			const num = randomBetween(min, max);
			expect(num).not.toBeLessThan(min);
			expect(num).not.toBeGreaterThan(max);
		}
	});

});