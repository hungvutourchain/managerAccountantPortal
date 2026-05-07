//  Created by Nauman Qazi (itsnomihere@gmail.com)
//  Copyright (c) 2016 Nauman Qazi. All rights reserved.
var layerCounter = 0;
var map;
var featureLabelNames = [];
var zoomLvl = 5;
var totalDistance = 0;
var lat = '17.054832';
var lng = '106.768349';
//17.054832, 106.768349
var MAX_DESTINATION_COUNT = 39;
var routeGeometry = [];
var arcGeometry = [];
var penColor = '#376B67';
var markerColor = '#609B96';
var penWidth = 2;
var selectedOrientation = 'portrait';
var selectedSize = "L";
var _DEBUG_ = (location.hostname === "localhost" || location.hostname === "127.0.0.1");
var oldBounds;
var themeStyle;
var cities = [];
var filtered_cities = () => {
    return cities.filter(c => !c.archived);
}
var scaleFactor = 1;
var style_name = 'cjdsigxek0yxx2ss2d29xfatn';
var mapStyle = 'mapbox://styles/mapbox';
var currentLocationType = 'PLANE';
mapboxgl.accessToken = 'pk.eyJ1IjoidGhpanNzb25kYWciLCJhIjoiY2phOHI2MXNuMDh3dzMzanVhZXlzanU4byJ9.L3vNl1ehNadAt1JWPJqgiA';


function loadviewForMaps(countries) {
    if (detectIE()) {
        alert('Our site use advanced web feature and works best on Desktop Chrome or Firefox.');
    }
    $("#travel_car").addClass('active');
    try {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                lng = position.coords.longitude;
                lat = position.coords.latitude;
            });
        }
        map = new mapboxgl.Map({
            container: 'map-container',
            style: `${mapStyle}/light-v10`,
            zoom: zoomLvl,
            pitch: 0,
            center: [lng, lat],
            preserveDrawingBuffer: true
        });
        var geocoder = new MapboxGeocoder({
            countries,
            language: 'en',
            mapboxgl,
            accessToken: mapboxgl.accessToken
        });
        document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
        map.doubleClickZoom.disable();

        var option = {
            showCompass: false,
        }
	    map.addControl(new mapboxgl.NavigationControl(option));
        map.on('load', function () {
            geocoder.on('result', function (ev) {
                autocompleter(ev);
            });
        });

        map.on('style.load', function () {
            if (filtered_cities().length) {
                completeRedraw(map);
            }
        });
        map.on('click', function (e) {
            var features = map.queryRenderedFeatures(e.point);
            if (!features.length) {
                return;
            }
            var layer_id = features[0].layer.id;
            var pos = [{
                    position: 'right',
                    offset: [-1.3, 0]
                },
                {
                    position: 'bottom',
                    offset: [0, 1.3]
                },
                {
                    position: 'left',
                    offset: [1.3, 0]
                },
                {
                    position: 'top',
                    offset: [0, -1.3]
                }
            ];
            var x = 0;
            var y = 1;
            var offset = 0.5;
            for (var j = cities.length - 1; j >= 0; --j) {
                if (layer_id.indexOf(cities[j].city_name) !== -1) {
                    for (var i = 0; i < pos.length; i++) {
                        if (pos[i].position === cities[j].city_anchor) {
                            switch (pos[i].position) {
                                case 'right':
                                    cities[j].city_offset[x] = cities[j].city_offset[x] - offset;
                                    break;
                                case 'bottom':
                                    cities[j].city_offset[y] = cities[j].city_offset[y] + offset;
                                    break;
                                case 'left':
                                    cities[j].city_offset[x] = cities[j].city_offset[x] + offset;
                                    break;
                                case 'top':
                                    cities[j].city_offset[y] = cities[j].city_offset[y] - offset;
                                    break;
                            }
                            map.setLayoutProperty(layer_id, 'text-offset', cities[j].city_offset);
                            break;
                        }
                    }
                    break;
                }
            }
        });
    } catch (e) {
        var mapContainer = document.getElementById('map-container');
        mapContainer.parentNode.removeChild(mapContainer);
        alert('This application uses the WebGL feature. Normally, refreshing the browser should fix this problem. If the problem persists, send us a message at https://www.myholidaymap.com. ');
        console.log('This site requires WebGL, but your browser doesn\'t seem' +
            ' to support it: ' + e.message);
        return;
    }
}

