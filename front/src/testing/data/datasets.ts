// Data for testing, mostly for models


// Model types: keep these imports distinct, rather than barrelling them together with one import from modules/main/models, otherwise classes won't load properly
import { Piece } from 'modules/main/models/piece';
import { Category } from 'modules/main/models/category';
import { User } from 'modules/main/models/user';
import { TableString } from 'modules/main/models/table-string';

import { YearMonth } from 'modules/shared';
import { Dialogue } from 'modules/main/dialogue';
import { Form, FormField } from 'modules/main/form';
import { TickerImage } from 'modules/shared/image-ticker';

import { ModelTestData } from './model.test.data';
import { ModelInstanceTestData } from './model.instance.test.data';
import { BasicTestField } from './basic.test.field';
import { DateTestField } from './date.test.field';
import { LinkedObjectTestField } from './linked.object.test.field';
import { MultiLinkedObjectTestField }
	from './multi.linked.object.test.field';



const longDescription = 
	`The elephant's a useful friend<br/>
	He has a handle at each end<br/>
	He has a wrinkled moth-proof hide<br/>
	His teeth are upside-down, outside<br/>
	If you think the elephant preposterous<br/>
	You've probably never met the rhinosterous.`;



export const testPieceData = new ModelTestData(
	Piece, 2,
	[
		[
			new BasicTestField('id', 1),
			new BasicTestField('name', 'Potty McPotface'),
			new BasicTestField('price', 150., 'price', '150.00'),
			new DateTestField('date', new YearMonth(1992, 5), 'date', '1992-05'),
			new BasicTestField('description', longDescription),
			new BasicTestField('image', 'piece1.jpg'),
		],

		[
			new BasicTestField('id', 2),
			new BasicTestField('name', 'Facey McPotpot'),
			new BasicTestField('price', 200., 'price', '200.00'),
			new DateTestField('date', new YearMonth(2001, null), 'date', '2001-null'),
			new BasicTestField('description', 'Alternate description'),
			new BasicTestField('image', '', 'image', null),
		],

		[
			new BasicTestField('id', 3),
			new BasicTestField('name', 'Potassium hydrochloride'),
			new BasicTestField('price', 250., 'price', '250.00'),
			new DateTestField('date', new YearMonth(2388, 12), 'date', '2388-12'),
			new BasicTestField('description', 'Alternate alternate description'),
			new BasicTestField('image', 'piece2.jpg'),
		],
	]
);


// Subgroups of pieces, for categorisation
const firstTwoPieces = testPieceData.getSubset(0, 2);
const lastPiece = testPieceData.getSubset(2, 3);


export const testCategoryData = new ModelTestData(
	Category, 1,
	[
		[
			new BasicTestField('id', 1),
			new BasicTestField('name', 'First test category'),
			new BasicTestField('description', longDescription),
			new MultiLinkedObjectTestField('pieces', firstTwoPieces),
		],

		[
			new BasicTestField('id', 2),
			new BasicTestField('name', 'Second test category'),
			new BasicTestField('description', 'Second description'),
			new MultiLinkedObjectTestField('pieces', lastPiece),
		],

		[
			new BasicTestField('id', 3),
			new BasicTestField('name', 'Third test category'),
			new BasicTestField('description', 'Third description'),
			MultiLinkedObjectTestField.createEmpty('pieces', Piece),
		],
	]
);


// Now that categories are defined, have pieces refer to them
testPieceData.unzipAndAddLinkedObjects(
	'category',
	[
		testCategoryData.instances[0],
		testCategoryData.instances[0],
		testCategoryData.instances[1],
	]
);


export const testUserData = new ModelTestData(
	User, 0,
	[
		[
			new BasicTestField('id', 1),
			new BasicTestField('firstName', 'Harry', 'first_name'),
			new BasicTestField('lastName', 'Potter', 'last_name'),
			new BasicTestField('email', 'hpotz@hogwarts.net'),
			new BasicTestField('isStaff', false, 'is_staff'),
		],

		[
			new BasicTestField('id', 2),
			new BasicTestField('firstName', 'Gilbert', 'first_name'),
			new BasicTestField('lastName', 'Pottfried', 'last_name'),
			new BasicTestField('email', 'other@address.com'),
			new BasicTestField('isStaff', false, 'is_staff'),
		],

		[
			new BasicTestField('id', 3),
			new BasicTestField('firstName', 'Staffy', 'first_name'),
			new BasicTestField('lastName', 'McStafferson', 'last_name'),
			new BasicTestField('email', 'st@ff.com'),
			new BasicTestField('isStaff', true, 'is_staff'),
		],
	]
);


export const testTableStringData = new ModelTestData(
	TableString, 0,
	[
		[
			new BasicTestField('key', 'first_key'),
			new BasicTestField('value', 'First value'),
		],

		[
			new BasicTestField('key', 'second_key'),
			new BasicTestField('value', 'Second value'),
		],

		[
			new BasicTestField('key', 'third_key'),
			new BasicTestField('value', 'Third value'),
		],
	]
);


export const testForms = {

	plain: new Form(
		'plain',
		new FormField('name', 'Name'),
		new FormField('email', 'Email', '', 'email')
	),

	withDefaults: new Form(
		'withDefaults',
		new FormField('name', 'Name', 'Minnie Bannister'),
		new FormField('email', 'Email', 'modernmin@goons.net', 'email')
	),

	withTwoFieldsInFirstRow: new Form(
		'withTwoFieldsInFirstRow',
		[
			new FormField('firstname', 'First name', '', 'text'),
			new FormField('lastname', 'Last name', '', 'text'),
		],
		new FormField('email', 'Email', '', 'email')
	),

};


export const testDialogue: Dialogue = {
	heading: 'Test dialogue',
	message: 'Message message message',
	buttonLabels: {
		ok: 'OK',
		cancel: 'Cancel',
	},
};


export const testFormDialogue: Dialogue = Object.assign(
	{},
	testDialogue,
	{ form: testForms.plain }
);


export const testTickerImages: TickerImage[] = [
	{filename: 'image1.jpg', alt: 'First image'},
	{filename: 'image2.jpg'},
	{filename: 'image3.jpg', alt: 'Third image'},
	{filename: 'image4.jpg', routerLink: '/page4'},
	{filename: 'image5.jpg', alt: 'Fifth image', routerLink: '/page5'},
];


export const testCredentials = {
	email: 'user@email.com',
	password: 'passymcwordface',
};
