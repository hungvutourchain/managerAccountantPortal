export class PassengerAddRequest {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    birthday?: Date;
    sex?: 'Mr.' | 'Mrs.' | 'Ms.' | 'Mx.' = 'Mr.';
    age?: 'A' | 'C' = 'A';
    ageChild?: number;
    passport?: string;
    validity?: Date;
    nationality?: string;
    note?: string;

    email?: String;
    tel?: String;
    address?: String;
    groupId?: String;
    groupName?: String;
}

export class PassengerUpdateRequest extends PassengerAddRequest {
    _id: string;

    from(p: PassengerInfo) {
        this._id = p._id;
        this.firstName = p.firstName;
        this.middleName = p.middleName;
        this.lastName = p.lastName;
        this.birthday = p.birthday;
        this.sex = p.sex;
        this.age = p.age;
        this.ageChild = p.ageChild;
        this.passport = p.passport;
        this.validity = p.validity;
        this.nationality = p.nationality;
        this.note = p.note;

        this.email = p.email;
        this.tel = p.tel;
        this.address = p.address;
        this.groupId = p.groupId;
        this.groupName = p.groupName;

        return this;
    }
}

export class PassengerSearchRequest {
    search: any = null;
    mrMrs?: '' | 'Mr.' | 'Mrs.' | 'Ms.' | 'Mx.' = '';
    age?: '' | 'A' | 'C' = '';
    nationality?: string = '';
    groupId?: string = '';
    start?: number = 0;
    length?: number = 10;
    ignoreIds?: string[]
}

export class PassengerInfo extends PassengerUpdateRequest {
    createdDate: Date;
    updatedDate: Date;
}