/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // IE 12 => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

function deleteLocation(city_name) {
    for (var i = filtered_cities().length - 1; i >= 0; --i) {
        if (filtered_cities()[i].city_name == city_name) {
            filtered_cities()[i].archived = true;
            break;
        }
    }
    for (var i = featureLabelNames.length - 1; i >= 0; --i) {
        if (featureLabelNames[i].properties.title == city_name) {
            featureLabelNames.splice(i, 1);
            break;
        }
    }
    map.hasImage('arrow') ? map.removeImage('arrow'): null;
    completeRedraw(map);
}

function changeOrder(direction, city_name) {
    for (var i = cities.length - 1; i >= 0; --i) {
        if (cities[i].city_name == city_name) {
            var tmp = cities[i];
            if (direction === 'up' && cities[i - 1]) {
                cities[i] = cities[i - 1];
                cities[i - 1] = tmp;
            } else if (direction === 'down' && cities[i + 1]) {
                cities[i] = cities[i + 1];
                cities[i + 1] = tmp;
            }
            break;
        }
    }
    map.hasImage('arrow') ? map.removeImage('arrow'): null;
    completeRedraw(map);
}

function getCity(layer_id) {
    var city_name = layer_id.replace("points_", "");

    for (var j = cities.length - 1; j >= 0; --j) {
        if (cities[j].city_name == city_name) {
            return cities[j];
        }
    }
    return 0;
}

function changePosition(city_name) {
    var layer_id = "points_" + city_name;
    if (map.getLayer(layer_id)) {
        var pos = [{
                position: 'right',
                offset: [-1.3, 0]
            },
            {
                position: 'bottom',
                offset: [0, 1.3]
            },
            {
                position: 'left',
                offset: [1.3, 0]
            },
            {
                position: 'top',
                offset: [0, -1.3]
            }
        ];
        for (var i = 0; i < pos.length; i++) {
            if (pos[i].position == map.getLayoutProperty(layer_id, 'text-anchor')) {
                var nextP = pos[(i + 1) % 4];
                map.setLayoutProperty(layer_id, 'text-anchor', nextP.position);
                map.setLayoutProperty(layer_id, 'text-offset', nextP.offset);
                for (var j = cities.length - 1; j >= 0; --j) {
                    if (cities[j].city_name == city_name) {
                        cities[j].city_anchor = nextP.position;
                        cities[j].city_offset = nextP.offset;
                        break;
                    }
                }
                break;
            }
        }
    }
}


function changeName(city_name) {
    var layer_id = "points_" + city_name;
    var allFeature = map.querySourceFeatures('source_point_' + city_name);

    if (allFeature.length > 0 && map.getLayer(layer_id)) {
        for (var j = cities.length - 1; j >= 0; --j) {
            if (cities[j].city_name == city_name) {
                var new_city_name = prompt("Please enter the location name", cities[j].city_name);
                if (new_city_name !== null && new_city_name !== "") {
                    cities[j].city_alias = new_city_name;
                    allFeature[0].properties.title = cities[j].city_alias;
                }
                break;
            }
        }
    }
    completeRedraw(map);
}

