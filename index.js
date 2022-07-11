import 'ol/ol.css';
import Tile from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Group } from 'ol/layer';
import Map from 'ol/Map';
import View from 'ol/View';
import Style from 'ol/style/Style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import GeoJSON from 'ol/format/GeoJSON';
import { Overlay } from 'ol';
import $ from "jquery";
import { Feature } from 'ol/index';
import {Point} from 'ol/geom';


const BASE_LAYER_TITLE = 'baseLayer'
const WASHINGTON_LAYER_TITLE = 'washingtonLayer'
const MOSCOW_LAYER_TITLE = 'moscowLayer'


// Обработка нажатия на строку таблицы
$("body").on("click", "#data-tab tr", function () {
    
    const checkButtons = document.querySelectorAll('.layer-bar > input[type=radio]')
    
    var currentRow=$(this).closest("tr"); 
    
    if (checkButtons[1].checked === true) {
        var lon = currentRow.find("td:eq(2)").text();
        var lat = currentRow.find("td:eq(3)").text();
    }
    else if (checkButtons[2].checked === true) {
        var lat = currentRow.find("td:eq(6)").text();
        var lon = currentRow.find("td:eq(7)").text();
    }

    const point = fromLonLat([lon, lat]);

    flyTo(point, function () {});
});


document.addEventListener('keyup', onFilterChanged)

function onFilterChanged() {
    var filter = document.getElementById('filter-field')

    var text = filter.value

    console.log(text)
}

function loadWashingtonTable() {
    try {
        fetch("https://raw.githubusercontent.com/benbalter/dc-wifi-social/master/bars.geojson")
            .then(resp => resp.json())
            .then(data => {
                let myTab = document.getElementById('data-tab')
                let html = ''

                // Заголовки
                html += '<tr>'
                html += '<th>Название</th>'
                html += '<th>Адрес</th>'
                html += '<th>Долгота (lon)</th>'
                html += '<th>Широта (lat)</th>'
                html += '</tr>'

                // Заполнение таблицы
                for (let i = 0; i < data.features.length; i++) {
                    html += '<tr class="tab-row">'
                    html += `<td>${data.features[i].properties.name}</td>`
                    html += `<td>${data.features[i].properties.address}</td>`
                    html += `<td>${data.features[i].geometry.coordinates[0]}</td>`
                    html += `<td>${data.features[i].geometry.coordinates[1]}</td>`
                    html += '</tr>'
                }

                myTab.innerHTML = html;
            });
    }
    catch (error) {
        console.error(error);
    }
}

function loadMoscowTable() {
    try {
        const response = fetch('https://raw.githubusercontent.com/nextgis/metro4all/master/data/msk/portals.csv')
            .then(response => response.text())
            .then(v => Papa.parse(v))
            .catch(err => console.log(err))

        response.then(v => {

            var myTab = document.getElementById('data-tab')
            var html = ''

            for (let k = 0; k < v.data[0].length; k++) {
                html += `<th>${v.data[0][k]}</th>`
            }

            for (let i = 1; i < v.data.length - 1; i++) {
                html += '<tr class="tab-row">'
                for (let j = 0; j < v.data[i].length; j++) {
                    html += `<td>${v.data[i][j]}</td>`
                }
                html += '</tr>'
            }
            
            myTab.innerHTML = html
        })
    }
    catch (error) {
        console.error(error);
    }
}

function hideTable() {
    document.getElementById('data-tab').innerHTML = ''
}

function loadMoscowMarkers() {
    try {
        var markerList = []

        const response = fetch('https://raw.githubusercontent.com/nextgis/metro4all/master/data/msk/portals.csv')
            .then(response => response.text())
            .then(v => Papa.parse(v))
            .catch(err => console.log(err))

        response.then(v => {

            var latCol, lonCol
            var headers = []

            for (let h = 0; h < v.data[0].length; h++) {

                headers.push(v.data[0][h])

                if (v.data[0][h] == 'lat') {
                    latCol = h
                }
                else if (v.data[0][h] == 'lon') {
                    lonCol = h
                }
            }

            for (let i = 1; i < v.data.length - 1; i++) {

                let lat = v.data[i][latCol]
                let lon = v.data[i][lonCol]
                
                var coords = new Point(fromLonLat([lon, lat]))
                
                const point = {
                    geometry: coords
                }

                for (let j = 0; j < v.data[i].length; j++) {
                    point[headers[j]] = v.data[i][j]
                }

                var marker = new Feature(point)
                markerList.push(marker)
            }

            moscowLayer.setSource(new VectorSource({
                features: markerList,
            }))
        })
    }
    catch (error) {
        console.error(error);
    }
}

// Загрузка состояния текущей позиции
var myView = new View({})
const currentCenter = localStorage.getItem('currentCenter')
const currentZoom = localStorage.getItem('currentZoom')

if (currentCenter === null || currentZoom === null) {
    myView.setCenter(fromLonLat([-77.03934833759097, 38.89932830161759]))
    myView.setZoom(16)
}
else {
    myView.setCenter(currentCenter.split(',').map(val => parseFloat(val)))
    myView.setZoom(currentZoom)
}

// Сохранение текущей позиции
myView.on('change:center', function() { 
    let center = myView.getCenter()
    let zoom = myView.getZoom()
    localStorage.setItem('currentCenter', center)
    localStorage.setItem('currentZoom', zoom)
});

