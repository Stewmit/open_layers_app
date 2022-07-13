import 'ol/ol.css'
import Tile from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Group } from 'ol/layer'
import Map from 'ol/Map'
import View from 'ol/View'
import Style from 'ol/style/Style'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Icon from 'ol/style/Icon'
import GeoJSON from 'ol/format/GeoJSON'
import { Overlay } from 'ol'
import $, { data } from "jquery"
import { Feature } from 'ol/index'
import {Point} from 'ol/geom'

import * as tableModule from './modules/tables'
import * as resources from './resources'
import * as filterModule from './modules/filter'

const layerRadioButtons = document.querySelectorAll('.layer-bar > input[type=radio]')
const mapElement = document.getElementById('map')
const filter = document.getElementById('filter-field')
filter.addEventListener('input', onFilterChanged)

function loadWashingtonMarkers() {
    try {
        var markerList = []

        fetch("https://raw.githubusercontent.com/benbalter/dc-wifi-social/master/bars.geojson")
            .then(response => response.json())
            .then(data => {

                for (let feature of data.features) {

                    let name = feature.properties.name

                    if (filterModule.checkFieldForFilter(name, resources.WASHINGTON_FILTER_STORAGE_KEY)) {

                        var coords = new Point(fromLonLat([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]))

                        const point = {
                            geometry: coords
                        }

                        point['name'] = feature.properties.name
                        point['address'] = feature.properties.address
        
                        var marker = new Feature(point)
                        markerList.push(marker)
                    }
                }

                washingtonLayer.setSource(new VectorSource({
                    features: markerList,
                }))
            })
    }
    catch (error) {
        console.error(error);
    }
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

            for (let h = 0; h < v.data[0].length; h++) {

                if (v.data[0][h] == 'lat') {
                    latCol = h
                }
                else if (v.data[0][h] == 'lon') {
                    lonCol = h
                }
            }

            for (let i = 1; i < v.data.length - 1; i++) {

                let name_ru = v.data[i][2]
                if (filterModule.checkFieldForFilter(name_ru, resources.MOSCOW_FILTER_STORAGE_KEY)) {

                    let lat = v.data[i][latCol]
                    let lon = v.data[i][lonCol]

                    var coords = new Point(fromLonLat([lon, lat]))
                
                    const point = {
                        geometry: coords
                    }

                    for (let j = 0; j < tableModule.moscowHeaders.length; j++) {
                        point[tableModule.moscowHeaders[j]] = v.data[i][j]
                    }

                    var marker = new Feature(point)
                    markerList.push(marker)
                }
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

function onFilterChanged() {

    var filter = document.getElementById('filter-field')
    var filterText = filter.value

    if (layerRadioButtons[1].checked === true) {
        localStorage.setItem(resources.WASHINGTON_FILTER_STORAGE_KEY, filterText)
        tableModule.loadWashingtonTable() 
        loadWashingtonMarkers()
    }
    else if (layerRadioButtons[2].checked === true) {
        localStorage.setItem(resources.MOSCOW_FILTER_STORAGE_KEY, filterText)
        tableModule.loadMoscowTable()
        loadMoscowMarkers() 
    }
}

function getLonLats(layer, filterField, storageKey) {

    let source = layer.getSource()
    let features = source.getFeatures()

    let lonLats = []

    for (let feature of features) {
        
        let field = feature.get(filterField)

        if (filterModule.checkFieldForFilter(field, storageKey)) {
            lonLats.push(feature.getGeometry().getCoordinates())
        }
    }

    return lonLats
}

function getWashingtonData() {
    let result = []

    for (let feature of washingtonLayer.getSource().getFeatures()) {
        
        let name = feature.get('name')

        if (filterModule.checkFieldForFilter(name, resources.WASHINGTON_FILTER_STORAGE_KEY)) {
            let dataList = []
            dataList.push(name)
            dataList.push(feature.get('address'))
            dataList.push('lon: ' + toLonLat(feature.getGeometry().getCoordinates())[0])
            dataList.push('lat: ' + toLonLat(feature.getGeometry().getCoordinates())[1])
            result.push(dataList)
        }
    }

    return result
}

function getMoscowData() {
    let result = []

    for (let feature of moscowLayer.getSource().getFeatures()) {
        
        let name_ru = feature.get('name_ru')

        if (filterModule.checkFieldForFilter(name_ru, resources.MOSCOW_FILTER_STORAGE_KEY)) {
            let dataList = []
            dataList.push(name_ru)
            dataList.push('station id: ' + feature.get('id_station'))
            dataList.push('diresction: ' + feature.get('direction'))
            dataList.push('lon: ' + feature.get('lon'))
            dataList.push('lat: ' + feature.get('lat'))
            result.push(dataList)
        }
    }

    return result
}

function fillWashingtonOverlay(dataList) {

    let nameField = document.getElementById('washington-name')
    let addressField = document.getElementById('washington-address')
    let lonField = document.getElementById('washington-lon')
    let latField = document.getElementById('washington-lat')

    let fieldsList = [nameField, addressField, lonField, latField]

    for (let i = 0; i < fieldsList.length; i++) {
        fieldsList[i].innerHTML = dataList[i]
    }
}

function fillMoscowOverlay(dataList) {
    let name_ru = document.getElementById('name_ru')
    let id_station = document.getElementById('id_station')
    let direction = document.getElementById('direction')
    let mos_lon = document.getElementById('m-lon')
    let mos_lat = document.getElementById('m-lat')

    let fieldsList = [name_ru, id_station, direction, mos_lon, mos_lat]

    for (let i = 0; i < fieldsList.length; i++) {
        fieldsList[i].innerHTML = dataList[i]
    }
}

function flyTo(location, done) {
    const duration = 2000
    const zoom = myView.getZoom()
    let parts = 2
    let called = false

    function callback(complete) {
        --parts;
        if (called) {
            return
        }
        if (parts === 0 || !complete) {
            called = true
            done(complete)
        }
    }

    myView.animate(
        {
            center: location,
            duration: duration
        },
        callback
    )

    myView.animate(
        {
            zoom: zoom - 1,
            duration: duration / 2
        },
        {
            zoom: zoom,
            duration: duration / 2,
        },
        callback
    )
}

function present() {
    let locations, myData

    if (layerRadioButtons[0].checked === true) {
        return
    }
    if (layerRadioButtons[1].checked === true) {
        locations = getLonLats(washingtonLayer, 'name', resources.WASHINGTON_FILTER_STORAGE_KEY)
        myData = getWashingtonData()
    }
    else if (layerRadioButtons[2].checked === true) {
        locations = getLonLats(moscowLayer, 'name_ru', resources.MOSCOW_FILTER_STORAGE_KEY)
        myData = getMoscowData()
    }

    let index = -1
    function next(more) {
        if (more) {
            ++index
            if (index < locations.length) {
                const delay = index === 0 ? 0 : 750
                setTimeout(function () {
                    flyTo(locations[index], next)
                    if (layerRadioButtons[1].checked === true) {
                        fillWashingtonOverlay(myData[index])
                        washingtonOverlay.setPosition(locations[index])
                    }
                    else if (layerRadioButtons[2].checked === true) {
                        fillMoscowOverlay(myData[index])
                        moscowOverlay.setPosition(locations[index])
                    }
                }, delay)
            } 
            else {
                alert('Tour complete')
            }
        } 
        else {
            alert('Tour cancelled')
        }
    }
    next(true);
}

// Handling clicks on a table row
$("body").on("click", "#data-table tr", function () {
    
    var currentRow=$(this).closest("tr")
    
    if (layerRadioButtons[1].checked === true) {
        var lon = currentRow.find("td:eq(2)").text()
        var lat = currentRow.find("td:eq(3)").text()
    }
    else if (layerRadioButtons[2].checked === true) {
        var lat = currentRow.find("td:eq(6)").text()
        var lon = currentRow.find("td:eq(7)").text()
    }

    const point = fromLonLat([lon, lat])

    flyTo(point, function () {})
})

// Load current position state
var myView = new View({})
const currentCenter = localStorage.getItem(resources.CURRENT_CENTER_STORAGE_KEY)
const currentZoom = localStorage.getItem(resources.CURRENT_ZOOM_STORAGE_KEY)

if (currentCenter === null || currentZoom === null) {
    myView.setCenter(fromLonLat([-77.03934833759097, 38.89932830161759]))
    myView.setZoom(16)
}
else {
    myView.setCenter(currentCenter.split(',').map(val => parseFloat(val)))
    myView.setZoom(currentZoom)
}

// Save current position
myView.on('change:center', function() { 
    let center = myView.getCenter()
    let zoom = myView.getZoom()
    localStorage.setItem(resources.CURRENT_CENTER_STORAGE_KEY, center)
    localStorage.setItem(resources.CURRENT_ZOOM_STORAGE_KEY, zoom)
})

const map = new Map({
    layers: [
        new Tile({
            source: new OSM(),
        })
    ],
    controls: [],
    target: 'map',
    view: myView
})

const markerStyle = new Style({
    image: new Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: 'http://openlayers.org/en/latest/examples/data/icon.png'
    })
})