function changeFontSize(operation, city_name) {
    var isPlus = operation === '+';
    var layer_id = "points_" + city_name;
    if (map.getLayer(layer_id)) {
        var text_size = map.getLayoutProperty(layer_id, 'text-size');
        text_size = isPlus ? text_size + 1 : text_size - 1;
        map.setLayoutProperty(layer_id, 'text-size', text_size);
        for (var j = cities.length - 1; j >= 0; --j) {
            if (cities[j].city_name == city_name) {
                cities[j].city_textsize = text_size;
                break;
            }
        }
    }

    city_name = city_name.replace(new RegExp(' ', 'g'), '_');
    $('#tsize_' + city_name).text(text_size + 'pt');
}

function completeRedraw(currentMap) {
    routeGeometry = [];
    arcGeometry = [];
    var printMap = currentMap !== map;

    if (!printMap) {
        document.getElementById('locationName').innerHTML = '';
    }
    var layers = currentMap.getStyle().layers;
    for (let layer of layers) {
        if (layer.id.match(/markers.*/) || (layer.id.match(/points.*/)) || layer.id.match(/route.*/) || layer.id.match(/arc.*/)) {
            currentMap.removeLayer(layer.id);
        }
    }
    var i = 0;
    filtered_cities().forEach(currentCity => {
        var city_name = currentCity.city_alias.length > 0 ? currentCity.city_alias : currentCity.city_name;
        placeNameFeature(currentMap, currentCity, printMap);
        if (!printMap) {
            let routeState = currentCity.city_flight_path;
            document.getElementById('locationName').innerHTML += `<li>
                <div class="updown">
                <img class="up" onclick="changeOrder('up','` + currentCity.city_name + `')" src="assets/images/maps/up.png">
                <img class="down" onclick="changeOrder('down','` + currentCity.city_name + `')" src="assets/images/maps/down.png">
                <img src="assets/images/maps/destination-map.png">
                <span>` +
                city_name +
                `</span>
                    <div class="pull-right">
                `
                +
                    `<span style="margin-right: 5px"><i class="fas fa-${routeState !== '' ? routeState.toLowerCase() : 'map-marker-alt'}"></i></span> `+
                '<span id=\'tsize_' + currentCity.city_name.replace(new RegExp(' ', 'g'), '_') + '\'>16 pt</span>' +
                `   <span onclick="changeFontSize('+','` + currentCity.city_name + `')"> + </span>
                        <span onclick="changeFontSize('-','` + currentCity.city_name + `')"> - </span>
                        <img onclick="changePosition('` + currentCity.city_name + `')" src="assets/images/maps/rotator.png">
                        <img onclick="changeName('` + currentCity.city_name + `')" src="assets/images/maps/edit.png">
                        <img onclick="deleteLocation('` + currentCity.city_name + `')" src="assets/images/maps/cancel.png">
                    </div>
                </div>
                </li>`;
            i++
        }
    });
    for (let index = 0; index < filtered_cities().length; index++) {
        if (filtered_cities().length <= 1 || index + 1 === filtered_cities().length) {
            break;
        }
        const src = filtered_cities()[index];
        const dest = filtered_cities()[index + 1];
        getDirection(currentMap, src, dest, printMap);
    }
    if (filtered_cities().length > 1) {
        if (document.getElementById('looped_map').checked && filtered_cities().length > 2) {
            const src = filtered_cities()[0];
            const dest = filtered_cities()[filtered_cities().length - 1];
            getDirection(currentMap, src, dest, printMap);
        }

        var bounds = new mapboxgl.LngLatBounds();

        featureLabelNames.forEach(function (feature) {
            bounds.extend(feature.geometry.coordinates);
        });

        currentMap.fitBounds(bounds, {
            padding: 100
        });
    }
}
function getDirection(currentMap, src, dest, printMap) {
    if (dest.city_flight_path === 'PLANE') {
        drawRoute(currentMap, src, dest);
        return;
    }
    var coordinateStr = parseFloat(src.city_long).toFixed(4) + ',' +
        parseFloat(src.city_lat).toFixed(4) + ';' +
        parseFloat(dest.city_long).toFixed(4) + ',' +
        parseFloat(dest.city_lat).toFixed(4);

    var direction_url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + coordinateStr +
        '?geometries=geojson&access_token=' + mapboxgl.accessToken;
    $.ajax({
        url: direction_url,
        error: function (err) {
            console.log("An error occurred");
            drawRoute(currentMap, src, dest);
            dest.city_flight_path = currentLocationType;
            return;
        },
        success: function (res) {
            if (res.code === 'NoRoute') {
                drawRoute(currentMap, src, dest);
                dest.city_flight_path = currentLocationType;
                return;
            }
            totalDistance += res.routes[0].distance;
            document.getElementById('distancelbl').innerHTML = (totalDistance / 1000).toFixed(2) + 'KM';
            routeGeometry.push({
                ...res.routes[0].geometry,
                path: dest.city_flight_path
            });
            addLayers(currentMap, dest.city_flight_path);

        }
    });
}

