import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as _ from 'lodash';
import { DbService } from 'app/shared/connectData/db.service';
import { LibService } from 'app/shared/lib/lib.service';
import { nationality } from 'app/globals';

@Component({
  standalone: false,
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  formData: FormGroup;
  titelPage: string = 'Form | Tourchain';
  isObject: any = {};
  lsAgency: any = [];
  idAgency: any = '';
  submit: boolean = false;
  lsnationality: any = [];

  constructor(
    private _snackBar: MatSnackBar,
    private dbService: DbService,
    public lib: LibService,
    private formBuilder: FormBuilder
  ) {
    document.title = this.titelPage;
    this.lsnationality = nationality;
    this.dbService.LoadAgencyForm('').subscribe((rs) => {
      this.lsAgency = rs || [];
    });
  }

  ngOnInit() {
    this.formData = this.formBuilder.group({
      agency: ['', Validators.required],
      place: ['', Validators.required],
      placeName: ['', Validators.required],
      Address: ['', Validators.required],
      formcountry: ['', Validators.required],
      contact: ['', Validators.required],
      formtitle: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', Validators.required],
      leisure: [''],
      priority: ['', Validators.required],
      group: [''],
      OnlinePlatform: [''],
      note: ['', Validators.required],
    });
  }

  get formDataControl() {
    return this.formData.controls;
  }

  get formDataValue() {
    return this.formData.value;
  }

  searchAgency(vl) {
    this.dbService.LoadAgencyForm(vl).subscribe((rs) => {
      this.lsAgency = rs || [];
    });
  }

  notifi(type, mes, time = 4000): void {
    this._snackBar.open(mes, type, {
      duration: time,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  onSubmit(e) {
    this.submit = true;
    if (this.formData.invalid) return;
    const { agency } = this.formDataValue || '';
    this.idAgency = this.lsAgency.find((x) => x.name == agency)._id || '';
    this.isObject = {
      agency,
      new: this.idAgency ? true : false,
      place: this.formDataValue.place,
      placeName: this.formDataValue.placeName,
      Address: this.formDataValue.Address,
      formcountry: this.formDataValue.formcountry,
      email: this.formDataValue.email,
      formtitle: this.formDataValue.formtitle,
      contact: this.formDataValue.contact,
      phone: this.formDataValue.phone,
      priority: this.formDataValue.priority,
      leisure: this.formDataValue.leisure,
      group: this.formDataValue.group,
      OnlinePlatform: this.formDataValue.OnlinePlatform,
      note: this.formDataValue.note,
    };
    this.dbService.pushForm(this.isObject).subscribe((rs) => {
      if (rs) {
        this.notifi('success', 'Submit Success!');
        this.isObject = {};
      } else this.notifi('error', 'Submit fail.');
    });
  }
}
