import { Component, OnChanges, Input, Output, EventEmitter, ViewEncapsulation } from "@angular/core";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { environment as env } from "environments/environment";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppFactory } from "app/shared/lib/common.service";
import { DbService } from "app/shared/connectData/db.service";
import { cloneDeep } from "lodash";
import _ from "lodash";
@Component({  standalone: false,
  selector: "send-email-task-new",
  templateUrl: "./SendEmailTaskNew.component.html",
  styleUrls: ["./SendEmailTaskNew.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SendEmailTaskNewComponent implements OnChanges {
  public filterSettings: any = {
    caseSensitive: false,
    operator: "contains",
  };
  @Input() user: any = {};
  @Input() lstTourIds: any = [];
  @Input() _idService: any = {};
  @Input() _tourId: any = "";
  @Input() _hotelId: any = "";
  @Input() _idAssign: any = {};
  @Input() TaskService: any = {};
  @Input() lsSupplier: any = [];
  @Input() FilterTaskService: any = {};
  @Input() lsPassenger: any = [];
  @Input() lsOtherData: any = [];
  @Input() sendEmailToSupplier: boolean; 
  @Input() idBookingOrigin: any = '';
  @Input() itemSelect: any = [];


  VehicleTypeSelected: any[] = [];
  listServiceAddOn: any = [];
  ServiceDataAll: any = [];



  @Output() out = new EventEmitter<any>();
  loadingTask: boolean = true;
  serviceTask: any = [];
  // prettier-ignore
  public tools: any = {
    items: ['Bold', 'Italic', 'Underline', 'StrikeThrough', 'SuperScript', 'SubScript', '|',
      'FontName', 'FontSize', 'FontColor', 'BackgroundColor', '|',
      'LowerCase', 'UpperCase', '|',
      'Formats', 'Alignments', '|', 'NumberFormatList', 'BulletFormatList', '|',
      'Outdent', 'Indent', '|', 'CreateLink', 'Image', 'FileManager', 'Video', 'Audio', 'CreateTable', '|', 'FormatPainter', 'ClearFormat',
      '|', 'EmojiPicker', 'Print', '|',
      'SourceCode', 'FullScreen', '|', 'Undo', 'Redo']
  };
  supplierPortalUrL: any = env.supplierPortalUrL;
  popupSendEmail: boolean = false;
  lsEmails: any = [];
  lsContact: any = [];
  tokenId: any = "";
  Supplier: any = {};
  Subject: any = "";
  logEdit: any = {};
  lsTemplates: any = [];
  templateId: string = "";
  template: string = "";
  emailContentGen: string = "";
  emailContent: string = "";
  languageCode: string = "en";
  lsLanguageCodes: any = [];
  private paymentCutOffStatusUpdates: any[] = [];

  dictByLang: any = [];
  files: any = [];
  listSelectService: any = [];
  emailCC: string = "";
  showPriceToSupplier: boolean = true;
  showRoomingList: boolean = false;
  includeSignature: boolean = true;
  signature: string = "";
  isGenerating: boolean = false;
  constructor(
    public afac: AppFactory,
    private _snackBar: MatSnackBar,
    private dbService: DbService,
    private http: HttpClient,
  ) { }
  ngOnChanges(): void {
    try {
    //   if (!this.FilterTaskService) this.FilterTaskService = {};
    //   this.FilterTaskService._idService = this._idService;
    //   this.FilterTaskService._idAssign = this._idAssign;
    //   this.FilterTaskService.lstTourIds = this.lstTourIds || [];

    //   this.emailCC = this.user.email;
    //   this.signature = this.user.signature || "";
    //   this.logEdit = {
    //     comment: "",
    //     strDate: this.afac.ConvertDateTimeToString(new Date(), "dd MMM, yyyy HH:mm"),
    //     status: "Request by",
    //     author: this.user.username,
    //   };
    //   if (this.sendEmailToSupplier && this.idBookingOrigin) {
    //   this.loadRetailSalesSicData();
    // }
      // this.getData();
    } catch (err) {
      this.notifi("error", "Load data fail !", 7000);
      console.log("Load data fail!", err);
    }
  }
  
  addLog(vl) {
    let temp = cloneDeep(this.logEdit);
    temp.strDate = this.afac.ConvertDateTimeToString(new Date(), "dd MMM, yyyy HH:mm");
    vl.commentsSendEmailTask.items.push(temp);
  }
  // async refreshTemplates() {
  //   try {
  //     document.getElementById("btnRefresh")?.classList.add("rotate");
  //     await this.dbService
  //       .listTemplateEmailSupplierOPEByNation({ nation: this.user.nation })
  //       .toPromise()
  //       .then((res) => {
  //         if (res) this.lsTemplates = res?.filter((e) => e.types == "Service Operation");
  //       });
  //     setTimeout(() => {
  //       document.getElementById("btnRefresh")?.classList.remove("rotate");
  //     }, 1000);
  //   } catch (err) {
  //     this.notifi("error", "Could not connect to the server! Please try again later.");
  //   }
  // }

  async openSend() {
    
    this.lsContact = [];
    if (this.lsSupplier && this.lsSupplier.length) {
      let Supplier = this.lsSupplier.find((s) => s._idService == this._idService);
      if (Supplier) this.Supplier = cloneDeep(Supplier);
      else this.Supplier = {};
      console.log("Supplier", Supplier);
    }
   if (Array.isArray(this.Supplier.Contact)) {
      this.Supplier.Contact.forEach((e) => {
        if (e.email) {
          this.lsContact.push({
            nameCompany: `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`,
            email: e.email?.trim(),
            person: e.person,
            tel: e.tel,
            title: e.title,
            isSupplier: true,
          });
          this.Contacts.push({
            person: e.person,
            email: e.email.trim(),
          });
        }
      });
    }
    else {
    // Handle as single object
    const contact = this.Supplier.Contact;
    const isValidEmail = contact.email && 
                        contact.email.trim() !== '' && 
                        contact.email.toLowerCase() !== 'null' &&
                        contact.email.toLowerCase() !== 'no email provided' &&
                        contact.email.includes('@');
    
    if (isValidEmail) {
      this.lsContact.push({
        nameCompany: `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`,
        email: contact.email?.trim(),
        person: this.isValidContactField(contact.person) ? contact.person : '',
        tel: this.isValidContactField(contact.tel || contact.phone) ? (contact.tel || contact.phone) : '',
        title: this.isValidContactField(contact.title) ? contact.title : '',
        isSupplier: true,
      });
      this.Contacts.push({
        person: this.isValidContactField(contact.person) ? contact.person : '',
        email: contact.email.trim(),
      });
    }
  }

    let masterCode: any = "";
    masterCode = await this.afac.getMasterCode();

    this.tokenId =  '' //this.afac.ObjectId();
    let info = "";
    let count: number = 0;
    this.lsEmails = this.listSelectService.filter((x) => x.checkBox === true);
    if (this.lsEmails && this.lsEmails.length && this.lsEmails[0]) {
      let item = this.lsEmails[0];
      info += ` ${item.productCode || ""}`;
    }
      let obj = this.lsEmails[0];
    if (obj && obj.servicetypes !== "Hotel") {
      info += ` ${obj.assigned?.serviceName ? obj.assigned.serviceName || obj.taskName : ""}`;
    } else if (obj) {
      info += `${obj.assigned?.hotelName || ""} | ${obj.assigned?.hotelRoomCategory || ""}`;
    }
    this.Subject = `Booking: ${info}`;
    let now = new Date();
    this.Subject += ` (${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()})`;
    let assignedServiceIds = this.lsEmails.map((x) => x.assignedServiceId);
    // this.dbService.SendEmailTaskById({ assignedServiceId: assignedServiceIds }).subscribe((rs) => {
    //   if (!rs) {
    //     rs = [];
    //     this.notifi("error", "Something went wrong! Please contact admin or try again later.");
    //   }
    //   this.lsEmails.forEach((x) => {
    //     const obj = rs.find((r) => r.assignedServiceId === x.assignedServiceId);
    //     const isNew = !obj;
    //     const masterCodeValue = obj ? obj.masterCode : masterCode;
    //     const tokenIdValue = this.tokenId;
    //     const requestCodeValue = obj ? obj.requestCode : `${masterCode}-${++count}`;
    //     const commentsSendEmailTaskValue = {
    //       isNew,
    //       assignedServiceId: x.assignedServiceId,
    //       _id: isNew ? this.afac.ObjectId() : undefined,
    //       items: isNew ? [] : obj.commentsSendEmailTask.items,
    //     };

    //     // Gán giá trị mới cho x
    //     Object.assign(x, {
    //       masterCode: masterCodeValue,
    //       tokenId: tokenIdValue,
    //       requestCode: requestCodeValue,
    //       note: obj ? obj.note : x.note,
    //       commentsSendEmailTask: commentsSendEmailTaskValue,
    //       createDate: new Date(),
    //     });
    //   });
    // });
    this.popupSubmitSendmail = true;
    this.lsEmails.forEach((x) => {
      x.sendEmailTo = this.Contacts;
    });
  }


  // Helper function to validate contact fields
  private isValidContactField(value: any): boolean {
    if (!value) return false;
    
    const stringValue = value.toString().trim().toLowerCase();
    
    // List of invalid placeholder values
    const invalidValues = [
      '',
      'null',
      'undefined',
      'no email provided',
      'no phone provided',
      'no contact provided',
      'n/a',
      'na',
      'none'
    ];
    
    return !invalidValues.includes(stringValue);
  }
  SendEmailList(rs) {
    if (rs && rs.length > 0) {
      rs?.forEach((x) => {
        let val = x.Items_Calculator;
        if (val.lsAssignedService && val.lsAssignedService.length > 0) {
          let tmplsAssignedService = val.lsAssignedService.filter(
            (x) => x.status === "New" || x.status === "Amend" || x.status === "Cancelling"
          );
          if (tmplsAssignedService && tmplsAssignedService.length) val.lsAssignedService = tmplsAssignedService;
          let assignedService = val.lsAssignedService.find(
            (m) => m._id === this._idAssign || m._idService === this._idService
          );
          assignedService.type = this.getType(assignedService?.servicetypes);
          let servicetypes = this.getType(assignedService?.servicetypes);
          let reply_action = "Pending";
          if (assignedService.status === "New") {
            reply_action = "Pending";
          }
          if (assignedService.isCancel) {
            reply_action = "Amend";
          }
          if (assignedService.isAmend) {
            reply_action = "Cancelled";
          }
          let tempValue: any = {
            ...x.Items_Calculator,
            flights: x?.flights || [],
            checkBox: true,
            showPriceToSupplier: this.showPriceToSupplier,
            productCode: x.productCode,
            parentTourId: x.parentTourId || x._id,
            bookingName: x.bookingName,
            currency: x.Curency,
            taskName: val.name,
            NamePackge: val.NamePackge,
            tourId: x._id,
            IsItem: val.IsItem,
            taskId: val._id,
            roomcategory: val.roomCategory,
            strbegindate: val.strbegindate,
            strenddate: val.strenddate,
            language: x.language,
            languageName: x.languageName,
            servicetypes: servicetypes,
            note: "",
            listTypeBedSelect:
              val.listTypeBedSelect && val.listTypeBedSelect.length
                ? val.listTypeBedSelect.filter((ty) => ty.value)
                : [],
            reply_action: "Pending", // Pending , Confirmed, Amend, Cancelled
            assignedServiceId: assignedService._id,
            assigned: assignedService,
          };
          if (assignedService._idService && !assignedService.serviceName) {
            tempValue.checkBox = false;
            tempValue.disabled = true;
          } else {
            tempValue.checkBox = true;
            tempValue.disabled = false;
          }
          this.listSelectService.push(tempValue);
        }
      });
    }
  }
  checkContinue() {
    
     if (this.sendEmailToSupplier) {
    return false;
  }
    if (this.listSelectService.filter((x) => x.checkBox).length > 0) {
      return false;
    } else {
      return true;
    }
  }
  popupUploadFile: boolean = false;
  objectItem: any = {};
  AddFile(action: any, vl: any, objectItem: any = {}) {
    switch (action) {
      case "show":
        this.objectItem = objectItem;
        this.documentFileName = {};
        this.fileData_document = null;
        this.popupUploadFile = true;
        break;
      case "delete":
        if (confirm("Are you sure to delete?")) {
          this.files.splice(this.files.indexOf(vl), 1);
        }
        break;
    }
  }
  fileData_document: any = null;
  documentFileName: any = {};

  fileProgressdocument(fileInput: any) {
    this.fileData_document = <File>fileInput.target.files[0];
    this.documentFileName.name = this.fileData_document.name;
    this.documentFileName.urlName = this.fileData_document.name;
  }
  addEmail() {
    this.Contacts.push({
      person: "",
      email: "",
    });
  }
  removeEmail(index) {
    this.Contacts.splice(index, 1);
  }

  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  onSubmit() {
    if (this.fileData_document && this.fileData_document.name) {
      const formData = new FormData();
      // formData.append('formFile', this.fileData_document, this.fileData_document.name);
      formData.append("file", this.fileData_document);
      formData.append("key", `/contract_files/${this.fileData_document.name}`);
      this.http
        .post(env.syncFileManagerS3 + "/Files", formData, {
          reportProgress: true,
          observe: "events",
        })
        .subscribe((events: any) => {
          if (events.type == HttpEventType.UploadProgress) {
            this.notifi("warning", "Upload progress: " + Math.round((events.loaded / events.total) * 100) + "%");
          } else if (events.type === HttpEventType.Response) {
            if (events.status === 200) {
              let rs: any = events.body;
              this.fileData_document = null;
              // rs.fileUrl ?? ""
              if (!this.files) this.files = [];
              this.files.push({
                name: this.documentFileName.name,
                url: rs.fileUrl ?? "",
              });
              this.popupUploadFile = false;
              this.documentFileName = {};
              this.notifi("success", "Upload document successfull");
            } else if (events.status === 409) {
              alert("The file already exists! are you sure to override it? ");
            }
          }
        });
    } else alert("Choose file");
  }
  // end task
  notifi(type, mes, miliseconds = 4000, confirm = "OK"): void {
    this._snackBar.open(mes, confirm, {
      duration: miliseconds,
      panelClass: [type === "error" ? "red-snackbar" : "blue-snackbar"],
      verticalPosition: "top",
      horizontalPosition: "center",
    });
  }
  lstGuidesitinerary: any = [];
  // getlistsGuidesitinerary(id) {
  //   this.dbService.GetGuidesItineraryByTourId({ ids: [id] }).subscribe((rs) => {
  //     this.lstGuidesitinerary = rs;
  //   });
  // }
  popupGuidesitinerary: boolean = false;
  Guidesitineraryloading: boolean = false;
  objEmails: any = {};
  Guidesitinerary(x) {
    this.objEmails = x;
    this.popupGuidesitinerary = true;
    this.Guidesitineraryloading = true;
    // this.dbService.GetGuidesItineraryByTourId({ ids: [x.parentTourId || x.tourId] }).subscribe((rs) => {
    //   this.lstGuidesitinerary = rs || [];
    //   this.Guidesitineraryloading = false;
    // });
  }
  closeGuidesitinerary() {
    let ls = this.lstGuidesitinerary.filter((x) => x.check);
    if (ls.length) {
      this.objEmails.Guidesitinerary = "";
      ls.forEach((m) => {
        this.objEmails.Guidesitinerary += `
                      <p>  <a href="${env.guideItineraryUrL + m._id}"  target="_blank"> Open Link </a> | ${m.name || ""
          }, ${m.serviceName || ""}, ${m.email || ""},  ${m.phone || ""} </p>
                  `;
      });
    } else {
      this.objEmails.Guidesitinerary = "";
    }
    this.popupGuidesitinerary = false;
  }
  Contacts: any = [];
  ContactCC: any = [];
  popupSubmitSendmail: boolean = false;

  strViewEmail: any = "";
  popupPreviewEmail: boolean = false;

  previewEmailFinal() {
    this.strViewEmail = this.afac.safeHtml(this.emailContent + (this.includeSignature ? this.signature : ""));
    this.popupPreviewEmail = true;
  }
  cfText = "All the change you have made will be overrided! Do you want to continue?";
  async handleChangeLanguage(code = "") {
    // await this.dbService
    //   .GetDictionaryByLanguageCode({
    //     nation: this.user.nation,
    //     languageCode: code,
    //   })
    //   .toPromise()
    //   .then((res) => {
    //     this.dictByLang = [];
    //     if (res?.dictionarys) {
    //       for (const [key, content] of Object.entries(res?.dictionarys)) {
    //         this.dictByLang.push({ keyword: `[#${key}#]`, value: content });
    //       }
    //     }
    //   });
  }
  async handleChangeTemplate(templateId = "") {
    debugger
   }
  changeShowRoomingList(e) {
    !!this.templateId && this.generateData();
  }
  changeShowPriceToSupplier(e) {
    !!this.templateId && this.generateData();
  }
  changeShowSignature(e) {
    // !!this.templateId && this.generateData();
  }
  async generateData() {
    this.loadingTask = true;
    try {
      let isConfirm = false;
      if (this.emailContentGen != this.emailContent) {
        if (confirm(this.cfText)) isConfirm = true;
      } else isConfirm = true;
      if (isConfirm) {
        this.isGenerating = true;
        // await this.dbService
        //   .LoadViewTemplateEmailSupplier({
        //     emailId: this.templateId,
        //     languageCode: this.languageCode,
        //     nation: this.user.nation,
        //   })
        //   .toPromise()
        //   .then(
        //    async (res) => {
        //       this.templateContent = res?.content;
        //       this.templateSubject = res?.subject;
        //       this.emailContent = await this.mapDataToTemplate();
        //       this.isGenerating = false;
        //       this.loadingTask = false;
        //     },
        //     (error) => {
        //       this.isGenerating = false;
        //       this.loadingTask = false;
        //     }
        //   );
      }
    } catch (err) {
      this.isGenerating = false;
      this.loadingTask = false;
      console.log("error: ", err);
      this.notifi("error", "Something went wrong! Please try again later.");
    }
  }
  mapDataToTemplate1(template) {
    let listForMappingFinal: any = [];
    this.lsEmails.forEach((x, i) => {
      if (!!x.assigned.unit_sgl) {
        listForMappingFinal.push({ ...x, isShare: false });
      }
      if (!!x.assigned.unit) {
        listForMappingFinal.push({ ...x, isShare: true });
      }
    });

    let lsDataMapping = listForMappingFinal.map((x) => {
      let obj: any = {};
      
      return obj;
    });

    let data = template;
    let listTables = data.split("<table");
    const regex = /{{([A-Za-z]+)_([A-Za-z]+)}}/g;
    data = listTables.reduce((fullContent, part, i) => {
      if (i == 0) return part;
      let objName = part.match(regex)[0]?.replace(/{{|}}/, "")?.split("_")[0] || "service";
      return (
        fullContent +
        this.populateTable(
          `<table${part}`,
          objName != "service" && objName != "lsPassenger"
            ? lsDataMapping[0].listTypeBedSelect?.filter((e) => !!e.value)
            : objName == "lsPassenger"
              ? this.TaskService.lsPassenger || this.lsPassenger
              : lsDataMapping,
          objName
        )
      );
    }, "");
    data = this.populateContent(data);
    // now double check if all the words are translated
    for (let i = 0; i < this.dictByLang.length; i++) {
      const dict = this.dictByLang[i];
      if (data.indexOf("[#") >= 0 && data.indexOf("#]") > 0) {
        data = data.replaceAll(dict.keyword, dict.value);
      } else break;
    }
    this.emailContentGen = data;

    return data;
  }
  populateTable(template: string, dataList: any[] = [], objectName: string = "service") {
    let existMapper = false;
    if (objectName === "lsPassenger")
      dataList = dataList.map((e, i) => ({
        ...e,
        index: i + 1,
        fullName: `${e.firstName} ${e.middleName} ${e.lastName}`.replaceAll("  ", " ").trim(),
        validity: e.validity || "",
        dob: e.dob || "",
        roomtype: "",
      }));
    else dataList = dataList.map((e, i) => ({ ...e, index: i + 1 }));

    if (dataList && dataList.length) {
      for (const key in dataList[0])
        if (Object.prototype.hasOwnProperty.call(dataList[0], key))
          if (template.toLowerCase().indexOf(`{{${objectName}_${key}}}`.toLowerCase()) >= 0) {
            existMapper = true;
            break;
          }
    }
    if (existMapper) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(template, "text/html");

      const table = doc.querySelector("table");
      if (!table) return "Invalid template: No table found";

      const tbody = table.querySelector("tbody");
      if (!tbody) return "No tbody found in the table";

      const afterTable = template.split("</table>")[1] || "";

      const rowTemplates = tbody.querySelectorAll("tr");
      tbody.innerHTML = ""; // Clear existing rows

      if (rowTemplates.length > 0) {
        dataList.forEach((data) => {
          rowTemplates.forEach((row) => {
            const newRow = document.createElement("tr");
            newRow.innerHTML = row.innerHTML;
            for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                const regex = new RegExp(`{{${objectName}_${key}}}`, "gi");
                newRow.innerHTML = newRow.innerHTML.replaceAll(regex, data[key]);
              }
              tbody.appendChild(newRow);
            }
          });
        });
      }

      return table.outerHTML + afterTable;
    }
    return template;
  }
  // populateContent(template: string) {
  //   let attachment = "";
  //   if (this.files && this.files.length) {
  //     if (this.files && this.files.length) {
  //       this.files.forEach((f) => {
  //         attachment += `
  //             <a href="${f.url}"  target="_blank"> Open Attached file </a> | ${f.name || "Attach file"} <br>
  //           `;
  //       });
  //     }
  //   }
  //   let populatedContent = template;
  //   let TourIdForPaxmanifrest = ""; // parentTourId
  //   if (this.listSelectService[0]?.parentTourId) {
  //     TourIdForPaxmanifrest = this.listSelectService[0]?.parentTourId;
  //   } else {
  //     TourIdForPaxmanifrest = this.listSelectService[0]?.tourId;
  //   }
  //   const obj = {
  //     supplier: `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`,
  //     Requester:
  //       this.Contacts[0]?.person ||
  //       `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`,
  //     Email: this.Contacts[0]?.email?.trim(),
  //     DeadlineDate: "",
  //     BookingCode: this.listSelectService[0]?.productCode,
  //     BookingName: this.listSelectService[0]?.bookingName,
  //     NoOfGuests: this.listSelectService[0]?.noOfguests || this.lsPassenger?.length || this.TaskService?.ld_qty,
  //     GuestName: this.listSelectService[0]?.guestName,
  //     Nationality: this.listSelectService[0]?.nationality,
  //     Adults: this.TaskService.Adults || this.lsEmails[0]?.assigned?.unit || 0,
  //     Children: this.TaskService.Children || this.lsEmails[0]?.assigned?.childPrices?.length || 0,
  //     hotelRoomCategory: this.listSelectService[0].assigned.hotelRoomCategory,
  //     unit: this.listSelectService[0].assigned.unit,
  //     BeginDate: this.listSelectService[0]?.strbegindate,
  //     EndDate: this.listSelectService[0]?.strenddate,
  //     Currency: this.user.currency,
  //     RequestStatus: "",
  //     attachment: attachment,
  //   };
  //   for (const key in obj) {
  //     if (Object.prototype.hasOwnProperty.call(obj, key)) {
  //       if (populatedContent.indexOf(`{{${key}}}`) >= 0) {
  //         const regex = new RegExp(`{{${key}}}`, "g");
  //         populatedContent = populatedContent.replaceAll(regex, obj[key] ?? "");
  //       }
  //     }
  //   }
  //   return this.populateUrls(populatedContent, TourIdForPaxmanifrest);
  // }

   populateContent(content: string, extraData: any = {}) {
    let attachment = "";
    if (this.files && this.files.length) {
      if (this.files && this.files.length) {
        this.files.forEach((f) => {
          attachment += `
              <a href="${f.url}"  target="_blank"> Open Attached file </a> | ${f.name || "Attach file"} <br>
            `;
        });
      }
    }
    let populatedContent = content;
    let TourIdForPaxmanifrest = ""; // parentTourId
    let ServiceMain = this.listSelectService[0];
    if (ServiceMain?.parentTourId) {
      TourIdForPaxmanifrest = ServiceMain?.parentTourId;
    } else {
      TourIdForPaxmanifrest = ServiceMain?.tourId;
    }
    let nationalities = ``;
    let lsAccomName = [...new Set(this.listAccom?.map((e) => e.name) || []).values()];
   if (ServiceMain?.nationalities && ServiceMain.nationalities.length) {
  nationalities = ServiceMain?.nationalities
    ?.filter((x) => x.nationality)
    ?.map((n) => n.nationality || "")
    ?.join(", ");
} else if (ServiceMain?.lsPassenger) {
  nationalities = ServiceMain?.lsPassenger
    ?.filter((x) => x.nationality)
    ?.map((p) => p.nationality || "")
    ?.join(", ");
}
    let PaxNameFrist = "";
    if (ServiceMain?.lsPassenger && ServiceMain?.lsPassenger.length) {
      let e = ServiceMain?.lsPassenger[0];
      PaxNameFrist = `${e?.firstName} ${e?.middleName} ${e?.lastName}`.replace(/\s+/g, " ").trim();
    }
    let summaryGeneral = this.listSelectService?.map((x) => x.summaryGeneral)?.join(", ");
    let nameSupplier = this.Supplier?.name;
 
      nameSupplier = `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`;

    try {

      const obj = {
        // ${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""}
        supplier: `${nameSupplier ?? ""}`,
        Requester:
          this.Contacts[0]?.person ||
          `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`,
        Email: this.Contacts[0]?.email?.trim(),
        DeadlineDate: "",
        PaxNameFrist: PaxNameFrist,
        BookingCode: ServiceMain?.productCode,
        market: ServiceMain?.market?.join(", ") ?? "",
        Nationality: nationalities,
        accommodationName: lsAccomName?.join(", ") ?? "",
        BookingName: ServiceMain?.bookingName,
        summaryGeneral: summaryGeneral,
        NoOfGuests: ServiceMain?.lsPassenger?.length || (this.TaskService?.ld_qty ?? 0),
        GuestName: ServiceMain?.guestName,
        Adults: this.TaskService.Adults || this.lsEmails[0]?.assigned?.unit || 0,
        Children: this.TaskService.Children || this.lsEmails[0]?.assigned?.childPrices?.length || 0,
        hotelRoomCategory: ServiceMain?.assigned?.hotelRoomCategory,
        strBedType: this.getBedTypes(extraData.listTypeBedSelect),
        unit: ServiceMain?.assigned?.unit,
        BeginDate: ServiceMain?.strbegindate,
        EndDate: ServiceMain?.strenddate,
        Currency: this.user.currency,
        attachment: attachment,

         CutoffTable: this.sendEmailToSupplier 
        ? this.generateHotelTable1()
        : (Array.isArray(this.paymentCutOffStatusUpdates) && this.paymentCutOffStatusUpdates.length > 0
          ? this.getFormattedStatusUpdatesTable(this.paymentCutOffStatusUpdates)
          : '<p>No payment cut-off status updates available</p>'),

        RequestStatus: "",
        ...extraData,
      };
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (populatedContent.indexOf(`{{${key}}}`) >= 0) {
            const regex = new RegExp(`{{${key}}}`, "g");
            populatedContent = populatedContent.replace(regex, obj[key] ?? "");
          }
        }
      }

    } catch (error) {

    }



    return this.removeUnverifiedVariables(this.populateUrls(populatedContent, TourIdForPaxmanifrest));
  }
  populateUrls(template: string, TourIdForPaxmanifrest: any = "") {
    const urls = [
      {
        key: "clickheretoreply",
        url: `${env.supplierPortalUrL}/supplier?token=${this.tokenId}`,
      },
      {
        key: "paxmanifest",
        url: `${env.supplierPortalUrL}/pax-manifest?id=${TourIdForPaxmanifrest}&htid=${this._hotelId}&supplier=${this.Supplier.supplierID}`,
      },
    ];

    let replaced = template;
    urls.map((item) => {
      const link = document.createElement("a");
      link.href = item.url;
      link.innerText = `[#${item.key}#]`;
      replaced = replaced.replaceAll(`##${item.key}##`, link.outerHTML);
    });
    return replaced;
  }

  populateActtachFiles() {
    const attachContainer = document.createElement("p");
    this.files?.map((file) => {
      const link = document.createElement("a");
      link.href = file.url;
      link.innerText = file.name;
      attachContainer.appendChild(link);
    });
    return attachContainer.outerHTML;
  }
  closeEmail() {
    this.out.emit({ action: "close" });
  }
  handleSendEmail(action: any) {
    let obj: any = {
      // serviceSupplierId: this._idService,
      lsItems: this.serviceTask.map((e) => e?.IsItem) || [],
      tourId: this.serviceTask[0]?.parentTourId,
      serviceIds: this.serviceTask.map((e) => e._id),
      languageCode: this.languageCode,
      nation: this.user.nation,
      tokenId: this.tokenId,
      emailId: this.templateId,
      contentForSupplier: this.includeSignature ? this.emailContent + this.signature : this.emailContent,
      contentEmailForSupplier: this.includeSignature ? this.emailContent + this.signature : this.emailContent,
      subject: this.Subject,
      sendEmailTo: this.Contacts || [],
      sendEmailCC:
        this.emailCC?.split(/[,;]/).filter(e => e.trim()).map((e) => {
          return {
            person: e.split("@")[0]?.trim() || "",
            email: e.trim(),
          };
        }) || [],
      senderName: this.user.fullname,
      emailSender: this.user.email?.trim(),
      receiver: "",
      masterCode: "",
      supplierName: `${this.Supplier.serviceName ? this.Supplier.serviceName + " - " : ""} ${this.Supplier?.name}`,
      supplierEmail: this.Contacts[0]?.email?.trim() || "",
      summitBy: this.user?.name || this.user.fullname,
      isSubmitDone: true,
      submitDate: new Date(),
      createDate: new Date(),
      summitBySupplier: "",
      summitAction: "",
      createDateSupplier: new Date(),
      submitDateSupplier: new Date(),
      isSubmitDoneSupplier: false,
      files: this.files,
    };
    switch (action) {
      case "submit":
        const { contentForSupplier, contentEmailForSupplier } = obj;
        this.lsEmails.forEach((Ex) => {
          Ex.contentForSupplier = contentForSupplier;
          Ex.contentEmailForSupplier = contentEmailForSupplier;
        });
        // this.dbService
        //   .SaveSendEmailTask({
        //     sendEmailInfo: obj,
        //     assignedServiceIds: this.lsEmails,
        //     sendEmailToSupplier: this.sendEmailToSupplier
        //   })
        //   .subscribe((x) => {
        //     if (x) {
        //       const Emails: any = [];
        //       this.Contacts.forEach((ct) => {
        //         let lstCCEmail = this.emailCC
        //           ?.split(/[,;]/)
        //           .filter((e) => !!e?.trim() && e.trim() != ct.email?.trim())
        //           .map((e) => {
        //             return e.trim();
        //           })
        //         lstCCEmail = lstCCEmail.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        //         Emails.push({
        //           emailType: "Operation",
        //           nation: this.user.nation,
        //           Email: ct.email?.trim(),
        //           Subject: this.Subject,
        //           Content: contentEmailForSupplier,
        //           CcEmails: lstCCEmail,
        //         });
        //       });
        //       this.dbService.notifyApiUrl(Emails).subscribe((rs) => {
        //         if (rs) {
        //           this.out.emit({ action: "out", serviceId: this._idService });
        //           this.notifi("success", "Send Email successfully");
        //         }
        //       });
        //     } else this.notifi("error", "Failed to send email", 7000);
        //   });
        break;
      case "close":
        this.popupSubmitSendmail = false;
        break;
    }
  }
  getType(serviceType): "Hotel" | "Vehicle" | "Restaurant" | "General" | "Guide" {
    if (this.isAcc(serviceType)) return "Hotel";
    else if (
      serviceType === "Transfer" ||
      serviceType === "Vehicle" ||
      serviceType === "Land Transportation" ||
      serviceType === "Transportation" ||
      serviceType === "Speed Boat"
    )
      return "Vehicle";
    else if (serviceType === "Restaurant") return "Restaurant";
    else if (serviceType === "Guide") return "Guide";
    else return "General";
  }
  isAcc(type: string) {
    // service.types
    return type === "Accommodation" || type === "Cruise" || type === "Hotel";
  }
  validate(value: string, type: string = "email") {
    switch (type) {
      case "email":
        return value.match(/^[^\s@]+@[^\s@]+\.[^\s@,;]+$/);
        break;
      default:
        return true;
    }
  }
  templateSubject: any = "";
  @Input() listAgency: any = [];
  templateContent: any = "";



    renderSubject() {
    let info = "";
    this.lsEmails = this.listSelectService.filter((x) => x.checkBox === true && !x.isAddOn);

    let item = this.lsEmails && this.lsEmails.length && this.lsEmails[0] ? this.lsEmails[0] : {};
    if (this.lsEmails && this.lsEmails.length && this.lsEmails[0]) {
      info += `${item.productCode || ""} - `;
      //  ${item.bookingName}
    }
    // let emailSaler = [...new Set(this.lsEmails.map((x) => x.emailSaler).filter(Boolean))];
    // this.emailCC = [...new Set([...emailSaler, this.user.email])].join(", ");
   let obj = this.lsEmails[0];
if (obj && obj.servicetypes !== "Hotel") {
  info += ` ${obj.taskName || ""}`;
} else if (obj) {
  info += `${obj.assigned?.hotelName || ""}`;
}
    this.Subject = `Booking: ${info}`.replace(/\s+/g, " ");
    if (this.templateSubject) {
      if (item.ageny && item.ageny.length) {
        let strAgency = this.listAgency
          .filter((x) => item.ageny.includes(x.md5code))
          .map((x) => x.name)
          .join(", ");
        item.agencyName = strAgency ?? "";
      }
      // let travelPeriod = this.formatTravelPeriod(item);
      // let travelPeriodOnlyMonth = this.formatTravelPeriodOnlyMonth(item);

      let travelPeriod = "";
      let travelPeriodOnlyMonth = "";

      let hotelName = item?.assigned?.hotelName ?? item.name;
      let ServiceName = item?.assigned?.serviceName ?? item.name;
      const placeholders = {
        "{{hotelName}}": hotelName ?? "",
        "{{ServiceName}}": ServiceName ?? "",
        "{{travelPeriod}}": travelPeriod ?? "",
        "{{travelPeriodOnlyMonth}}": travelPeriodOnlyMonth ?? "",
        "{{bookingCode}}": item.productCode ?? "",
        "{{BookingCode}}": item.productCode ?? "",
        "{{bookingName}}": item.bookingName ?? "",
        "{{BookingName}}": item.bookingName ?? "",
        "{{agencyName}}": item.agencyName ?? "",
        "{{AgencyName}}": item.agencyName ?? "",
        "{{supplierName}}": this.Supplier.name ?? "",
        "{{SupplierName}}": this.Supplier.name ?? "",
        "{{market}}": item.market?.join(", ") ?? "",
        "{{Market}}": item.market?.join(", ") ?? "",
      };
      this.Subject = this.templateSubject.replace(/{{[\w]+}}/gi, (match) =>
        placeholders[match] !== undefined ? placeholders[match] : match
      );
    }
  }
  listAccom: any[] = [];

   generateContent(content: string, lsDataMapping: any[], extraData: any = {}) {
    const regex = /{{([\w]+)_([\w]+)}}/gi;

    // Parse HTML safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const tables = doc.querySelectorAll("table");

    tables.forEach((table) => {
      this.listAccom = [];
      const match = table.innerHTML.match(regex)?.[0];
      const objName = match?.replace(/{{|}}/g, "").split("_")[0] || "service";

      let tableData;
      switch (objName) {
        case "service":
          tableData = lsDataMapping;
          break;
        case "lsPassenger":
          tableData = extraData?.lsPassenger || this.lsPassenger || this.TaskService?.lsPassenger || [];
          break;
        default:
          tableData = (lsDataMapping || [])
            .flatMap((x) => x.listTypeBedSelect || [])
            .reduce((acc, curr) => {
              const index = acc.findIndex((item) => item.name === curr.name);
              if (index !== -1) acc[index].value += curr.value;
              else acc.push({ ...curr });
              return acc;
            }, []);

          // Optional tour leader field
          if (tableData.tourLeader) {
            tableData.push({ value: tableData.tourLeader, name: "Tour Leader" });
          }
      }

      // Replace current table with populated one
      const filled = this.populateTableRows(table.outerHTML, tableData, objName);
      table.outerHTML = filled;
    });

    return this.populateContent(doc.body.innerHTML, extraData) ?? "";
  }
  StatementSelected: any = "";

  
  AllotmentSelected: any = "";

   populatePaxmanifestUrls(template: string, tourId: any = "", _hotelId, supplierID) {
    const urls = [
      {
        key: "clickheretoreply",
        url: `${env.supplierPortalUrL}/supplier?token=${this.tokenId}`,
      },
      {
        key: "paxmanifest",
        url: `${env.supplierPortalUrL}/pax-manifest?id=${tourId}&htid=${_hotelId}&supplier=${supplierID ?? ""}`,
      },
    ];

    let replaced = template;
    urls.map((item) => {
      const link = document.createElement("a");
      link.href = item.url;
      link.innerText = `[#${item.key}#]`;
      replaced = replaced.replaceAll(`##${item.key}##`, link.outerHTML);
    });

    return replaced;
  }

   translateContent(data: string, dictByLang: any = []) {
    for (let i = 0; i < dictByLang.length; i++) {
      if (data.indexOf("[#") >= 0 && data.indexOf("#]") > 0) {
        data = data.replaceAll(dictByLang[i].keyword, dictByLang[i].value);
      } else break;
    }
    return data;
  }

    populateTableRows(content: string, dataList: any[] = [], objectName: string = "service") {
    let existMapper = false;
    if (objectName === "lsPassenger")
      dataList = dataList.map((e, i) => ({
        ...e,
        index: i + 1,
        fullName: `${e.firstName} ${e.middleName} ${e.lastName}`.replaceAll("  ", " ").trim(),
        validity: e.validity || "",
        dob: e.dob || "",
        roomtype: "",
      }));
    else dataList = dataList.map((e, i) => ({ ...e, index: i + 1 }));

    if (dataList && dataList.length) {
      for (const key in dataList[0])
        if (Object.prototype.hasOwnProperty.call(dataList[0], key))
          if (content.toLowerCase().indexOf(`{{${objectName}_${key}}}`.toLowerCase()) >= 0) {
            existMapper = true;
            break;
          }
    }

    if (!existMapper) return content;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    const table = doc.querySelector("table");
    if (!table) return "Invalid template: No table found";

    const tbody = table.querySelector("tbody");
    if (!tbody) return "No tbody found in the table";

    const afterTable = content.split("</table>")[1] || "";

    const rowTemplates = tbody?.querySelectorAll("tr");
    tbody.innerHTML = ""; // Clear existing rows

    if (rowTemplates.length > 0) {
      dataList.forEach((data) => {
        // Find accommodation for the current day
        let accom: any = {};
        let flightInfo: any = null;
        let serviceGuideInfo = {
          serviceGuideName: "",
          serviceGuidePhone: "",
        };
        // Check if we have listSelectService data
        if (this.listServiceAddOn && this.listServiceAddOn.length > 0) {
          // Get the current service date for comparison
          let ValaueServiceDate: any = data.strbegindate || data.begindate;
          // First check if the current service has guide information

          // Find guide service by filtering for type "Guide" in listServiceAddOn
          let guideService: any = null;

          // Find guide service for the same day
          guideService = this.listServiceAddOn.find((service) => {
            // Check if it's a guide service
            const isGuideService = service.Items_Calculator && service.Items_Calculator.types === "Guide";
            if (!isGuideService) return false;
            // Check if it's for the same day
            const guideServiceDate = service.Items_Calculator?.strbegindate || service.Items_Calculator?.begindate;

            return this.isSameDay(ValaueServiceDate, guideServiceDate);
          });
          // If guide service found, use its information
          if (guideService) {
            // Check if guide service has lsAssignedService
            if (
              guideService.Items_Calculator &&
              guideService.Items_Calculator.lsAssignedService &&
              guideService.Items_Calculator.lsAssignedService.length > 0
            ) {
              // Find assigned service with status not "New"
              const validAssignedService = guideService.Items_Calculator.lsAssignedService.find(
                (service) => service.status && service.status !== "New"
              );

              if (validAssignedService) {
                // Use information from the valid assigned service
                serviceGuideInfo.serviceGuideName = validAssignedService.serviceName || "";
                serviceGuideInfo.serviceGuidePhone = validAssignedService.phone || "";
              } else {
                // If no valid assigned service found, use the guide service info
                serviceGuideInfo.serviceGuideName =
                  guideService.Items_Calculator.serviceName || guideService.serviceName || "";
                serviceGuideInfo.serviceGuidePhone = guideService.Items_Calculator.phone || guideService.phone || "";
              }
            } else {
              // If no lsAssignedService, use the guide service info
              serviceGuideInfo.serviceGuideName = guideService.Items_Calculator.name || guideService.name || "";
              serviceGuideInfo.serviceGuidePhone = "";
            }
          }

          if (this.listServiceAddOn.length > 0) {
            // Accommodation service lookup
            const accomService = this.listServiceAddOn
              .filter((e) => e.Items_Calculator && e.Items_Calculator.PriceType === "ACCOMMODATIONFEE")
              .find((e) => {
                const accomBeginDate = e.Items_Calculator.strbegindate || e.Items_Calculator.begindate;
                const accomEndDate = e.Items_Calculator.strenddate || e.Items_Calculator.enddate;

                // If there's an end date, check if serviceDate is within the range
                if (accomEndDate) {
                  return this.isDateInRange(ValaueServiceDate, accomBeginDate, accomEndDate);
                }

                // If no end date, just check the start date
                return this.isSameDay(ValaueServiceDate, accomBeginDate);
              });
            const FilerLandTransportation = ["Land Transportation", "Vehicle", "Transportation", "Transfer"];
            let Vehicle = this.ServiceDataAll.filter(
              (e) => e.Items_Calculator && FilerLandTransportation.includes(e.Items_Calculator.types)
            ).find((e) => {
              const accomBeginDate = e.Items_Calculator.strbegindate || e.Items_Calculator.begindate;
              return this.isSameDay(ValaueServiceDate, accomBeginDate);
            });
            if (Vehicle) {
              let vl = Vehicle.Items_Calculator;
              if (!data.PickUpPoint) {
                data.PickUpPoint = vl?.PickupPoint ?? "";
              }
              if (!data.DropOffPoint) {
                data.DropOffPoint = vl?.DropOffPoint ?? "";
              }
            }
            // Find the accommodation service if it exists
            if (accomService) {
              accom = { ...accomService, ...accomService.Items_Calculator };
              this.listAccom.push(accom);
              // Only set pickup point if it doesn't already exist
              if (!data.PickUpPoint || !data.DropOffPoint) {
                if (!data.PickUpPoint) {
                  data.PickUpPoint = accom.name || "";
                }

                // Only set dropoff point if it doesn't already exist
                if (!data.DropOffPoint) {
                  data.DropOffPoint = accom.name || "";
                }
              }
            }
            // Find flight information in the current service's groupServices
            const flightService = this.listServiceAddOn
              .filter((e) => e.Items_Calculator && e.Items_Calculator.types === "Flight")
              .find((e) => {
                const flightBeginDate = e.Items_Calculator.strbegindate || e.Items_Calculator.begindate;
                const flightEndDate = e.Items_Calculator.strenddate || e.Items_Calculator.enddate;

                // Nếu có ngày kết thúc, kiểm tra xem serviceDate có nằm trong khoảng không
                if (flightEndDate) {
                  return this.isDateInRange(ValaueServiceDate, flightBeginDate, flightEndDate);
                }

                // Nếu không có ngày kết thúc, chỉ kiểm tra ngày bắt đầu
                return this.isSameDay(ValaueServiceDate, flightBeginDate);
              });

            // Find the flight service index if it exists
            if (flightService) {
              flightInfo = { ...flightService, ...flightService.Items_Calculator };
            }
          }
        }
        let flightConnectionsString = "";
        // Process flight connections if available
        let flightDetails = {
          flightNumbers: "",
          airlines: "",
          routes: "",
          times: "",
          classes: "",
          luggageAllowance: "",
          Flight: "",
        };

        if (flightInfo && flightInfo.Connection && flightInfo.Connection.length > 0) {
          const connectionFlights = this.Flights(flightInfo.Connection);
          if (connectionFlights.length > 0) {
            // Create individual properties for backward compatibility
           

            // Add a new formatted string property that combines all flight information
            flightConnectionsString = connectionFlights
              .map((flight) => {
                let parts: any = [];
                // if (flight.airlines) parts.push(flight.airlines);
                if (flight.flightNumber) parts.push(flight.flightNumber);
                if (flight.route) parts.push(flight.route);
                // if (flight.times) parts.push(flight.times);
                return parts.join(" | ");
              })
              .join("<br>");
          } else {
            data.PickUpPoint = accom?.name || "";
            data.DropOffPoint = accom?.name || "";
          }
        }

        // let item = data?.Items_Calculator;
        data = {
          ...data,
          ...data?.Items_Calculator,
          // Flight information
          serviceGuideName: serviceGuideInfo?.serviceGuideName ?? "",
          serviceGuidePhone: serviceGuideInfo?.serviceGuidePhone ?? "",
          flightDetails: flightConnectionsString ?? "",
          supplierName: data?.infoService?.supplier || "",
          Note: data?.Note || data?.note || "",
          menuType: data?.restaurantMenu || "",
          bookingStatus: data?.status || "",
          vehicles:
            data?.vehicles
              ?.map((p, idx) => {
                return `${idx + 1}. [#driver#]: ${p?.driverName} - ${p?.driverPhone}, [#guide#]: ${p?.guideName} - ${p?.guidePhone
                  };`;
              })
              ?.join("<br>") || "",
          accommodationName: accom?.name || "",
          accommodationAddress: accom?.location || "",
          accommodationstatus: accom?.status || "",
        };

        rowTemplates.forEach((row) => {
          const newRow = document.createElement("tr");
          newRow.innerHTML = row.innerHTML;
          // check if there is any child template inside a cell
          const lstRenderByTemplateInCell = newRow.innerHTML.split("[:") || [];
          if (lstRenderByTemplateInCell.length > 1) {
            if (!!data) {
              let mergedContent = lstRenderByTemplateInCell[0]?.split("<p>")[0];
              let nextAfterContents: any = [`<p>${lstRenderByTemplateInCell[0]?.split("<p>")[1] || ""}`];
              // loop the child templates (skip the first part which has no template)
              for (let i = 1; i < lstRenderByTemplateInCell.length; i++) {
                const serviceTemplateParts = lstRenderByTemplateInCell[i].split("::");
                const serviceType = serviceTemplateParts[0].replace("{{", "").replace("}}", "")?.toLowerCase() || "";
                let template = serviceTemplateParts[1].split(":]")[0] || "";
                // push the next par content
                nextAfterContents.push(serviceTemplateParts[1].split(":]")[1] || "");
                // check if the template is valid for replacing content
                if (!!serviceType && !!template && !!data) {
                  const listItems =
                    data?.Items_Calculator?.filter(
                      (e) => e.types.toLowerCase() === serviceType && e.category !== "Surcharge"
                    ) || [];
                  let inListContent = "";

                  if (!!listItems.length) {
                    // if there is at least 1 assigned service
                    // loop the service list that has the same type of template
                    listItems.forEach((x, j) => {
                      x = {
                        ...x,
                        ...x?.infoService,
                        // flightNumber: x.flightNumber || x.info_note || "",
                        supplierName: x?.infoService?.supplier || "",
                        // NoOfGuests: x?.PriceType === "ACCOMMODATIONFEE" ? x?.numberPaxAdult : x?.ld_qty,
                              noteRequirements: x.noteRequirements?.replaceAll("\n", "<br>"),
                        bookingStatus: x.status || "",
                        Note: x.Note || x.note || "",
                        serviceType: x.types || "",
                        menuType: x.restaurantMenu || "",
                        vehicles:
                          x?.vehicles
                            ?.map((p, idx) => {
                              return `${idx + 1}. [#driver#]: ${p?.driverName} - ${p?.driverPhone}, [#guide#]: ${p?.guideName
                                } - ${p?.guidePhone};`;
                            })
                            ?.join("<br>") || "",
                      };
                      let replaceContent = template;
                      for (const key in x) {
                        if (Object.prototype.hasOwnProperty.call(x, key)) {
                          const regex = new RegExp(`{{${objectName}_${key}}}`, "gi");
                          !!x[key] && (replaceContent = replaceContent.replace(regex, x[key]));
                        }
                      }
                      if (replaceContent != template) {
                        inListContent += listItems.length > 1 ? `<br>- ${replaceContent}` : `<br>${replaceContent}`;
                      } else {
                        nextAfterContents[i - 1] = "";
                      }
                    });
                  } else {
                    // use the general props
                    let replaceContent = template;
                    for (const key in data) {
                      if (Object.prototype.hasOwnProperty.call(data, key)) {
                        const regex = new RegExp(`{{${objectName}_${key}}}`, "gi");
                        !!data[key] && (replaceContent = replaceContent.replace(regex, data[key]));
                      }
                    }
                    if (replaceContent != template) {
                      inListContent += `<br>${replaceContent}`;
                    } else {
                      nextAfterContents[i - 1] = "";
                    }
                  }
                  // merge all the content in lists into a string
                  mergedContent += nextAfterContents[i - 1] + inListContent;
                }
              }
              newRow.innerHTML = mergedContent;
              tbody.appendChild(newRow);
            } else newRow.innerHTML = "";
          } else {
            // if not exists
            for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                const regex = new RegExp(`{{${objectName}_${key}}}`, "gi");
                newRow.innerHTML = newRow.innerHTML.replace(regex, data[key]);
              }
              tbody.appendChild(newRow);
            }
          }
        });
      });
    }

    return table.outerHTML + afterTable;
  }
  removeUnverifiedVariables(text: string) {
    let parts = text.split("{{");
    if (parts && parts.length > 1) {
      let replaced = parts
        .map((part, i) => {
          const idx = part.indexOf("}}");
          return idx >= 0 ? part.substring(idx + 2, part.length - 1) : part;
        })
        .join("")
        .replaceAll("undefined", "")
        .replace(/<(p|span)\b[^>]*>(&nbsp;)?<\/\1\b[^>]*>/gi, "")
        .replace(/\s+|(&nbsp;)+/gi, " ")
        .replace(/(-\s*-)+/g, "-")
        .replace(/-(\s)*</g, "<");
      return replaced;
    }
    return text;
  }