function drawRoute(currentMap,src, dest) {
    var direction_feature = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [src.city_long, src.city_lat],
                    [dest.city_long, dest.city_lat]
                ]
            }
        }]
    };
    // Calculate the distance in kilometers between route start/end point.
    var lineDistance = turf.lineDistance(direction_feature.features[0], 'kilometers');

    var arc = [];

    // Number of steps to use in the arc and animation, more steps means
    // a smoother arc and animation, but too many steps will result in a
    // low frame rate
    var steps = 500;

    // Draw an arc between the `origin` & `destination` of the two points
    for (var i = 0; i < lineDistance; i += lineDistance / steps) {
        var segment = turf.along(direction_feature.features[0], i, 'kilometers');
        arc.push(segment.geometry.coordinates);
    }
    arcGeometry.push({
        "type": "LineString",
        "coordinates": arc,
        "path": dest.city_flight_path
    });
    addLayers(currentMap,dest.city_flight_path);
}
function directionIconReduce(city_flight_path) {
    switch(city_flight_path) {
        case 'MOTORCYCLE':
            return 'bicycle';
        case 'CAR':
            return 'car';
        case 'TRAIN':
            return 'bus';
        case 'SHIP':
            return 'ferry';
        case 'PLANE':
            return 'airport';
        default:
            return 'marker';
    }
}

function placeNameFeature(currentMap, city, printMap) {
    var city_name = city.city_alias.length > 0 ? city.city_alias : city.city_name;
    const _icon = directionIconReduce(city.city_flight_path);
    var feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [city.city_long, city.city_lat]
        },
        "properties": {
            "title": city_name,
            "marker-symbol": _icon
        }
    };
    if (!city.city_source[style_name] || !currentMap.getSource('source_point_' + city.city_name)) {
        var _city_source = {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": [feature],
            }
        };
        city.city_source[style_name] = true;
        currentMap.addSource('source_point_' + city.city_name, _city_source);
    }
    currentMap.addLayer({
        "id": "points_" + city.city_name + (printMap ? "_p" : ""),
        "type": "symbol",
        "source": "source_point_" + city.city_name,
        "layout": {
            "icon-image": "{marker-symbol}-15",
            "text-field": city_name,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            "text-anchor": city.city_anchor,
            "text-offset": city.city_offset,
            "text-size": city.city_textsize * scaleFactor,
            'text-allow-overlap': true,
        },
        "paint": {
          "text-color": penColor,
          'text-halo-color': '#fff',
          'text-halo-width': 2
        }
    });
    if (!printMap) {
        featureLabelNames.push(feature);
    }
}

function ReturnMaps(){
  let convertTo = 'jpeg'
  return {
    maps : cities,
    imageMaps: map.getCanvas().toDataURL("image/"+convertTo)
  }
}

function createPrintMap(zoom, center,bearing,  pitch) {
    'use strict';
    let convertTo = 'jpeg'
    let type = 'jpg'
    var mapData = map.getCanvas().toDataURL("image/"+convertTo);
    setTimeout(function () {
      download(mapData, type)
    }, 500);
}

