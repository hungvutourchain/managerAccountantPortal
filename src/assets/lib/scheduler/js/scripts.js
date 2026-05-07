// Mock for sheduler
scheduler.config.xml_date = "%Y-%m-%d %H:%i";
scheduler.config.time_step = 60;
scheduler.config.fix_tab_position = false;
scheduler.xy.scale_height = 38;
scheduler.config.limit_drag_out = true;
var cars = scheduler.serverList("guide");
var types = scheduler.serverList("type");
var hours = scheduler.serverList("hour");
var languge = scheduler.serverList("languge");
var statuses = scheduler.serverList("status");
var codes = scheduler.serverList("code");
var User, nation;
var info, dataOpr = {}, tourCode = '', lsConntentCheckBoxAss = [], description = '';
var name_tour = "BOOKING NAME";
scheduler.config.lightbox.sections = [
    { name: "Contact details", type: "textarea", map_to: "text", height: 42, focus: true },
    { name: "Note", type: "textarea", map_to: "description", height: 63 },
    { name: "Car Brand", type: "select", map_to: "guide", options: scheduler.serverList("currentCars") },
    { name: "Pick up location", type: "textarea", map_to: "pick_location", height: 30 },
    { name: "Drop off location", type: "textarea", map_to: "drop_location", height: 30 },
    { name: "time", type: "time", map_to: "auto", height: 72 }
];
scheduler.locale.labels.dhx_cal_today_button = "TODAY";
scheduler.locale.labels.week_timeline_tab = "WEEK";
scheduler.locale.labels.two_week_timeline_tab = "2 WEEKS";
scheduler.locale.labels.month_timeline_tab = "MONTH";
scheduler.createTimelineView({
    fit_events: true,
    name: "week_timeline",
    y_property: "guide",
    render: "bar",
    x_unit: "day",
    x_date: "%D %j",
    x_step: 1,
    x_size: 7,
    x_length: 7,
    dx: 155,
    dy: 120,
    event_dy: 32,
    section_autoheight: false,
    full_event__dy: true,
    y_unit: scheduler.serverList("currentCars")
});
scheduler.createTimelineView({
    fit_events: true,
    name: "two_week_timeline",
    y_property: "guide",
    render: "bar",
    x_unit: "day",
    x_date: "%D %j",
    x_step: 1,
    x_size: 14,
    x_length: 7,
    dx: 155,
    dy: 120,
    event_dy: 32,
    section_autoheight: false,
    full_event__dy: true,
    y_unit: scheduler.serverList("currentCars")
});
scheduler.createTimelineView({
    fit_events: true,
    name: "month_timeline",
    y_property: "guide",
    render: "bar",
    x_unit: "day",
    x_date: "%D %j",
    x_step: 1,
    x_size: 14,
    x_length: 7,
    dx: 155,
    dy: 120,
    event_dy: 32,
    section_autoheight: false,
    full_event__dy: true,
    y_unit: scheduler.serverList("currentCars")
});
scheduler.date.week_timeline_start = scheduler.date.two_week_timeline_start = scheduler.date.week_start;
scheduler.date.month_timeline_start = scheduler.date.month_start;
scheduler.date.add_month_timeline = function (date, inc) {
    return scheduler.date.add(date, inc, "month");
};
scheduler.attachEvent("onBeforeViewChange", function (old_mode, old_date, mode, date) {
    if (mode == "month_timeline") {
        var year = date.getFullYear();
        var month = (date.getMonth() + 1);
        var d = new Date(year, month, 0);
        var days = d.getDate(); //numbers of day in month
        scheduler.matrix['month_timeline'].x_size = days;
        scheduler.matrix['month_timeline'].x_length = days;
    }
    return true;
});
var weekDateFormat = scheduler.date.date_to_str("%D %j");
scheduler.templates.week_timeline_scale_date =
    scheduler.templates.two_week_timeline_scale_date = function (date) {
        return "<br/>" + weekDateFormat(date);
    };
scheduler.templates.month_timeline_scale_date = function (date) {
    return getShortDayName(date) + "<br/>" + date.getDate();
};
scheduler.templates.week_timeline_scale_label =
    scheduler.templates.two_week_timeline_scale_label =
        scheduler.templates.month_timeline_scale_label = function (key, label, section) {
            return "<i class=\"fas fa-user\"style=\"font-size: 19px; margin-bottom: 4px;\"></i><div class=\"car_brand\">" + label + "</div><div class=\"car_price\">" + (section.namelanguage ? section.namelanguage : '-') + "</div><div class=\"car_price\">" + (section.phone || "") + "</div></div>";
        };