const baseLayer = new Tile({
    source: new OSM(),
    visible: true,
    title: resources.BASE_LAYER_TITLE
})

const washingtonLayer = new VectorLayer({
    visible: false,
    style: markerStyle,
    title: resources.WASHINGTON_LAYER_TITLE
})

const moscowLayer = new VectorLayer({
    visible: false,
    style: markerStyle,
    title: resources.MOSCOW_LAYER_TITLE
})

const layersGroup = new Group({
    layers: [
        baseLayer,
        washingtonLayer,
        moscowLayer
    ]
})

map.addLayer(layersGroup)

// Loading the state of the current layer
var currentLayerTitle = localStorage.getItem(resources.CURRENT_LAYER_STORGE_KEY)
if (currentLayerTitle != null) {

    let tableContainer = document.getElementById('table-container')
    let filter = document.getElementById('filter-field')

    let filterText
    
    switch (currentLayerTitle) {
        case resources.BASE_LAYER_TITLE:
            layerRadioButtons[0].checked = true;
            tableContainer.style.display = 'none'
            mapElement.style.height = '100vh'
            map.updateSize()
            break
        case resources.WASHINGTON_LAYER_TITLE:
            layerRadioButtons[1].checked = true;
            tableContainer.style.display = 'block'
            localStorage.getItem('washingtonFilterText') === null ? filterText = '' : 
                filterText = localStorage.getItem('washingtonFilterText')
            filter.value = filterText
            tableModule.loadWashingtonTable()
            loadWashingtonMarkers()
            mapElement.style.height = '60vh'
            map.updateSize()
            break
        case resources.MOSCOW_LAYER_TITLE:
            layerRadioButtons[2].checked = true;
            tableContainer.style.display = 'block'

            filterText = localStorage.getItem(resources.MOSCOW_FILTER_STORAGE_KEY)
            if (filterText === null) filterText = ''
            filter.value = filterText

            tableModule.loadMoscowTable()
            loadMoscowMarkers()
            mapElement.style.height = '60vh'
            map.updateSize()
            break;
    }

    layersGroup.getLayers().forEach(function(element, index, array) {
        let layerTitle = element.get('title')
        element.setVisible(layerTitle === currentLayerTitle)
    })
}

