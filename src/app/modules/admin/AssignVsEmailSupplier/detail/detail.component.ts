import { Component, OnChanges, Input, Output, EventEmitter, ViewEncapsulation, ViewChild } from "@angular/core";
import * as _ from "lodash";
import { AppFactory } from "app/shared/lib/common.service";
import { DbService } from "app/shared/connectData/db.service";
import * as $ from "jquery";
import { MatSnackBar } from "@angular/material/snack-bar";
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment as env } from 'environments/environment';
import { LocalStorageService } from 'angular-web-storage';
import { GridComponent } from '@syncfusion/ej2-angular-grids';
import { Observable, of } from 'rxjs';
@Component({  standalone: false,
  selector: "app-assign-vs-email-supplier-detail",
  templateUrl: "./detail.component.html",
  styleUrls: ["./detail.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AssignVsEmailSupplierDetailComponent implements OnChanges {
  public filterSettings: any = {
    caseSensitive: false,
    operator: "contains",
  };
  public notify(type, mes, milliseconds = 4000): void {
    this._snackBar.open(mes, type, {
      duration: milliseconds,
      panelClass: [type === 'error' ? 'red-snackbar' : 'blue-snackbar'],
      verticalPosition: 'top', horizontalPosition: 'center'
    })
  }
  @Input() idAssignVsEmails: any = ''
  @Input() isNewAssignVsEmails: boolean = false
  @Input() lsSupplier: any = []
  @Input() seviceTypes: any = []
  @Input() user: any = ''
  @Output() out = new EventEmitter();
  isEdit: boolean = false
  filter: any = {}
  minDate: any = new Date()
  AssignVsEmails: any = {}
  infoSupplier: any = {}
  @ViewChild('grid' , { static: true })
  public grid: GridComponent;
  filterGrid: any = { type: 'Excel' }
  initialSort: any = {
    columns: [
      { field: 'productCode', direction: 'Ascending' },
    ]
  }
  constructor(
    public afac: AppFactory,
    private http: HttpClient,
    private _snackBar: MatSnackBar,
    private dbService: DbService,
    private local: LocalStorageService,
  ) { }
  async ngOnChanges() {
    if (this.idAssignVsEmails) {
      this.isEdit = true
    } else {
      this.isEdit = false
      let AssignVsEmails = this.local.get('AssignVsEmails')
      if (AssignVsEmails) {
        this.AssignVsEmails = AssignVsEmails
      } else {
        this.AssignVsEmails = {
          isAssignVsEmails: true,
          nation: this.user.nation,
          currency: this.user.currency,
          createdDate: new Date(),
          strCreatedDate: this.afac.ConvertDateTimeToString(new Date(), "dd MMM, yyyy HH:mm"),
          createdBy: this.user.username,
          listTours: []
        }
        this.local.set('AssignVsEmails', this.AssignVsEmails)
      }
    }
    if (!this.AssignVsEmails.listTours)
      this.AssignVsEmails.listTours = this.AssignVsEmails.listTours || []
    this.lsBookingPicks = this.local.get('lsBookingPicks') || []
    if (this.isNewAssignVsEmails) {
      this.loadBookingClick()
    }
  }
  // async loadData(idAssignVsEmails) {
  //   this.AssignVsEmails = await this.dbService.GetOneAssignVsEmails({ idAssignVsEmails }).toPromise()
  // }
  popupEditValue: boolean = false;
  isViewValue: boolean = false;
  isReEdit: boolean = false;
  objectEditValue: any = {}
  popupValuePayment: boolean = false
  isEditValuePayment: boolean = false

  objectValuePayment: any = {}
  editOneService(action: any, value: any) {
    switch (action) {
      case "new":
        if (!this.AssignVsEmails.listTours) this.AssignVsEmails.listTours = []
        let dueDate = new Date();
        if (this.AssignVsEmails.listTours && this.AssignVsEmails.listTours.length) {
          let tempObject = this.AssignVsEmails.listTours[0];
          if (tempObject) dueDate = tempObject.dueDate || new Date()
        }
        // this.objectValuePayment = {
        //   _id: this.afac.ObjectId(),
        //   fullBookingName: '',
        //   begindate: new Date(),
        //   enddate: new Date(),
        //   dueDate: this.afac.localToUtc(dueDate),
        //   statusTicket: "Balance",
        //   amount: 0,
        //   quantity: 1,
        //   total: 0,
        //   invoice: ''
        // };
        this.popupValuePayment = true;
        this.isEditValuePayment = false
        break;
      case "edit":
        this.objectValuePayment = value
        this.isViewValue = false
        this.popupValuePayment = true;
        this.isEditValuePayment = true
        break;
      case "view":
        this.objectValuePayment = value
        this.isViewValue = true
        this.popupValuePayment = true;
        break;
      case "save":
        if (!value.idBooking) {
          alert('Booking is required')
          return
        }
        let temp = _.cloneDeep(value)
        if (!this.AssignVsEmails.listTours) this.AssignVsEmails.listTours = []
        this.AssignVsEmails.listTours.push(temp)
        this.local.set('AssignVsEmails', this.AssignVsEmails)
        this.popupValuePayment = false
        this.isEditValuePayment = false
        this.objectValuePayment = {}
        break;
      case "change":
        if (!value.idBooking) {
          alert('Booking is required')
          return
        }
        this.local.set('AssignVsEmails', this.AssignVsEmails)
        this.popupValuePayment = false
        this.isEditValuePayment = false
        this.objectValuePayment = {}
        break;
      case "close":
        this.popupValuePayment = false
        this.isEditValuePayment = false
        this.objectValuePayment = {}
        break;
      case "delete":
        if (confirm('Are you sure you want to delete this Booking?')) {
          this.AssignVsEmails.listTours.splice(this.AssignVsEmails.listTours.indexOf(value), 1);

          this.local.set('AssignVsEmails', this.AssignVsEmails)
        }
        break;
    }
  }
  Eraser() {
    if (confirm('Are you sure you want to "Clear Drafts"?')) {
      this.AssignVsEmails = {
        isAssignVsEmails: true,
        nation: this.user.nation,
        currency: this.user.currency,
        createdDate: new Date(),
        strCreatedDate: this.afac.ConvertDateTimeToString(new Date(), "dd MMM, yyyy HH:mm"),
        createdBy: this.user.username,
        listTours: []
      }
      this.local.remove('AssignVsEmails')
    }
    this.lsBookingPicks = this.local.get('lsBookingPicks') || []
  }
  // Upload file
  fileData_document: any = null;
  documentFileName: any = {};
  popupUploadFile: boolean = false;
  popupUploadFileMaster: boolean = false;
  AddFile(action: any, vl: any) {
    switch (action) {
      case "show":
        this.documentFileName = {}
        this.fileData_document = null;
        this.popupUploadFile = true
        this.popupUploadFileMaster = false
        break;
      case "showMaster":
        this.documentFileName = {}
        this.fileData_document = null;
        this.popupUploadFile = true
        this.popupUploadFileMaster = true
        break;
      case "delete":
        if (confirm("Are you sure to delete?")) {
          this.objectEditValue.files.splice(this.objectEditValue.files.indexOf(vl), 1);
        }
        break;
      case "deleteMaster":
        if (confirm("Are you sure to delete?")) {
          this.objectEditValue.files.splice(this.objectEditValue.files.indexOf(vl), 1);
          let param = {
            AssignVsEmails: this.AssignVsEmails,
            advanceBalancePayments: null
          }
          this.UpdateAssignVsEmails(param)
        }
        break;
    }
  }
  onSubmit() {
    if (this.fileData_document && this.fileData_document.name) {
      const formData = new FormData();
      // formData.append('formFile', this.fileData_document, this.fileData_document.name);
      formData.append('file', this.fileData_document);
      formData.append('key', `/documents/${this.fileData_document.name}`);
      this.http.post(env.syncFileManagerS3 + '/Files', formData, {
        reportProgress: true,
        observe: 'events'
      }).subscribe((events: any) => {
        if (events.type == HttpEventType.UploadProgress) {
          this.notify('warning', 'Upload progress: ' + Math.round(events.loaded / events.total * 100) + '%')
        } else if (events.type === HttpEventType.Response) {
          if (events.status === 200) {
            let rs: any = events.body
            this.fileData_document = null;
            if (!this.popupUploadFileMaster) {
              if (!this.objectEditValue.files) this.objectEditValue.files = []
              this.objectEditValue.files.push(
                {
                  name: this.documentFileName.name,
                  url: rs.fileUrl ?? ""
                }
              )
            } else {
              if (!this.AssignVsEmails.files) this.AssignVsEmails.files = []
              this.AssignVsEmails.files.push(
                {
                  name: this.documentFileName.name,
                  url: rs.fileUrl ?? ""
                }
              )
              if (this.isEdit) {
                let param = {
                  AssignVsEmails: this.AssignVsEmails,
                  advanceBalancePayments: null
                }
                this.UpdateAssignVsEmails(param)
              }
            }
            this.popupUploadFile = false;
            this.documentFileName = {}
            this.notify('success', 'Upload document successful')
          } else if (events.status === 409) {
            alert('The file already exists! are you sure to override it? ')
          }
        }
      })
    } else alert('Choose file')
  }
  fileProgressdocument(fileInput: any) {
    this.fileData_document = <File>fileInput.target.files[0];
    this.documentFileName.urlName = this.fileData_document.name;
  }
  async UpdateAssignVsEmails(object) {
    let param = {
      AssignVsEmails: object,
      advanceBalancePayments: null
    }
    // await this.dbService.UpdateAssignVsEmails(param).toPromise()
  }
  ListOptionService: string[] = [];
  valuesOptionService: any = []
  searchBookingAutocomplete(event: any) {
    const searchTerm = event ? event.toLowerCase() : '';
    if (searchTerm && searchTerm.length > 0) {
      // this.dbService
      //   .searchBookingAutocomplete({
      //     search: searchTerm,
      //     nation: this.user.nation
      //   })
      //   .subscribe((rs: any) => {
      //     if (rs && rs.length) {
      //       this.valuesOptionService = rs
      //       this.ListOptionService = rs.map(feat => feat.name);
      //     }
      //     else {
      //       this.valuesOptionService = []
      //       this.ListOptionService = [];
      //     }
      //   });
    } else {
      this.ListOptionService = [];
    }
  }
  onSelectBookingAutocomplete(name: string, vl: any) {
    let ob = this.valuesOptionService.find(x => x.name === name)
    if (ob) {
      vl.idBooking = ob.id
      vl.productCode = ob.productCode
      vl.bookingName = ob.bookingName
      vl.Currency = ob.Curency || ob.currency
      vl.nation = ob.nation
    } else {
      vl.idBooking = null
      vl.productCode = ""
      vl.bookingName = ""
      vl.Currency = ""
      vl.nation = ""
    }
  }
  lstDataService: any = []
  ObjectService: any = {}
  popupItemsBooking: boolean = false
  loadingItems: boolean = false
  editItems: boolean = false
  async FunctionItems(action: any = "", vl: any = null, editItems: boolean = false) {
    switch (action) {
      case "load":
        this.editItems = editItems
        this.popupItemsBooking = true
        this.loadingItems = true
        let obj = {
          bookingID: vl.idBooking,
          nation: vl.nation,
          currencyUser: this.user.currency,
          productCode: vl.productCode,
        }
        // const { items } = await this.dbService.AdvanceBalancePaymentAsync(obj).toPromise()
        this.ObjectService = vl
        this.lstDataService = []
        // if (this.lstDataService && this.ObjectService.listSerivce) {
        this.lstDataService = this.lstDataService.map(x => {
          let n = x?.Items_Calculator
          x.strbegindate = n?.strbegindate || ''
          x.strenddate = n?.strenddate || ''
          x.name = n?.name || ''
          x.NamePackge = n?.NamePackge || ''
          x.types = n?.types || ''
          x.location = n?.location || ''
          x.priceBuy = n?.priceBuy || ''
          x.supplierName = n?.infoService?.supplierName || ''
          x._idService = n?.infoService?.serviceSupplierId || ''
          let vl = this.ObjectService?.listSerivce?.find(y => y.Items_Calculator._id === x.Items_Calculator._id || y.Items_Calculator.IsItem === x.Items_Calculator.IsItem)
          if (vl) x.checkSelect = true
          if (x.checkbox) x.checkSelect = true
          return x
        })
        // }
        this.loadingItems = false
        if (this.AssignVsEmails._idService) {
          this.infoSupplier = this.lsSupplier.find((x) => x._idService === this.AssignVsEmails._idService);
          let lsHasSupplier = this.lstDataService.filter(x => x.supplierName === this.infoSupplier?.name)
          if (this.infoSupplier?.name && lsHasSupplier.length)
            this.filterGrid = {
              type: 'Excel',
              columns: [{
                field: 'supplierName', matchCase: false,
                operator: 'contains', predicate: 'and', value: this.infoSupplier?.name
              }]
            };
        }
        break;
    }
  }

  closePopupItemsBooking() {
    this.popupItemsBooking = !this.popupItemsBooking
    this.local.set('AssignVsEmails', this.AssignVsEmails)
  }
  DeleteService(vl) {
    if (confirm("Are you sure to delete this service?")) {
      let items = this.objectValuePayment.listSerivce
      items.splice(items.indexOf(vl), 1)
    }
  }
  ChangeServiceSupplier(ev) {
    this.AssignVsEmails._idService = ev
    this.infoSupplier = this.lsSupplier.find((x) => x._idService === this.AssignVsEmails._idService);
    this.local.set('AssignVsEmails', this.AssignVsEmails)
  }
  popupNotification: boolean = false
  tempValueNotification: any = {}
  checkValueSelect(evn, value) {
    evn = !evn
    if (evn) {
      if (value?.Items_Calculator?.lsAssignedService?.length) {
        this.tempValueNotification = value
        this.popupNotification = true
      }
      else {
        value.checkbox = evn
        this.SelectAction(evn, value)
      }
    } else {
      value.checkbox = evn
      this.SelectAction(evn, value)
    }
  }
  submitNotification(action: any, value: any) {
    if (action === 'yes') {
      this.SelectAction(true, value)
      this.tempValueNotification.checkbox = true
      this.popupNotification = false
    } else {
      this.SelectAction(false, value)
      this.tempValueNotification.checkbox = false
      this.popupNotification = false
    }
  }
  SelectAction(evn, value) {
    if (!this.ObjectService.listSerivce) this.ObjectService.listSerivce = []
    let vl = this.ObjectService.listSerivce.find(x => x.Items_Calculator._id === x.Items_Calculator._id || x.Items_Calculator.IsItem === x.Items_Calculator.IsItem)
    if (vl) {
      if (evn) {
        this.ObjectService.listSerivce.push(value)
      } else {
        let items = this.ObjectService.listSerivce
        items.splice(items.indexOf(vl), 1)
      }
    } else {
      if (evn) {
        this.ObjectService.listSerivce.push(value)
      }
    }
  }
  loadingApplyPayment: boolean = false
  information: any = {}
  getListDatesByRange(services) {
    return services?.map((e, i) => {
      return {
        isMainDay: true,
        strdate: e?.Items_Calculator.strbegindate,
        Date: e?.Items_Calculator.Date,
        isAllDay: true,
        From: "",
        To: "",
      }
    }) || [];
  }
  lstTourIds: any = []
  loadListSerivce() {
    return this.AssignVsEmails?.listTours?.flatMap(x => x.listSerivce && x.listSerivce.length > 0 ? x.listSerivce : []);
  }
  // async ActionAssign(lstData: any): Promise<Observable<any>> {
  //   let model: any = {}
  //   let tempObject: any = {
  //     logs: []
  //   }
  //   tempObject.logs.unshift({
  //     date: new Date(),
  //     text: "Created by",
  //     by: this.user.username,
  //   });
  //   let MultiServices: any = lstData
  //   let lsDates: any = this.getListDatesByRange(MultiServices)
  //   tempObject.status = "New";
  //   tempObject.assignedBy = this.user.username;
  //   tempObject.userCreate = this.user.username;
  //   tempObject.DateCreate = this.user.username;
  //   tempObject.totalAssigned = 0
  //   tempObject.serviceName = this.information.serviceName
  //   tempObject.serviceCode = this.information.serviceCode
  //   tempObject.SupplierId = this.information.SupplierId
  //   tempObject.SupplierObjectId = this.information.SupplierObjectId
  //   tempObject._idService = this.information._idService
  //   tempObject.phone = this.information.phone
  //   tempObject.email = this.information.email
  //   tempObject.languageGuide = this.information.languageGuide
  //   tempObject.Curency = this.user.currency;
  //   model.lstTours = []
  //   tempObject.lsDates = lsDates || [];
  //   if (MultiServices && MultiServices.length > 0)
  //     MultiServices.forEach(item => {
  //       if (item.selectedAssign) item.assignDone = true
  //       if (!model.lstTours) model.lstTours = []
  //       let obj = model.lstTours.find(x =>
  //         x.tourId === item._id &&
  //         x.itemService == item.Items_Calculator._id &&
  //         x.IsItem == item.Items_Calculator.IsItem
  //       )
  //       if (!obj)
  //         model.lstTours.push({
  //           tourId: item._id,
  //           idService: item.Items_Calculator._id,
  //           IsItem: item.Items_Calculator.IsItem
  //         })
  //     });
  //   model.nation = this.user.nation;
  //   model.Service = tempObject
  //   return await this.dbService.TaskAssignMultiService(model).toPromise()
  // }
  onChangeSupplierAss(ev) {
    const temp = this.lsSupplier.find(mx => mx._idService === ev);
    if (!temp) return {};

    const { name: serviceName, shortname: serviceCode, supplierID: SupplierId, _id: SupplierObjectId, _idService, ListService } = temp;
    const { phone, email, language = [] } = ListService ?? {};

    let objSupplier = {
      servicetypes: temp.servicetypes ?? [],
      location: ListService?.location ?? '',
      serviceName,
      serviceCode,
      SupplierId,
      SupplierObjectId,
      _idService,
      phone,
      email,
      languageGuide: language,
    };

    return objSupplier;
  }
  async SaveCompose() {
    // Kiểm tra các điều kiện cần thiết trước khi tiếp tục
    if (!this.validatePaymentDetails()) return;
    this.information = this.onChangeSupplierAss(this.AssignVsEmails._idService)
    this.loadingApplyPayment = true;
    let lsData = this.loadListSerivce()
    // await this.ActionAssign(lsData)
    this.AssignVsEmails.txtIdPayment = `TCCE${this.afac.ConvertDateTimeToString(new Date(), "ddMMyyyyHHmmss")}`;
    let param = { AssignVsEmails: this.AssignVsEmails };
    try {
      var rs =  {}/// await this.dbService.AddAssignVsEmails(param).toPromise();
      if (rs) {
        this.handleSuccessfulSave(rs);

      } else {
        this.notify('error', "Save failed");
      }
    } catch (error) {
      this.notify('error', "Save failed with error: " + error);
    } finally {
      this.loadingApplyPayment = false;
    }
  }
  // send Email Task
  _idAssign: any = ''
  FilterTaskService: any = {}
  ModalSendEmailTaskNew: boolean = false
  popupEmailToSupplier() {
    this.FilterTaskService = {
      nation: this.user.nation
    }
    let MultiServices = this.loadListSerivce()
    if (MultiServices && MultiServices.length > 0) {
      MultiServices.forEach(item => {
        this.lstTourIds.push(item._idCode || item._id)
      });
    }
    this.ModalSendEmailTaskNew = true
  }
  outSendEmailTask(event) {
    switch (event?.action) {
      case 'close':
        this.ModalSendEmailTaskNew = false
        break;
    }
  }
  // End send Email Task
  validatePaymentDetails() {
    if (!this.AssignVsEmails.namePayment) {
      alert('Name Payment is required');
      return false;
    }
    if (!this.AssignVsEmails._idService) {
      alert('Service Supplier is required');
      return false;
    }
    if (!this.AssignVsEmails.listTours?.length) {
      alert('List Booking is required');
      return false;
    }
    const ob = this.AssignVsEmails.listTours.find(x => !x.idBooking);
    if (ob) {
      alert('Booking is required');
      return false;
    }
    const obs = this.AssignVsEmails.listTours.filter(x => !x.listSerivce?.length);
    if (obs?.length) {
      const lts = obs.map(x => x.bookingName).join(', ');
      alert(`${lts}: Services are required`);
      return false;
    }
    return true;
  }

  handleSuccessfulSave(rs) {
    this.AssignVsEmails = rs;
    this.isEdit = true;
    this.local.remove('AssignVsEmails');
  }

  async UpdatePayment() {
    if (!this.AssignVsEmails.namePayment) {
      alert('Group Name is required')
      return
    }
    if (!this.AssignVsEmails._idService) {
      alert('Service Supplier is required')
      return
    }
    if (!this.AssignVsEmails.listTours?.length) {
      alert('List Booking is required')
      return
    }
    if (!this.AssignVsEmails.listTours?.length) {
      alert('List Booking is required')
      return
    }
    if (this.AssignVsEmails.listTours) {
      let ob = this.AssignVsEmails.listTours.find(x => !x.idBooking)
      if (ob) {
        alert('Booking is required')
        return
      }
    }
    this.AssignVsEmails.modifiedDate = new Date()
    this.AssignVsEmails.strModifiedDate = this.afac.ConvertDateTimeToString(this.AssignVsEmails.modifiedDate, "dd MMM, yyyy")
    this.AssignVsEmails.modifiedBy = this.user.username;
    let param = {
      AssignVsEmails: this.AssignVsEmails
    }
    var rs =  {}/// await this.dbService.UpdateAssignVsEmails(param).toPromise()
    if (rs) {
      this.local.remove('AssignVsEmails')
      this.out.emit(rs)
    }
    else this.notify('error', "save failed")
  }
  // 
  dateFormat: any = 'EEEE, dd MMMM yyyy'
  lsBookingPicks: any = [];
  ModalBookingPicks: boolean = false
  public loadBookingClick() {
    this.lsBookingPicks = this.local.get('lsBookingPicks') || []
    if (this.lsBookingPicks?.length > 0) {
      if (this.lsBookingPicks && this.lsBookingPicks.length > 0) {
        this.AssignVsEmails.listTours = []
        this.lsBookingPicks.forEach(x => {
          let vl: any = {}
          vl.idBooking = x._id
          vl.productCode = x.productCode
          vl.bookingName = x.bookingName
          vl.begindate = x.begindate
          vl.enddate = x.enddate
          vl.fullBookingName = `${x.productCode} - ${x.bookingName}`
          vl.nation = x.nation
          this.editOneService('save', vl)
        });
      }
      this.functionSelectedAll(true)
    }
  }
  public OpenBookingClick() {
    this.lsBookingPicks = this.local.get('lsBookingPicks') || []
    if (this.lsBookingPicks?.length > 0) {
      if (this.AssignVsEmails?.listTours.length) {
        this.lsBookingPicks.forEach(x => {
          x.selected = false
          let obj = this.AssignVsEmails?.listTours.find(y => y.idBooking === x._id);
          if (obj) {
            x.hadInList = true
          } else x.hadInList = false
        });
      } else {
        this.lsBookingPicks.forEach(x => {
          x.selected = false
          x.hadInList = false
        });
      }
      this.functionSelectedAll(true)
    }
    this.ModalBookingPicks = true;
  }
  ActionBookingPicks(action: any = '', vl: any = {}) {
    switch (action) {
      case 'delete':
        if (confirm("Are you sure to delete item?")) {
          this.lsBookingPicks.splice(this.lsBookingPicks.indexOf(vl), 1);
          this.local.set('lsBookingPicks', this.lsBookingPicks);
        }
        break;
      case 'deleteAll':
        if (confirm("Are you sure to delete all item?")) {
          this.lsBookingPicks = [];
          this.local.set('lsBookingPicks', this.lsBookingPicks);
        }
        break;
    }
  }
  selectedAll: boolean = false;
  functionSelectedAll(evn) {
    this.selectedAll = evn
    this.lsBookingPicks.forEach(x => {
      if (!x.hadInList)
        x.selected = evn
    });
  }
  PushBookingTolist() {
    let MultiServices = this.lsBookingPicks.filter(x => x.selected)
    if (!MultiServices || MultiServices.length === 0) {
      this.notifi("error", "Please select at least one service!", 7000)
      return;
    }
    this.lsBookingPicks.forEach(x => {
      if (x.selected) {
        let vl: any = {}
        vl.idBooking = x._id
        vl.productCode = x.productCode
        vl.bookingName = x.bookingName
        vl.begindate = x.begindate
        vl.enddate = x.enddate
        vl.fullBookingName = `${x.productCode} - ${x.bookingName}`
        vl.nation = x.nation
        this.editOneService('save', vl)
      }
    });
    this.local.set('lsBookingPicks', this.lsBookingPicks);
    this.ModalBookingPicks = false
    this.notifi("success", "push to list successfully!")
  }
  notifi(type, mes, miliseconds = 4000): void {
    this._snackBar.open(mes, type, {
      duration: miliseconds,
      panelClass: [type === 'error' ? 'red-snackbar' : 'blue-snackbar'],
      verticalPosition: 'top', horizontalPosition: 'center'
    })
  }
}