scheduler.templates.week_timeline_cell_class =
    scheduler.templates.two_week_timeline_cell_class =
        scheduler.templates.month_timeline_cell_class = function (evs, date, section) {
            var day = date.getDay();
            return day == 0 || day == 6 ? "dhx_cell_holiday" : "";
        };
function getShortDayName(date) {
    switch (date.getDay()) {
        case 0:
            return "Su";
        case 1:
            return "Mo";
        case 2:
            return "Tu";
        case 3:
            return "We";
        case 4:
            return "Th";
        case 5:
            return "Fr";
        case 6:
            return "Sa";
        default:
            return "";
    }
}
var get_formatted_duration = function (start, end) {
    var diff = end - start;
    var durations = {
        day: 24 * 60 * 60 * 1000,
        hour: 60 * 60 * 1000
    };
    var days = Math.floor(diff / durations.day);
    diff -= days * durations.day;
    var hours = Math.floor(diff / durations.hour);
    diff -= hours * durations.hour;
    var results = [];
    if (days)
        results.push(days + " days");
    if (hours)
        results.push(hours + " hours");
    return results.join(", ");
};
scheduler.templates.tooltip_date_format = scheduler.date.date_to_str("%j %M %Y");
scheduler.templates.tooltip_text = function (start, end, event) {
    var statusKey = event.status || null;
    var statuses = scheduler.serverList("status");
    var status = "";
    for (var i = 0; i < statuses.length; i++) {
        if (!statusKey || statuses[i].key == statusKey) {
            status = statuses[i].label;
            break;
        }
    }
    return "<b> <span style='color:red;'>" + event.tourcode + ":<span></b>" + get_formatted_duration(start, end) + "<br/>" +
        "<b>Status: </b>" + event.text + "<br/>" +
        "<b>Status: </b>" + status + "<br/>" +
        "<b>Pick Up: </b> " + scheduler.templates.tooltip_date_format(start) + "<br/>" +
        "<b>Drop Off: </b> " + scheduler.templates.tooltip_date_format(end);
};
scheduler.templates.event_bar_text = function (start, end, event) {
    return "<div class='event-bar-text'>" + event.tourcode + ": " + get_formatted_duration(start, end) + "</div>";
};
scheduler.templates.event_class = function (start, end, event) {
    if (event.status == 1) {
        return "dhx_rent_reservation";
    }
    if (event.status == 2) {
        return "dhx_rent_prepaid";
    }
    if (event.status == 3) {
        return "dhx_rent_payed";
    }
    return "";
};
scheduler.attachEvent("onEventCollision", function (ev, evs) {
    for (var i = 0; i < evs.length; i++) {
        if (ev.car != evs[i].car)
            continue;
        dhtmlx.message({
            type: "error",
            text: "This car is already rented for this date."
        });
    }
    return true;
});
scheduler.pickerDateFormat = "%d/%m/%Y";
scheduler.currentCal = null;
function show_minical(htmlElem, id) {
    //if mini calendar already shown - destroy it
    if (scheduler.isCalendarVisible()) {
        scheduler.destroyCalendar(null, true);
        if (scheduler.currentCal == htmlElem)
            return;
    }
    scheduler.currentCal = htmlElem;
    //create minicalendar
    scheduler.renderCalendar({
        position: htmlElem.id,
        date: scheduler._date,
        navigation: true,
        handler: function (date, calendar) {
            //on click - put selected value to the input
            document.getElementById(id).value = scheduler.date.date_to_str(scheduler.pickerDateFormat)(date);
            //update sections
            updateSections();
            //and destroy calendar
            scheduler.destroyCalendar();
            //check if 'To' date is later than 'From' date
            if (!areDatesCorrect()) {
                showWarning();
            }
        }
    });
    function areDatesCorrect() {
        var from = document.getElementById("dateFrom").value, to = document.getElementById("dateTo").value;
        if (from && to) {
            //function to convert string to date object
            var converter = scheduler.date.str_to_date(scheduler.pickerDateFormat);
            from = converter(from);
            to = converter(to);
            if (from && to) { //if converted successfully
                if (from.getTime() > to.getTime())
                    //return false only if start date is later than end date, other cases are valid
                    return false;
            }
        }
        return true;
    }
    function showWarning() {
        document.getElementById("dateTo").value = "";
        dhtmlx.message("Pick up date must be before Drop off date!");
    }
}
function getItem(array, key) {
    for (var i = 0; i < array.length; i++) {
        if (key == array[i].key) {
            return array[i];
        }
    }
    return null;
}
function convertToDateObj(date, time) {
    var formatFunc = scheduler.date.str_to_date("%d/%m/%Y %H:%i"), targetDate = date + " " + time, convertedDate = formatFunc(targetDate);
    return convertedDate;
}
function filterByType(car, types) {
    return !!types[car.type];
}
function filterByPrice(car, prices) {
    return prices.some(function (price) {
        return +car.price >= price.minVal && +car.price < price.maxVal;
    });
}
function filterByDate(car, dateFrom, dateTo) {
    if (dateFrom) {
        var evs = scheduler.getEvents();
        for (var i = 0; i < evs.length; i++) {
            if (car.key == evs[i].car) {
                var evStart = (evs[i].start_date).getTime(), evEnd = (evs[i].end_date).getTime(), filterDateStart = dateFrom.getTime(), filterDateEnd = dateTo.getTime();
                if (((evStart >= filterDateStart) && (evEnd <= filterDateEnd)) || ((evStart <= filterDateStart) && (evEnd >= filterDateEnd)) || ((evStart >= filterDateStart) && (evEnd >= filterDateEnd && evStart < filterDateEnd)) || ((evEnd <= filterDateEnd) && (evStart <= filterDateStart && evEnd > filterDateStart)))
                    return false;
            }
        }
        return true;
    }
    return true;
}
function getCheckedValues(boxId) {
    return Array.prototype.slice
        .call(document.querySelectorAll("#" + boxId + " input[type=checkbox]:checked"))
        .map(function (box) {
        return box.value;
    });
}
function updateSections() {
    scheduler.updateCollection("currentCars", cars.slice());
    // var types = getCheckedValues("type-options")
    //     .reduce(function (hash, value) {
    //       hash[value] = true;
    //       return hash;
    //     }, {});
    var types = getCheckedValues("type-options");
    var arrBySearchText = cars;
    if ($('#TextSearch').val())
        arrBySearchText = arrBySearchText.filter(function (o) { return typeof o.label === 'string' && o.label.toLowerCase().includes($('#TextSearch').val().toLowerCase()); }).map(function (o) { return o; });
    if (types.length > 0) {
        for (var i = 0; i < types.length; i++) {
            arrBySearchText =
                arrBySearchText.filter(function (x) { return x.languge == types[i]; });
        }
    }
    // arrBySearchText =  _.find(arrBySearchText, function(o) {
    //     return _.some(o.languge, function(word) {
    //         return _.findIndex(types, function(vl) { 
    //           return word == vl; 
    //         })>=0;
    //     });
    // });
    var checkbox = document.getElementById("dateFilter");
    var newDate = document.getElementById("dateFrom").value;
    if (checkbox.checked && newDate) {
        var formatFunc = scheduler.date.str_to_date("%d/%m/%Y");
        scheduler.setCurrentView(formatFunc(newDate));
        var dateFrom = document.getElementById("dateFrom").value, timeFrom = getItem(hours, document.getElementById("timeFrom").value).label, dateTo = document.getElementById("dateTo").value, timeTo = getItem(hours, document.getElementById("timeTo").value).label;
        if (dateFrom) {
            var targetDateFrom = convertToDateObj(dateFrom, timeFrom);
            var targetDateTo = (!dateTo) ? (scheduler.date.add(targetDateFrom, 1, 'hour')) : convertToDateObj(dateTo, timeTo);
        }
        var arrByDate = arrBySearchText.filter(function (car) {
            return filterByDate(car, targetDateFrom, targetDateTo);
        });
        scheduler.updateCollection("currentCars", arrByDate);
    }
    else {
        scheduler.updateCollection("currentCars", arrBySearchText);
    }
}
function pushSelectOptions(elementID, arr, formatter) {
    var select = document.getElementById(elementID);
    var selectHTML = [""];
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        selectHTML.push("<option value='" + item.key + "'>"
            + (formatter ? formatter(item) : item.label)
            + "</option>");
    }
    select.innerHTML = selectHTML.join("");
}
function pushCheckboxes(root, options, formatter, name) {
    var select = document.getElementById(root);
    var html = [];
    for (var i = 0; i < options.length; i++) {
        var item = options[i];
        html.push("<label>" +
            "<div class='checkbox'>" +
            "<input type='checkbox' name='" + name + "' value='" + item.key + "' onchange='updateSections()' checked>" +
            "<span class='checkbox_marker'></span>" +
            "</div>" +
            "<span class='checkbox_text'>" +
            (formatter ? formatter(item) : item.label) +
            "</span>" +
            "</label>");
    }
    select.innerHTML = html.join("<br>");
}
function pushCheckboxesLanguage(root, options, formatter, name) {
    var select = document.getElementById(root);
    var html = [];
    for (var i = 0; i < options.length; i++) {
        var item = options[i];
        html.push("<label>" +
            "<div class='checkbox'>" +
            "<input type='checkbox' name='" + name + "' value='" + item.code + "' onchange='updateSections()'>" +
            "<span class='checkbox_marker'>" + (formatter ? formatter(item) : item.name) + "</span>" +
            "</div>" +
            "</label>");
    }
    select.innerHTML = html.join("<br>");
}
scheduler.attachEvent("onXLE", function () {
    scheduler.updateCollection("currentCars", cars.slice());
    pushCheckboxesLanguage("type-options", JSON.parse(localStorage.getItem('dhx-scheduler-language')), null, "languge");
    //pushCheckboxes("price-options", languge, function(item){ return "$"+item.minVal+"-"+item.maxVal }, "languge");
    //pushCheckboxes("languge-options", languge,null, "languge");
    pushSelectOptions("timeFrom", hours);
    pushSelectOptions("timeTo", hours);
    pushSelectOptions("lightboxFromTime", hours);
    pushSelectOptions("lightboxToTime", hours);
    var carOptions = cars.slice().sort(function (a, b) {
        if (a.label > b.label)
            return 1;
        if (a.label < b.label)
            return -1;
        return a.key > b.key ? 1 : -1;
    });
    pushSelectOptions("lightboxCar", carOptions);
    // pushSelectOptions("lightboxCode", codes);
    var statusesHtml = statuses.map(function (status) {
        return "<label style=\"margin: 0px 9px;\">" +
            "<div class='radio'>" +
            "<input type='radio' name='status' value='" + status.key + "'>" +
            "<span class='radio_marker'> " + status.label + "</span>" +
            "</div></label>";
    });
    document.getElementById("lightboxStatus").innerHTML = statusesHtml.join("");
});
var html = function (id) { return document.getElementById(id); }; //just a helper
function setRadio(containerId, value) {
    var boxes = html(containerId).querySelectorAll("input[type=radio]");
    if (!value) {
        boxes[0].checked = true;
    }
    else {
        for (var i = 0; i < boxes.length; i++) {
            if (boxes[i].value == value) {
                boxes[i].checked = true;
                break;
            }
        }
    }
}
function getRadio(containerId) {
    var boxes = html(containerId).querySelectorAll("input[type=radio]");
    for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
            return boxes[i].value;
        }
    }
    return 0;
}
var dateToLightboxStr = scheduler.date.date_to_str(scheduler.pickerDateFormat);
function setDate(containerId, value) {
    var block = html(containerId);
    block.querySelector("input[type=text]").value = dateToLightboxStr(value);
    var hour = value.getHours() + 1;
    block.querySelector("select").value = hour;
}
function getDate(containerId) {
    var block = html(containerId);
    var date = block.querySelector("input[type=text]").value;
    var time = getItem(hours, block.querySelector("select").value).label;
    var result = convertToDateObj(date, time);
    if (isNaN(+result))
        return null;
    return result;
}
function viewContent(id, ls, tourcode, nameCode) {
    var txt = '<h3 style="color:black;">Code: ' + tourcode + '</h3>' +
        '<h3 style="color:black;border-bottom: 1px dashed #000; padding-bottom: 10px;">Name: ' + nameCode + '</h3>';
    $.each(ls, function (index, el) {
        txt += '<h4 style="color:red;">' + el.date + '-' + el.location + '</h4>' +
            '<h5 style=" margin-bottom: 0; ">' + el.name + '</h6>' +
            '<p style="font-size: 12px;">' + el.content + '</p>';
    });
    $(id).html(txt);
}
function viewlist(id){
    var txt = "";
    dataOpr.forEach(item => {
        txt += `
            <div class="form-check">
                <input class="form-check-input clsOpr" type="checkbox" name="Opr" value="${item._id}" id="_is_${item._id}">
                <label class="form-check-label" for="_is_${item._id}">
                ${item.name}
                </label>
            </div>
        `
    });
    $(id).html(txt);
    //$('.clsOpr').value(dataOpr[0]._id);
};
function Print() {
    var printContents = document.getElementById('viewContent').innerHTML;
    var myWindow = window.open('', '_blank');
    myWindow.document.write(printContents);
    myWindow.document.close();
    myWindow.focus();
    myWindow.print();
    myWindow.close();
};
scheduler.showLightbox = function (id) {
    var ev = scheduler.getEvent(id);
    scheduler.startLightbox(id, html("lightbox_form"));
    var lsct = ev.lsConntentCheckBoxAss || lsConntentCheckBoxAss;
    html("TourCode").value = ev.tourcode || tourCode;
    html("description").value = ev.description || description;
    html("lightboxName").value = ev.text || "";
    html("lightboxCar").value = ev.guide;
    viewContent('#viewContent', lsct, ev.tourcode || tourCode, ev.text || "");
    viewlist('#listitems');
    setRadio("lightboxStatus", ev.status);
    setDate("lightboxPickUpDate", ev.start_date);
    setDate("lightboxDropOffDate", ev.end_date);
};
function save_form() {
    var isError = false;
    var text = html("lightboxName").value.trim();
    if (!text) {
        dhtmlx.message("Enter correct Name", "error");
        isError = true;
    }
    var guide = html("lightboxCar").value;
    var tourcode = html("TourCode").value.trim();
    var description = html("description").value.trim();
    var status = getRadio("lightboxStatus");
    if (!status) {
        dhtmlx.message("Enter correct Status", "error");
        isError = true;
    }
    var startDate = getDate("lightboxPickUpDate");
    if (!startDate) {
        dhtmlx.message("Enter correct Pick Up date", "error");
        isError = true;
    }
    var endDate = getDate("lightboxDropOffDate");
    if (!endDate) {
        dhtmlx.message("Enter correct Drop Off date", "error");
        isError = true;
    }
    if (!isError && +endDate <= +startDate) {
        dhtmlx.message("Drop Off date should be higher than Pick Up date", "error");
        isError = true;
    }
    var valueSelectitem =[];
    $.each($("input[name='Opr']:checked"),function(){
        valueSelectitem.push($(this).val())
    });
    console.log(valueSelectitem);
    if (!isError) {
        var ev = scheduler.getEvent(scheduler.getState().lightbox_id);
        if (!scheduler.checkCollision({
            id: ev.id.toString(),
            start_date: startDate,
            end_date: endDate,
            guide: guide
        }))
            return;
        ev.tourcode = tourcode;
        ev.text = text;
        ev.guide = guide;
        ev.description = description;
        ev.lsConntentCheckBoxAss = lsConntentCheckBoxAss;
        ev.status = status;
        ev.start_date = startDate;
        ev.end_date = endDate;
        scheduler.endLightbox(true, html("lightbox_form"));
    }
}
function close_form() {
    scheduler.endLightbox(false, html("lightbox_form"));
}
function delete_event() {
    var event_id = scheduler.getState().lightbox_id;
    scheduler.endLightbox(false, html("lightbox_form"));
    scheduler.deleteEvent(event_id);
}
function initLightboxBgCancel() {
    dhtmlxEvent(document.body, "click", function (e) {
        if (e.target && e.target.className == "dhx_cal_cover" &&
            scheduler.getState().lightbox_id) {
            close_form();
        }
    });
}
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)), sURLVariables = sPageURL.split('&'), sParameterName, i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}
function getSchedulerData() {
    var params = {};
    if (User && User !== '') {
        $("#search-panel").addClass('hidden');
        params._id = User;
    }
    params.nation = nation;
    var data = {
        collections: {
            "hour": [
                { "id": "1", "value": "1", "label": "00:00" },
                { "id": "2", "value": "2", "label": "01:00" },
                { "id": "3", "value": "3", "label": "02:00" },
                { "id": "4", "value": "4", "label": "03:00" },
                { "id": "5", "value": "5", "label": "04:00" },
                { "id": "6", "value": "6", "label": "05:00" },
                { "id": "7", "value": "7", "label": "06:00" },
                { "id": "8", "value": "8", "label": "07:00" },
                { "id": "9", "value": "9", "label": "08:00" },
                { "id": "10", "value": "10", "label": "09:00" },
                { "id": "11", "value": "11", "label": "10:00" },
                { "id": "12", "value": "12", "label": "11:00" },
                { "id": "13", "value": "13", "label": "12:00" },
                { "id": "14", "value": "14", "label": "13:00" },
                { "id": "15", "value": "15", "label": "14:00" },
                { "id": "16", "value": "16", "label": "15:00" },
                { "id": "17", "value": "17", "label": "16:00" },
                { "id": "18", "value": "18", "label": "17:00" },
                { "id": "19", "value": "19", "label": "18:00" },
                { "id": "20", "value": "20", "label": "19:00" },
                { "id": "21", "value": "21", "label": "20:00" },
                { "id": "22", "value": "22", "label": "21:00" },
                { "id": "23", "value": "23", "label": "22:00" },
                { "id": "24", "value": "24", "label": "23:00" }
            ],
            "code": [
                { "id": "1", "value": "HANFDS", "label": "Code HANFDS" },
                { "id": "2", "value": "HANFDSA", "label": "Code HANFDSA" },
                { "id": "3", "value": "HANFDSBD", "label": "Code HANFDSBD" }
            ],
            "type": [
                { "id": "1", "value": "1", "label": "1 Year" },
                { "id": "2", "value": "2", "label": "2 Year" },
                { "id": "3", "value": "3", "label": "3 Year" },
                { "id": "4", "value": "4", "label": "4 Year" }
            ],
            "status": [
                { "id": "1", "value": "1", "label": "Confirmed" },
                { "id": "2", "value": "2", "label": "Canceled" }
            ],
        }
    };
    function spliceLangue(ls) {
        var txt = '';
        if (typeof ls === "object") {
            $.each(ls, function (index, el) {
                txt += el + ', ';
            });
        }
        else {
            txt = ls;
        }
        return txt;
    }
    $.post('/api/user/get_GuideSchedulers', params).done(function (rs) {
        var lsdata = [];
        var lsguide = [];
        if (rs) {
            $.each(rs, function (index, vl) {
                var language = spliceLangue(vl.languge);
                lsguide.push({
                    id: index,
                    value: vl.value,
                    label: vl.label,
                    languge: vl.languge,
                    namelanguage: language,
                    phone: vl.phone,
                    link: '/image/Sample.jpg',
                    type: vl.type ? vl.type : 1
                });
                if (vl.data.length > 0) {
                    lsdata = $.merge(vl.data, lsdata);
                }
            });
            data.data = lsdata;
            data.collections.guide = lsguide;
            localStorage.setItem('dhx-scheduler-car-rental-updated', JSON.stringify(data));
        }
    });
    $.post('/api/user/get_suplanguage', { nation: nation })
        .done(function (rs) {
        localStorage.setItem('dhx-scheduler-language', JSON.stringify(rs));
    });
};
function init() {
    name_tour = info.bookingName ? info.bookingName : name_tour;
    tourCode = info.productCode ? info.productCode : tourCode;
    lsConntentCheckBoxAss = info.lsConntentCheckBoxAss;
    if (info.lsConntentCheckBoxAss && info.lsConntentCheckBoxAss.length > 0) {
        $.each(info.lsConntentCheckBoxAss, function (index, el) {
            description += el.date + ': ' + el.name + '\n\n';
        });
    }    
    scheduler.locale.labels.tourcode = tourCode;
    scheduler.locale.labels.new_event = name_tour;
    getSchedulerData();
    scheduler.init('scheduler_here', new Date(), "month_timeline");
    setTimeout(function () {
        scheduler.load("loading", "json");
        initLightboxBgCancel();
        window.dp = new dataProcessor("action");
        dp.init(scheduler);
    }, 1000);
}