// Switching layers
for (let layerRadioButton of layerRadioButtons) {
    
    layerRadioButton.addEventListener('change', function() {

        let chosenLayerTitle = this.value
        localStorage.setItem('currentLayerTitle', chosenLayerTitle)

        layersGroup.getLayers().forEach(function(element, index, array) {
            let layerTitle = element.get('title')
            element.setVisible(layerTitle === chosenLayerTitle)
        })

        let filter = document.getElementById('filter-field')
        let tableContainer = document.getElementById('table-container')
        let filterText

        switch (chosenLayerTitle) {
            case resources.BASE_LAYER_TITLE:
                tableModule.hideTable()
                tableContainer.style.display = 'none'
                mapElement.style.height = '100vh'
                filter.value = ''
                break
            case resources.WASHINGTON_LAYER_TITLE:
                tableModule.loadWashingtonTable()
                loadWashingtonMarkers()
                moscowOverlay.setPosition(undefined)
                tableContainer.style.display = 'block'
                mapElement.style.height = '60vh'
                localStorage.getItem('washingtonFilterText') === null ? filterText = '' : 
                    filterText = localStorage.getItem('washingtonFilterText')
                filter.value = filterText
                break
            case resources.MOSCOW_LAYER_TITLE:
                tableModule.loadMoscowTable()
                loadMoscowMarkers()
                washingtonOverlay.setPosition(undefined)
                tableContainer.style.display = 'block'
                mapElement.style.height = '60vh'
                localStorage.getItem('moscowFilterText') === null ? filterText = '' : 
                    filterText = localStorage.getItem('moscowFilterText')
                filter.value = filterText
                break
        }
        map.updateSize()
    })
}

let washingtonContainer = document.querySelector('.washington-overlay')
let washingtonOverlay = new Overlay({element: washingtonContainer})
map.addOverlay(washingtonOverlay)

let moscowContainer = document.querySelector('.moscow-overlay')
let moscowOverlay = new Overlay({element: moscowContainer})
map.addOverlay(moscowOverlay)

// On Washington marker click
map.on('click', function (e) {
    let clickedCoordinate = e.coordinate
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {

        washingtonOverlay.setPosition(clickedCoordinate)

        let dataList = []

        dataList.push(feature.get('name'))
        dataList.push(feature.get('address'))
        let lonLat = toLonLat(feature.getGeometry().getCoordinates())
        dataList.push('lon: ' + lonLat[0].toFixed(6))
        dataList.push('lat: ' + lonLat[1].toFixed(6))

        fillWashingtonOverlay(dataList)
    },
    {
        layerFilter: function (layerCandidate) {
            return layerCandidate.get('title') === resources.WASHINGTON_LAYER_TITLE
        }
    })
})

// On Moskow marker click
map.on('click', function (e) {
    let clickedCoordinate = e.coordinate
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {

        moscowOverlay.setPosition(clickedCoordinate)

        let dataList = []

        dataList.push(feature.get('name_ru'))
        dataList.push('station id: ' + feature.get('id_station'))
        dataList.push('direction: ' + feature.get('direction'))
        dataList.push('lon: ' + feature.get('lon'))
        dataList.push('lat: ' + feature.get('lat'))

        fillMoscowOverlay(dataList)
    },
    {
        layerFilter: function (layerCandidate) {
            return layerCandidate.get('title') === resources.MOSCOW_LAYER_TITLE
        }
    })
})

map.on('moveend', function (e) {
    washingtonOverlay.setPosition(undefined)
    moscowOverlay.setPosition(undefined)
})

map.on('pointermove', function(e) {
    var pixel = map.getEventPixel(e.originalEvent)
    var hit = map.hasFeatureAtPixel(pixel)
    map.getViewport().style.cursor = hit ? 'pointer' : ''
})

document.getElementById('present').addEventListener('click', present)