getBedTypes(list) {
    return ` - ${list
        ?.filter((e) => e.value)
        ?.map((e) => `${e.value} ${e.name}`)
        ?.join() || ""
      }`;
  }

  private getFormattedStatusUpdatesTable(statusUpdates: any[]): string {
    if (!statusUpdates || statusUpdates.length === 0) {
      return '<p>No status updates available</p>';
    }

    let tableHtml = `
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f8f9fa; font-weight: bold;">
          <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Cut-off Date</th>
          <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Blocked Units</th>
          <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Confirmed Status Update</th>
          <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Updated Date</th>
          <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Confirmed by</th>
          <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Remain Blocked Units</th>
        </tr>
      </thead>
      <tbody>
  `;

    statusUpdates.forEach((status: any, index: number) => {
      const cutOffDate = status.cutOffDate ? this.afac.ConvertDateTimeToString(status.cutOffDate, 'dd MMM yyyy') : '';
      const takenDate = status.takenDate ? this.afac.ConvertDateTimeToString(status.takenDate, 'dd MMM yyyy HH:mm a') : '';
      const rowStyle = index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8f9fa;';
      const remainUnitsColor = (status.remainBlockedUnits || 0) > 0 ? '#dc3545' : '#28a745'; // red : green

      tableHtml += `
      <tr style="${rowStyle}">
        <td style="border: 1px solid #dee2e6; padding: 8px;">${cutOffDate}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${status.blockedUnits || 0}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${status.confirmedStatusUpdate || 0}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px;">${takenDate}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px;">${status.confirmedBy || ''}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; color: ${remainUnitsColor}; font-weight: bold;">${status.remainBlockedUnits || 0}</td>
      </tr>
    `;
    });

    tableHtml += `
      </tbody>
    </table>
  `;

    return tableHtml;
  }

  Flights(list: any[]) {
    if (!list || list.length === 0) {
      return [];
    }
    return list.map((connection) => {
      return {
        TranferFromAirports: connection.TranferFromAirports,
        TranferToAirports: connection.TranferToAirports,
        flightNumber: connection.info_note || "",
        Flight: connection.Flight || "",
        route: `${connection.From || ""} - ${connection.To || ""}`,
        airlines: connection.Airlines || "",
        class: this.getFlightClassName(connection.class) || "",
        luggageAllowance: this.getFlightClassName(connection.luggageAllowance) || "",
        // Include original data for reference if needed
        originalData: connection,
      };
    });
  }

   private getFlightClassName(classCode: string): string {
    if (!classCode) return "";

    switch (classCode.toUpperCase()) {
      case "Y":
        return "Economy";
      case "J":
        return "Business Class";
      case "C":
        return "Business";
      case "M":
        return "Economy";
      case "S":
        return "Economy";
      case "F":
        return "First Class";
      case "W":
        return "Premium Economy";
      case "N/A":
        return "N/A";
      default:
        return classCode;
    }
  }

    private getTotalPassengerCount(service: any): number {
    // Get passenger count from different possible sources
    if (service.specificPax > 0 || service.specificPaxChild > 0) {
      return (service.specificPax || 0) + (service.specificPaxChild || 0);
    } else if (service.lsPassenger && service.lsPassenger.length) {
      return service.lsPassenger.length;
    } else if (service.pax) {
      return service.pax;
    } else if (this.TaskService?.lsPassenger?.length) {
      return this.TaskService.lsPassenger.length;
    }
    return 2; // Default minimum
  }
 private getDefaultVehicleFromPaxCount(paxCount: number, listOrtherData: any[]): any {
    if (!listOrtherData || listOrtherData.length === 0) {
      return { name: "", price: 0 };
    }

    // Sort by max capacity to find the largest vehicle if needed
    const sortedVehicles = [...listOrtherData].sort((a, b) => (b.max || 0) - (a.max || 0));
    const maxCapacity = sortedVehicles[0].max || 0;

    // First try to find a direct match for the passenger count
    let matchingVehicle = listOrtherData.find((x) => x.min <= paxCount && paxCount <= x.max);

    // If direct match found, return it
    if (matchingVehicle) {
      return {
        name: matchingVehicle.name || "",
        price: matchingVehicle.price || 0,
        markup: matchingVehicle.markup || 0,
      };
    }

    // If no direct match, calculate how many of the largest vehicles needed
    if (paxCount > maxCapacity) {
      const largestVehicle = sortedVehicles[0];
      const vehicleCount = Math.ceil(paxCount / maxCapacity);

      return {
        name: `${vehicleCount}x ${largestVehicle.name || ""}`,
        price: (largestVehicle.price || 0) * vehicleCount,
        markup: largestVehicle.markup || 0,
      };
    }

    // If pax count is smaller than any vehicle's min capacity, use the smallest vehicle
    const smallestVehicle = [...listOrtherData].sort((a, b) => (a.min || 0) - (b.min || 0))[0];
    return {
      name: smallestVehicle.name || "",
      price: smallestVehicle.price || 0,
      markup: smallestVehicle.markup || 0,
    };
  }

   private isSameDay(date1: any, date2: any): boolean {
    if (!date1 || !date2) return false;

    try {
      // Convert to Date objects if they aren't already
      const d1 = date1 instanceof Date ? date1 : new Date(date1);
      const d2 = date2 instanceof Date ? date2 : new Date(date2);

      // Check if dates are valid
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        console.warn("Invalid date format detected:", { date1, date2 });
        return false;
      }

      // Compare year, month, and day
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    } catch (error) {
      console.error("Error comparing dates:", error, { date1, date2 });
      return false;
    }
  }

  private isDateInRange(checkDate: any, beginDate: any, endDate: any): boolean {
    if (!checkDate || !beginDate) return false;

    try {
      // Convert all dates to Date objects for comparison
      const checkDateObj = typeof checkDate === "string" ? new Date(checkDate) : checkDate;
      const beginDateObj = typeof beginDate === "string" ? new Date(beginDate) : beginDate;

      // If no end date is provided, just check if service date is the same as begin date
      if (!endDate) {
        return this.isSameDay(checkDateObj, beginDateObj);
      }

      // Otherwise, check if service date is within the range
      const endDateObj = typeof endDate === "string" ? new Date(endDate) : endDate;

      // Check if dates are valid
      if (isNaN(checkDateObj.getTime()) || isNaN(beginDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        console.warn("Invalid date format detected in range check:", { checkDate, beginDate, endDate });
        return false;
      }

      // Set time to midnight for accurate day comparison
      const check = new Date(checkDateObj.getFullYear(), checkDateObj.getMonth(), checkDateObj.getDate());
      const begin = new Date(beginDateObj.getFullYear(), beginDateObj.getMonth(), beginDateObj.getDate());
      const end = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());

      // Check if service date is within the range (inclusive)
      return check >= begin && check <= end;
    } catch (error) {
      console.error("Error checking date range:", error, { checkDate, beginDate, endDate });
      return false;
    }
  }
 series: any = {}; // Add this property to store the series data
  isConvert: boolean = false;
  private loadRetailSalesSicData(): void {
  // this.dbService
  //   .GetRetailSalesSicAsync({
  //     idBooking: this.idBookingOrigin,
  //     isConvert: this.isConvert,
  //     currency: this.user.currency, // Using user.currency as fallback since this.info might not be available
  //     nation: this.user.nation,
  //   })
  //   .subscribe((response) => {
  //     this.series = response || {};
  //      this.generateHotelTable();
  //     // Add any additional logic you need after getting the series data
  //     console.log('Retail Sales SIC data loaded:', this.series);
  //   });
}
hotelTableHtml: string = '';
private generateHotelTable(): void {
  if (!this.series || !this.series.hotels) {
    return;
  }

  let hotelsToDisplay = this.series.hotels;
  
  // Filter by itemselect if it exists and has items
  if (this.itemSelect && this.itemSelect.length > 0) {
    hotelsToDisplay = this.series.hotels.filter(hotel => 
      this.itemSelect.some(item => item.IsItem === hotel.IsItem)
    );
  }

  // Generate HTML table
  let tableHtml = this.buildHotelTableHtml(hotelsToDisplay);
  
  // Display the table (you can modify this based on where you want to show it)
  this.hotelTableHtml = tableHtml;
  console.log('Generated hotel table HTML:', tableHtml);
}

