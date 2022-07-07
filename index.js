import 'ol/ol.css';
import Tile from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Stamen} from 'ol/source';
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


function loadFirstDataTable() {
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
                    // console.log((data.features[i]))
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

function hideTable() {
    document.getElementById('data-tab').innerHTML = ''
} 

function getCurrentLonLat() {
    return localStorage.getItem('currentCenter').split(',').map(val => parseFloat(val))
}

var myView = new View({})

if (localStorage.getItem('currentCenter') === null || localStorage.getItem('currentZoom') === null) {
    myView.setCenter(fromLonLat([-77.03934833759097, 38.89932830161759]))
    myView.setZoom(localStorage.getItem('currentZoom'))
}
else {
    myView.setCenter(getCurrentLonLat())
    myView.setZoom(localStorage.getItem('currentZoom'))
}

myView.on('change:center', function() { 
    let center = myView.getCenter()
    let zoom = myView.getZoom()
    localStorage.setItem('currentCenter', center)
    localStorage.setItem('currentZoom', zoom)
    console.log(localStorage.getItem('currentZoom'))
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

// Обработка нажатия на строку таблицы
$("body").on("click", "#data-tab tr", function () {
    var currentRow=$(this).closest("tr"); 
    var lon = currentRow.find("td:eq(2)").text();
    var lat = currentRow.find("td:eq(3)").text();

    const point = fromLonLat([lon, lat]);

    flyTo(point, function () {});
});

// Создание карты
const map = new Map({
    layers: [
        new Tile({
            source: new OSM(),
        })
    ],
    target: 'map',
    view: myView
});

// 1. Стандартный слой с картой
const baseLayer = new Tile({
    source: new OSM(),
    visible: true,
    title: 'baseLayer'
});

// 2. Слой с маркерами из 1-ого файла
var firstFileLayer = new VectorLayer({
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
    title: 'firstFileLayer'
});

// 3. Слой с маркерами из 2-ого файла
const secondFileLayer = new Tile({
    source: new Stamen({layer: 'watercolor'}),
    visible: false,
    title: 'secondFileLayer'
});

// Группа слоёв
const baseLayerGroup = new Group({
    layers: [
        baseLayer,
        firstFileLayer,
        secondFileLayer
    ]
});

map.addLayer(baseLayerGroup)

// Загрузка состояния текущего слоя
if (localStorage.getItem('currentLayer') != null) {

    const baseLayerElements = document.querySelectorAll('.layer-bar > input[type=radio]')
    if (localStorage.getItem('currentLayer') == 'baseLayer') {
        baseLayerElements[0].checked = true;
    }

    if (localStorage.getItem('currentLayer') == 'firstFileLayer') {
        baseLayerElements[1].checked = true;
    }

    if (localStorage.getItem('currentLayer') == 'secondFileLayer') {
        baseLayerElements[2].checked = true;
    }

    baseLayerGroup.getLayers().forEach(function(element, index, array) {
        let layerTitle = element.get('title')
        element.setVisible(layerTitle === localStorage.getItem('currentLayer'))

        if (localStorage.getItem('currentLayer') === 'firstFileLayer') {
            loadFirstDataTable()
        }
        else {
            hideTable()
        }
    })
}

// Переключение между слоями
const baseLayerElements = document.querySelectorAll('.layer-bar > input[type=radio]')
for (let baseLayerElement of baseLayerElements) {
    baseLayerElement.addEventListener('change', function(){
        let baseLayerElementValue = this.value
        localStorage.setItem('currentLayer', baseLayerElementValue)
        // console.log(localStorage.getItem('currentLayer'))

        baseLayerGroup.getLayers().forEach(function(element, index, array) {
            let layerTitle = element.get('title')
            element.setVisible(layerTitle === baseLayerElementValue)
            if (baseLayerElementValue === 'firstFileLayer') {
                loadFirstDataTable()
            }
            else {
                hideTable()
            }
        })
    })
}

// Всплывающее окно
const overlayContainerElement = document.querySelector('.overlay-container')
const overlayLayer = new Overlay({
    element: overlayContainerElement
});
map.addOverlay(overlayLayer)

// Поля во всплывающем окне
const overlayFeatureName = document.getElementById('feature-name')
const overlayFeatureAddress = document.getElementById('feature-address')

// Обработка нажатия на маркер из 1-ого файла
map.on('click', function (e) {
    let clickedCoordinate = e.coordinate
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        overlayLayer.setPosition(undefined)
        let clickedFeatureName = feature.get('name')
        let clickedFeatureAddress = feature.get('address')
        // let clickedFeatureGeometry = feature.get('geometry')
        overlayLayer.setPosition(clickedCoordinate)
        overlayFeatureName.innerHTML = clickedFeatureName
        overlayFeatureAddress.innerHTML = clickedFeatureAddress
    },
    {
        layerFilter: function (layerCandidate) {
            return layerCandidate.get('title') === 'firstFileLayer'
        }
    })
});