function printClick_resize() {
    var b = map.getBounds();
    var container = document.getElementById("map-container");
    container.style.width = '3508px';
    container.style.height = "4962px";
    map.resize();
    map.fitBounds(b);
    setTimeout(() => {
        console.log(map.getCanvas().toDataURL())
    }, 5000);
}

function downloadImage(blob) {
    var link = document.createElement('a');
    link.download = 'filename.png';
    link.href = URL.createObjectURL(blob);
    $.LoadingOverlay("hide");
    link.click();
}
function download(mapData, type) {
  const downloadLink = document.createElement("a");
  const fileName = "maps export."+type;
  downloadLink.href = mapData;
  downloadLink.download = fileName;
  downloadLink.click();
}

function printClick(download) {
    var center = map.getCenter();
    var bearing = map.getBearing();
    var pitch = map.getPitch();
    var zoom = map.getZoom();
    createPrintMap(zoom, center, bearing, pitch);
}

function addLayers(currentMap, city_flight_path) {
    ++layerCounter;
    var curPenWidth = penWidth * scaleFactor;
    addRouteLayers(currentMap, routeGeometry, curPenWidth, "route");
    addRouteLayers(currentMap, arcGeometry, curPenWidth, "arc");
}

function addRouteLayers(currentMap, geometryArray, curPenWidth, prefix) {
    if (geometryArray.length == 0) return;
    for (i in geometryArray) {
        currentMap.addLayer({
            "id": prefix + layerCounter + '' + i,
            "type": "line",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "Feature",
                    "properties": {},
                    "geometry": geometryArray[i]
                }
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": penColor,
                "line-width": curPenWidth,
                "line-dasharray": [1, 2]
            }
        });
        let _icon = null;
        if(geometryArray[i].path) {
            _icon = directionIconReduce(geometryArray[i].path);
        }
        currentMap.addLayer({
            'id': 'route' + Math.random(),
            'type': 'symbol',
            'source': {
                "type": "geojson",
                "data": {
                    "type": "Feature",
                    "properties": {
                        "marker-symbol": _icon
                    },
                    "geometry": geometryArray[i]
                }
            },
            'layout': {
                'symbol-placement': 'line',
                'icon-image': '{marker-symbol}-15',
                'icon-size': 1,
                'icon-allow-overlap': true,
                'icon-rotate': _icon == 'airport' ? 90 : 0
            }
        });
    }
}