private buildHotelTableHtml(hotels: any[]): string {
  if (!hotels || hotels.length === 0) {
    return '<p>No hotel data available</p>';
  }

  let tableHtml = `
    <div class="hotel-table-container">
      <table class="table table-bordered table-striped">
        <thead class="table-dark">
          <tr>
            <th>Hotel</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Category</th>
            <th>Nights</th>
            <th>Blocked</th>
            <th>Available</th>
            <th>Confirmed</th>
            <th>Day Before</th>
            <th>Cut-off-date</th>
          </tr>
        </thead>
        <tbody>
  `;

  hotels.forEach(hotel => {
    const checkInDate = this.formatDate(hotel.begindate);
    const checkOutDate = this.formatDate(hotel.enddate);
    const cutOffDate = this.formatDate(hotel.cutOffDateSic);
    const available = (hotel.roomBlocked || 0) - (hotel.roomConfirmed || 0);
    const dayBefore = hotel.numberPaymentCutOffDate || 0;

    tableHtml += `
      <tr>
        <td><strong>${hotel.name || 'N/A'}</strong></td>
        <td>${checkInDate}</td>
        <td>${checkOutDate}</td>
        <td>${hotel.roomcategory || 'N/A'}</td>
        <td>${hotel.noofnights || 0}</td>
        <td>${hotel.roomBlocked || 0}</td>
        <td>${available}</td>
        <td>${hotel.roomConfirmed || 0}</td>
        <td>${dayBefore}</td>
        <td>${cutOffDate}</td>
      </tr>
    `;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  return tableHtml;
}

private formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}



generateHotelTable1(): string {
  if (!this.itemSelect?.selectedHotel || !Array.isArray(this.itemSelect.selectedHotel) || this.itemSelect.selectedHotel.length === 0) {
    return '<p>No hotel information available</p>';
  }

  const hotels = this.itemSelect.selectedHotel;
  
  let tableHtml = `
    <div class="hotel-table-container">
      <table class="table table-hover table-striped tb-hotel-sic" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead style="background-color: #f8f9fa;">
          <tr>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Hotel</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Check-In</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Check-Out</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Category</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Nights</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Blocked</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Available</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Confirmed</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Day Before</th>
            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Cut-off-date</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Lặp qua tất cả hotels trong selectedHotel array
  hotels.forEach((hotel, index) => {
    const checkInDate = hotel.begindate ?? '-';
    const checkOutDate = hotel.enddate ?? '-';
    const cutOffDate = hotel.cutOffDateSic ?? '-';
    const available = (hotel.roomBlocked || 0) - (hotel.roomConfirmed || 0);
    
    // Thêm class để phân biệt các rows
    const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
    
    tableHtml += `
      <tr class="${rowClass}">
        <td style="border: 1px solid #dee2e6; padding: 8px;">${hotel.name || '-'}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px;">${checkInDate}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px;">${checkOutDate}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px;">${hotel.roomcategory || '-'}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${hotel.noofnights || 0}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${hotel.roomBlocked || 0}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${available}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${hotel.roomConfirmed || 0}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${hotel.numberPaymentCutOffDate || 0}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px;">${cutOffDate}</td>
      </tr>
    `;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  return tableHtml;
}

}
