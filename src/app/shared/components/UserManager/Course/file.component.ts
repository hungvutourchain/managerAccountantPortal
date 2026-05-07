import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppFactory } from '../../../lib/common.service';
import * as _ from 'lodash';
import * as $ from 'jquery';
import md5 from "md5";
import { DbService } from '../../../connectData/db.service';
@Component({
  standalone: false,
  selector: 'users-course',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.css']
})
export class CourseComponent implements OnInit {
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains'
  };
  @Input() user: any
  @Input() gridViewStudent: any = []
  @Input() listParent: any
  @Output() out = new EventEmitter()
  object: any = {};
  lsobject: any = [];
  cSave: any = false;
  searchText: any = '';
  // -----------------------------------------------------
  constructor(
    public afac: AppFactory,
    private _snackBar: MatSnackBar,
    private dbService: DbService,
  ) {
  }
  listUser: any = [];
  ngOnInit() {
    this.Getlist(this.user.nation)
    this.listUser = this.gridViewStudent.filter(item => item.active)
  }
  // -----------------------------------------------------
  notifi(type, mes): void {
    this._snackBar.open(mes, type, {
      duration: 2000,
      verticalPosition: 'top', horizontalPosition: 'center'
    });
  }
  Getlist(nation) {
    //GetdataByGolive();
    this.dbService.GetCourse(nation).subscribe((rs: any) => {
      this.lsobject = rs;
      this._oderby()
    });
  };
  _oderby() {
    this.lsobject = _.orderBy(this.lsobject, 'name', 'asc')
  }
  openDialog: boolean = false;
  objectValue(action, object) {
    if (action === 'delete') {
      if (confirm('Are you sure to delete?')) {
        this.dbService.RemoveCourse(object).subscribe((rs: any) => {
          this.lsobject.splice(this.lsobject.indexOf(object), 1);
          this.Getlist(this.user.nation)
          this.out.emit();
        });
      }
    } else if (action === 'add') {
      let temp: any = _.cloneDeep(object);
      temp.nation = this.user.nation;
      this.dbService.AddCourse(temp).subscribe((rs: any) => {
        if (rs) {
          this.Getlist(this.user.nation)
          this.out.emit();
          this.object = {};
          this.openDialog = false
        }
      });
    }
    else if (action === 'new') {
      this.object = {};
      this.openDialog = true
      this.cSave = false
    }
    else if (action === 'edit') {
      this.object = object;
      this.openDialog = true
      this.cSave = true;
    }
    else if (action === 'cancel') {
      this.object = {};
      this.cSave = false;
      this.openDialog = false
      this.Getlist(this.user.nation)
    }
    else {
      this.dbService.UpdateCourse(object).subscribe((rs: any) => {
        this.Getlist(this.user.nation)
        this.out.emit();
        this.object = {};
        this.openDialog = false
        this.cSave = false;
      });
    }
  };
  AddUsers() {
    if (!this.object?.users) this.object.users = []
    this.object.users.push({
      username: '',
      leader: false
    })
  }
  DeleteService(x) {
    if (confirm('Are you sure to delete?')) {
      this.object.users.splice(this.object.users.indexOf(x), 1);
    }
  }
  Close() {
    this.out.emit();
  }
  // --------------
}
