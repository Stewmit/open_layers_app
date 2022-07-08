import 'ol/ol.css';
import Tile from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
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


const BASE_LAYER_TITLE = 'baseLayer'
const WASHINGTON_LAYER_TITLE = 'washingtonLayer'
const MOSCOW_LAYER_TITLE = 'moscowLayer'


// Обработка нажатия на строку таблицы
$("body").on("click", "#data-tab tr", function () {
    var currentRow=$(this).closest("tr"); 
    var lon = currentRow.find("td:eq(2)").text();
    var lat = currentRow.find("td:eq(3)").text();

    const point = fromLonLat([lon, lat]);

    flyTo(point, function () {});
});

// Загрузка таблицы из 1-ого файла
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

// Загрузка таблицы из 2-ого файла
function loadMoscowTable() {
    try {
        const response = fetch('https://raw.githubusercontent.com/nextgis/metro4all/master/data/msk/portals.csv')
            .then(response => response.text())
            .then(v => Papa.parse(v))
            .catch(err => console.log(err))

        response.then(v => {

            var myTab = document.getElementById('data-tab')
            var html = ''
            
            // for (let i = 0; i < v.data.length/1000; i++) {
            //     html += '<tr>'
            //     for (let j = 0; j < v.data[i].length; j++) {
            //         html += `<td>${v.data[i][j]}</td>`
            //     }
            //     html += '</tr>'
            // }
            
            // Заголовки
            // html += '<tr>'
            // for (let i = 0; v.data[1].length; i++) {
            //     html += `<th>${v.data[1][i]}</th>`
            //     console.log(v.data[1][i])
            // }
            // html += '</tr>'

            for (let k = 0; k < v.data[0].length; k++) {
                html += `<th>${v.data[0][k]}</th>`
            }

            for (let i = 1; i < v.data.length - 1; i++) {
                html += '<tr>'
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

// Скрытть таблицу
function hideTable() {
    document.getElementById('data-tab').innerHTML = ''
}

// Загрузка состояния текущей позиции
var myView = new View({})
myView.setCenter(fromLonLat([-77.03934833759097, 38.89932830161759]))
myView.setZoom(16)
// const currentCenter = localStorage.getItem('currentCenter')
// const currentZoom = localStorage.getItem('currentZoom')
// if (currentCenter === null || currentZoom === null) {
//     myView.setCenter(fromLonLat([-77.03934833759097, 38.89932830161759]))
//     myView.setZoom(16)
// }
// else {
//     myView.setCenter(currentCenter.split(',').map(val => parseFloat(val)))
//     myView.setZoom(currentZoom)
// }

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

const moscowLayer = new Tile({
    source: new Stamen({layer: 'watercolor'}),
    visible: false,
    title: MOSCOW_LAYER_TITLE
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
                hideTable()
                loadWashingtonTable()
                break
            case MOSCOW_LAYER_TITLE:
                hideTable()
                loadMoscowTable()
                break;
        }
    })
}

// Всплывающее окно
const overlayContainerElement = document.querySelector('.overlay-container')
const overlayLayer = new Overlay({
    element: overlayContainerElement
});
map.addOverlay(overlayLayer)

// Обработка нажатия на маркер 2-ого слоя
const overlayFeatureName = document.getElementById('feature-name')
const overlayFeatureAddress = document.getElementById('feature-address')

map.on('click', function (e) {
    let clickedCoordinate = e.coordinate
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        overlayLayer.setPosition(undefined)
        let clickedFeatureName = feature.get('name')
        let clickedFeatureAddress = feature.get('address')
        overlayLayer.setPosition(clickedCoordinate)
        overlayFeatureName.innerHTML = clickedFeatureName
        overlayFeatureAddress.innerHTML = clickedFeatureAddress
    },
    {
        layerFilter: function (layerCandidate) {
            return layerCandidate.get('title') === WASHINGTON_LAYER_TITLE
        }
    })
});