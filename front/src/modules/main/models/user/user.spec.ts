import { User } from './user';
import { ModelTest } from '../model.test.base';
import { testUserData, ModelTestData } from 'testing';



class UserTest extends ModelTest<User> {

	constructor() {
		super(User);
	}


	protected defineTests(): void {
		super.defineTests();


		it('.fullName should resolve to first name + last name', () => {
			expect(this.instance.fullName).toBe(
				`${this.instance.firstName} ${this.instance.lastName}`
			);
		});

	}


	protected initTestData(): ModelTestData<User> {
		return testUserData;
	}

}


new UserTest();
