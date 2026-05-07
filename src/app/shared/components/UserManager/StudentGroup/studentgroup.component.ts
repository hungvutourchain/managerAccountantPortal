import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as _ from 'lodash';
import { DbService } from '../../../connectData/db.service';
import { PageEvent } from '@angular/material/paginator';
@Component({  standalone: false,
  selector: 'student-group-view',
  templateUrl: './studentgroup.component.html',
  styleUrls: ['./studentgroup.component.css']
})
export class StudentGroupComponent implements OnInit {
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains'
  };
  @Input() user: any
  @Input() lsDataStudent: any
  @Input() listClass: any
  @Input() listDepartment: any  
  public object: any = {};
  public filter: any = {};
  public lsobject: any = [];
  public cSave: boolean = false;
  public searchText: any = '';
  pageEvent: PageEvent = { previousPageIndex: 0, pageIndex: 0, pageSize: 10, length: 0 };
  pageSizeOptions: number[] = [10, 15, 20, 25, 30, 35, 40, 45, 50];
  totalitems = 0;
  // -----------------------------------------------------
  constructor(
    private _snackBar: MatSnackBar,
    private dbService: DbService,
  ) {
  }
  ngOnInit() {
    this.Getlist()
  }
  // -----------------------------------------------------
  notifi(type, mes): void {
    this._snackBar.open(mes, type, {
      duration: 2000,
      verticalPosition: 'top', horizontalPosition: 'center'
    });
  }
  Getlist() {
    this.filter.nation = this.user.nation
    this.filter.pageNumber =this.pageEvent.pageIndex + 1
    this.filter.pageSize =this.pageEvent.pageSize
    this.dbService.GetStudentGroup(this.filter).subscribe((rs: any) => {
      this.lsobject = rs.items || [];
      this.totalitems = rs.total || 0;
    });
  };
  Change_page(event) {
    this.pageEvent = event;
    this.Getlist()
  }
  openDialog: boolean = false;
  objectValue(action: any, object: any) {
    if (action === 'delete') {
      if (confirm('Are you sure to delete?')) {
        this.dbService.RemoveStudentGroup(object).subscribe((rs: any) => {
          this.lsobject.splice(this.lsobject.indexOf(object), 1);
          this.Getlist()
          
        });
      }
    } else if (action === 'add') {
      let temp: any = _.cloneDeep(object);
      temp.nation = this.user.nation;
      temp.items = []
      this.dbService.AddStudentGroup(temp).subscribe((rs: any) => {
        if (rs) {
          this.Getlist()
          
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
      this.Getlist()
      
    }
    else {
      this.dbService.UpdateStudentGroup(object).subscribe((rs: any) => {
        this.Getlist()
        
        this.object = {};
        this.openDialog = false
        this.cSave = false;
      });
    }
  };

  cSave_items: boolean = false;
  tempObject: any = {};
  objectItems: any = {};
  openDialogItems: boolean = false;
  ValueItems(action: any, objectItems: any, tempObject: any = null) {
    switch (action) {
      case 'new':
        this.tempObject = tempObject;
        this.openDialogItems = true
        this.cSave_items = false
        break;
      case 'edit':
        this.objectItems = objectItems
        this.tempObject = tempObject
        this.openDialogItems = true
        this.cSave_items = true
        break;
      case 'add':
        if (!this.tempObject.items) this.tempObject.items = []
        let temp: any = _.cloneDeep(this.objectItems);
        this.tempObject.items.push(temp)
        this.dbService.UpdateStudentGroup(this.tempObject).subscribe((rs: any) => {
          this.Getlist()
          this.openDialogItems = false
          this.cSave_items = false
          this.notifi('success', 'Add Success!')
        });
        break;
      case 'save':
        this.dbService.UpdateStudentGroup(this.tempObject).subscribe((rs: any) => {
          this.Getlist()
          this.tempObject = {}
          this.openDialogItems = false
          this.cSave_items = false
          this.notifi('success', 'Save Success!')
        });
        break;
      case 'delete':
        if (confirm('Are you sure to delete ? ')) {         
          tempObject.items.splice(tempObject.items.indexOf(objectItems), 1);
          this.dbService.UpdateStudentGroup(tempObject).subscribe((rs: any) => {
            this.Getlist()
            this.notifi('success', 'Delete Success!')
          });
        }
        break;
      case 'cancel':
        this.tempObject = {}
        this.openDialogItems = false
        this.cSave_items = false
        break;
    }
  }
  ChangeDataStudent(ev) {
    const data = this.lsDataStudent.find(x => x._id === ev)
    if (data) {
      this.objectItems.studentCode = data.usercode
      this.objectItems.userFullName = data.fullname
      this.objectItems.courseName = data.course
      this.objectItems.courseId = data.courseId
    }
  }
  ChangeDataClass(ev) {
    const data = this.listClass.find(x => x._id === ev)
    if (data) {
      this.objectItems.className = data.name
    }
  }
  ChangeDataDepartment(ev) {
    const data = this.listDepartment.find(x => x._id === ev)
    if (data) {
      this.objectItems.departmentName = data.name
    }
  }
  // --------------
}