function flyTo(location, done) {
    const duration = 2000;
    const zoom = myView.getZoom();
    let parts = 2;
    let called = false;
    function callback(complete) {
      --parts;
      if (called) {
        return;
      }
      if (parts === 0 || !complete) {
        called = true;
        done(complete);
      }
    }
    myView.animate(
      {
        center: location,
        duration: duration,
      },
      callback
    );
    myView.animate(
      {
        zoom: zoom - 1,
        duration: duration / 2,
      },
      {
        zoom: zoom,
        duration: duration / 2,
      },
      callback
    );
}

const map = new Map({
    layers: [
        new Tile({
            source: new OSM(),
        })
    ],
    controls: [],
    target: 'map',
    view: myView
});

const baseLayer = new Tile({
    source: new OSM(),
    visible: true,
    title: BASE_LAYER_TITLE
});

var washingtonLayer = new VectorLayer({
    source: new VectorSource({
        url: 'https://raw.githubusercontent.com/benbalter/dc-wifi-social/master/bars.geojson',
        format: new GeoJSON()
    }),
    style: new Style({
        image: new Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: 'http://openlayers.org/en/latest/examples/data/icon.png'
        })
    }),
    visible: false,
    title: WASHINGTON_LAYER_TITLE
});

const moscowLayer = new VectorLayer({
    visible: false,
    title: MOSCOW_LAYER_TITLE,
    style: new Style({
        image: new Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: 'http://openlayers.org/en/latest/examples/data/icon.png'
        })
    }),
});

const layersGroup = new Group({
    layers: [
        baseLayer,
        washingtonLayer,
        moscowLayer
    ]
});
map.addLayer(layersGroup)

// Загрузка состояния текущего слоя
var currentLayerTitle = localStorage.getItem('currentLayerTitle')
if (currentLayerTitle != null) {

    const baseLayerElements = document.querySelectorAll('.layer-bar > input[type=radio]')
    
    switch (currentLayerTitle) {
        case BASE_LAYER_TITLE:
            baseLayerElements[0].checked = true;
            break
        case WASHINGTON_LAYER_TITLE:
            baseLayerElements[1].checked = true;
            loadWashingtonTable()
            break
        case MOSCOW_LAYER_TITLE:
            baseLayerElements[2].checked = true;
            loadMoscowTable()
            loadMoscowMarkers()
            break;
    }

    layersGroup.getLayers().forEach(function(element, index, array) {
        let layerTitle = element.get('title')
        element.setVisible(layerTitle === currentLayerTitle)
    })
}

// Переключение между слоями
const layerRadioButtons = document.querySelectorAll('.layer-bar > input[type=radio]')

for (let layerRadioButton of layerRadioButtons) {
    
    layerRadioButton.addEventListener('change', function() {

        let chosenLayerTitle = this.value
        localStorage.setItem('currentLayerTitle', chosenLayerTitle)

        layersGroup.getLayers().forEach(function(element, index, array) {
            let layerTitle = element.get('title')
            element.setVisible(layerTitle === chosenLayerTitle)
        })

        switch (chosenLayerTitle) {
            case BASE_LAYER_TITLE:
                hideTable()
                break
            case WASHINGTON_LAYER_TITLE:
                loadWashingtonTable()
                moscowOverlay.setPosition(undefined)
                break
            case MOSCOW_LAYER_TITLE:
                loadMoscowTable()
                loadMoscowMarkers()
                washingtonOverlay.setPosition(undefined)
                break;
        }
    })
}

const washingtonContainer = document.querySelector('.washington-overlay')
const washingtonOverlay = new Overlay({
    element: washingtonContainer
});

const moscowContainer = document.querySelector('.moscow-overlay')
const moscowOverlay = new Overlay({
    element: moscowContainer
});

map.addOverlay(washingtonOverlay)
map.addOverlay(moscowOverlay)

const nameField = document.getElementById('feature-name')
const addressField = document.getElementById('feature-address')
const lonField = document.getElementById('feature-lon')
const latField = document.getElementById('feature-lat')

// Washington overlay
map.on('click', function (e) {
    let clickedCoordinate = e.coordinate
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        
        washingtonOverlay.setPosition(undefined)

        let clickedFeatureName = feature.get('name')
        let clickedFeatureAddress = feature.get('address')
        let lonLat = toLonLat(feature.getGeometry().getCoordinates())
        let clickedLon = 'lon: ' + lonLat[0].toFixed(6)
        let clickedLat = 'lat: ' + lonLat[1].toFixed(6)

        washingtonOverlay.setPosition(clickedCoordinate)

        nameField.innerHTML = clickedFeatureName
        addressField.innerHTML = clickedFeatureAddress
        lonField.innerHTML = clickedLon
        latField.innerHTML = clickedLat
    },
    {
        layerFilter: function (layerCandidate) {
            return layerCandidate.get('title') === WASHINGTON_LAYER_TITLE
        }
    })
});

// Moscow overlay
map.on('click', function (e) {
    let clickedCoordinate = e.coordinate
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {

        const id_entrance = document.getElementById('id-entrance')
        const meetcode = document.getElementById('meetcode')
        const name_ru = document.getElementById('name_ru')

        moscowOverlay.setPosition(clickedCoordinate)

        id_entrance.innerHTML = feature.get('id_entrance')
        meetcode.innerHTML = feature.get('meetcode')
        name_ru.innerHTML = feature.get('name_ru')
    },
    {
        layerFilter: function (layerCandidate) {
            return layerCandidate.get('title') === MOSCOW_LAYER_TITLE
        }
    })
});

map.on('moveend', function (e) {
    washingtonOverlay.setPosition(undefined)
    moscowOverlay.setPosition(undefined)
});