function autocompleter(result_resp){
    if(filtered_cities().length >= MAX_DESTINATION_COUNT) {
        alert('Only up to 40 locations allowed.');
                $('.geocoder-icon.geocoder-icon-close').click();
        return;
    }
        if (result_resp['result'].place_name_en){
        result_resp['result'].place_name_en = result_resp['result'].place_name_en.replace(/["']/g, "");
    }

    if (filtered_cities().length > 0 && result_resp['result'].place_name_en === filtered_cities()[filtered_cities().length - 1].city_info) {
        return;
    }

    var city_name = result_resp['result'].text.replace(/["']/g, "");
    var city_long = result_resp['result'].geometry.coordinates[0];
    var city_lat = result_resp['result'].geometry.coordinates[1];
    var city_info = result_resp['result'].place_name_en;
    var city_offset = [1.3, 0];
    var city_anchor = "left";
    var city_source = {};
    var city_textsize = 16 * scaleFactor;
    var city_flight_path = currentLocationType;
    var city_alias= result_resp['result'].text;
    var archived = false;
    var found = false;
    for (var i = cities.length - 1; i >= 0; --i) {
        if (cities[i].city_name == city_name) {
            cities[i].archived = false;
            cities[i].city_flight_path = city_flight_path;
            found = true;
            break;
        }
    }
    if (!found) {
        cities.push({
            city_info,
            city_long,
            city_lat,
            city_name,
            city_offset,
            city_anchor,
            city_source,
            city_textsize,
            city_flight_path,
            city_alias,
            archived
        });
    }
    if (filtered_cities().length === 1) {
        map.flyTo({
            center: new mapboxgl.LngLat(city_long, city_lat),
            zoom: zoomLvl
        });
    }
    completeRedraw(map);
    $('.geocoder-icon.geocoder-icon-close').click();
}

function setDimensions() {
    var mapHeight;
    var mapContainer = $('#map-container');
    if ($(window).width() >= 576)
        mapHeight = Math.ceil($(window).height() - $('nav').height() - mapContainer.offset().top + 10);
    else {
        mapHeight = Math.ceil($(window).height());
    }
    var mapWidth = Math.ceil(mapHeight * 0.706);
    if (mapWidth > mapContainer.parent().width()) {
        mapWidth = Math.ceil(mapContainer.parent().width());
        mapHeight = Math.ceil(mapWidth / 0.706);
    }
    mapWidth = 467.8;
    mapHeight = 661.5;
    mapContainer.css({
        'width': selectedOrientation === 'portrait' ? mapWidth : mapHeight + 'px ',
        'height': selectedOrientation === 'portrait' ? mapHeight : mapWidth + 'px'
    });
    if ($(window).width() < 576) {
        var viewportHeight = parseInt($('map').css('marginTop')) + parseInt(mapContainer.css('marginBottom')) + mapHeight + 50;
        $('.right-area').css('height', viewportHeight + 'px');
    } else
        $('.right-area').css('height', '');



    $('#tcrTripName').css({
        'fontSize': Math.ceil(mapWidth / 14) + 'px',
        'lineHeight': Math.ceil(1.2 * mapWidth / 14) + 'px',
        'letterSpacing': Math.ceil(mapWidth / 52) + 'px'
    });
    $('#tcrTripDetails').css({
        'fontSize': Math.ceil(mapWidth / 28) + 'px',
        'lineHeight': Math.ceil(1.2 * mapWidth / 28) + 'px',
        'letterSpacing': Math.ceil(mapWidth / 85) + 'px'
    });

    var leftAreaHeight = mapHeight + 50;
    $('.left-area').css('minHeight', leftAreaHeight + 'px');
}

$(window).resize(function () {
    if (map) map.resize();
});

$("#tripName_txt").on('input', () => {
    document.getElementById('tcrTripName').innerHTML = $("#tripName_txt").val();
});

$("#tripDetail_txt").on('input', () => {
    document.getElementById('tcrTripDetails').innerHTML = $("#tripDetail_txt").val();
});

$(document).on("click", 'ul.styler li', function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoidGhpanNzb25kYWciLCJhIjoiY2phOHI2MXNuMDh3dzMzanVhZXlzanU4byJ9.L3vNl1ehNadAt1JWPJqgiA';
    $(this).siblings().removeClass('active');
    $(this).addClass("active");
    $(".gradient").attr('class', 'gradient ' + $(this).attr("class") + '-gradient');
    themeStyle = `${mapStyle}/${$(this).attr('data-theme')}`;
    map.setStyle(themeStyle);
});

$(document).on('click', 'ul.sizes li', function() {
    $(this).siblings().removeClass('active');
    $(this).addClass("active");
    selectedSize = $(this).find("span.big.size").text().trim();
});

$(document).on('click', '.portraIte-landscape li', function() {
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    selectedOrientation = $(this).attr("data-view");
    map.resize();
});

$(document).on('click', '#btnPrint', function() {
    try {
        printClick(false);
    } catch (e) {
        alert('Our site use advanced web feature and works best on Desktop Chrome or Firefox.');
    }
});

$(document).on('click', '#option-types span', function() {
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    currentLocationType = $(this).attr('data-maptype').toUpperCase();
});

$(document).on('click', '#btnDownload', function() {
    printClick(true);

});

$(document).on('change', '#looped_map', function() {
    completeRedraw(map);
});
