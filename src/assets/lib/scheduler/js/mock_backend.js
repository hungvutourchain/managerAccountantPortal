(function () {
    var storage = {
        getData: function (url, params) {
            return getSchedulerData();
        },
        saveData: function (url, params) {
            var command = parseRequestArguments(params);
            var data = JSON.parse(getSchedulerData());
            var eventsArray = data.data;
            var updatedEvent = command.event;
            switch (command.action) {
                case "inserted":
                    insertEvent(updatedEvent, eventsArray);
                    break;
                case "updated":
                    updateEvent(updatedEvent, eventsArray);
                    break;
                case "deleted":
                    deleteEvent(updatedEvent, eventsArray);
                    break;
            }
            updateSchedulerData(data);
            return JSON.stringify({ action: command.action, tid: updatedEvent.id, sid: updatedEvent.id });
        }
    };
    function insertEvent(event, dataset) {
        var newId = "";
        setTimeout(function () {
            $.post('/api/user/GuideScheduler', event, function (rs) {
                newId = rs.id; // leave id unchanged
                dataset.push(rs);
                getSchedulerData();
            });
            return newId;
        }, 1000);
    }
    function updateEvent(event, dataset) {
        $.post('/api/user/update_GuideScheduler', event, function (rs) {
            var dbEvent;
            getSchedulerData();
            for (var i = 0; i < dataset.length; i++) {
                if (dataset[i].id == event.id) {
                    dbEvent = dataset[i];
                }
            }
            for (var i in event) {
                dbEvent[i] = event[i];
            }
        });
    }
    function deleteEvent(event, dataset) {
        $.post('/api/user/del_GuideScheduler', event, function (rs) {
            getSchedulerData();
            for (var i = 0; i < dataset.length; i++) {
                if (dataset[i].id == event.id) {
                    dataset.splice(i, 1);
                    break;
                }
            }
        });
    }
    function updateSchedulerData(data) {
        localStorage.setItem('dhx-scheduler-car-rental-updated', JSON.stringify(data));
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
        return localStorage.getItem('dhx-scheduler-car-rental-updated');
    }
    function parseRequestArguments(params) {
        var parts = decodeURIComponent(params).split("&");
        var fieldsMap = {};
        for (var i = 0; i < parts.length; i++) {
            var param = parts[i].split("=");
            fieldsMap[param[0]] = param[1];
        }
        var id = fieldsMap["ids"];
        var action, event = {};
        var prefix = id + "_";
        for (var i in fieldsMap) {
            var isEventProperty = i.indexOf(prefix) > -1;
            if (isEventProperty) {
                var fieldName = i.substr(prefix.length);
                if (fieldName == "!nativeeditor_status") {
                    action = fieldsMap[i];
                }
                else {
                    event[fieldName] = fieldsMap[i];
                }
            }
        }
        return {
            action: action,
            event: event
        };
    }
    var mockAjax = {
        call: function (httpMethod, url, params, callback) {
            var handler = this.router.route(httpMethod, url);
            if (handler) {
                this.executeRequest(httpMethod, handler, url, params, callback);
            }
            else {
                console.error("no route found " + this.router.urlMask(httpMethod, url));
            }
        },
        executeRequest: function (httpMethod, method, url, params, callback) {
            setTimeout(function () {
                var res = method(url, params);
                console.log(["XHR " + httpMethod.toUpperCase(), url].join(" -> "));
                setTimeout(function () {
                    callback({
                        filePath: url,
                        xmlDoc: {
                            readyState: 4,
                            response: res,
                            responseText: res,
                            status: 200
                        }
                    });
                });
            });
        }
    };
    mockAjax.router = {
        routeMap: {},
        route: function (httpMethod, url) {
            return this.routeMap[this.urlMask(httpMethod, url)];
        },
        urlMask: function (httpMethod, url) {
            return [httpMethod, this._stripUrl(url)].join("->").toLowerCase();
        },
        _stripUrl: function (url) {
            var paramsIndex = url.indexOf("?");
            if (paramsIndex < 0) {
                paramsIndex = url.length;
            }
            return url.substr(0, paramsIndex);
        }
    };
    window.dhtmlxAjax = {
        get: function (url, callback) {
            mockAjax.call("get", url, null, function (res) {
                callback(res);
            });
        },
        post: function (url, post, callback) {
            mockAjax.call("post", url, post, function (res) {
                callback(res);
            });
        }
    };
    window.dtmlXMLLoaderObject.prototype.loadXML = function (filePath, postMode, postVars) {
        console.log(filePath);
        console.log(postMode);
        console.log(postVars);
        var callback = this.onloadAction;
        mockAjax.call(postMode ? "post" : "get", filePath, postVars, function (res) {
            console.log("mockAjax", res);
            callback(window.dp, null, null, null, res);
        });
    };
    mockAjax.router.routeMap["get->loading"] = storage.getData.bind(storage);
    mockAjax.router.routeMap["post->action"] = storage.saveData.bind(storage);
})();
