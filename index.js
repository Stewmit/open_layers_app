import 'ol/ol.css'
import Tile from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, toLonLat } from 'ol/proj'
import Map from 'ol/Map'
import View from 'ol/View'
import { Overlay } from 'ol'
import $ from 'jquery'

import * as constants from './resources/constants'
import * as layersResource from './resources/layers'
import * as tableModule from './modules/tables'
import * as filterModule from './modules/filter'
import * as markerModule from './modules/markers'

const layerRadioButtons = document.querySelectorAll('.layer-bar > input[type=radio]')
const mapElement = document.getElementById('map')
const filter = document.getElementById('filter-field')

filter.addEventListener('input', filterModule.onFilterChanged)

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

    for (let feature of layersResource.washingtonLayer.getSource().getFeatures()) {
        
        let name = feature.get('name')

        if (filterModule.checkFieldForFilter(name, constants.WASHINGTON_FILTER_STORAGE_KEY)) {
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

    for (let feature of layersResource.moscowLayer.getSource().getFeatures()) {
        
        let name_ru = feature.get('name_ru')

        if (filterModule.checkFieldForFilter(name_ru, constants.MOSCOW_FILTER_STORAGE_KEY)) {
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
        locations = getLonLats(layersResource.washingtonLayer, 'name', constants.WASHINGTON_FILTER_STORAGE_KEY)
        myData = getWashingtonData()
    }
    else if (layerRadioButtons[2].checked === true) {
        locations = getLonLats(layersResource.moscowLayer, 'name_ru', constants.MOSCOW_FILTER_STORAGE_KEY)
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

// Loading current position on page refresh
var myView = new View({})
const currentCenter = localStorage.getItem(constants.CURRENT_CENTER_STORAGE_KEY)
const currentZoom = localStorage.getItem(constants.CURRENT_ZOOM_STORAGE_KEY)

if (currentCenter === null || currentZoom === null) {
    myView.setCenter(fromLonLat([-77.03934833759097, 38.89932830161759]))
    myView.setZoom(16)
}
else {
    myView.setCenter(currentCenter.split(',').map(val => parseFloat(val)))
    myView.setZoom(currentZoom)
}

// Saving current position
myView.on('change:center', function() { 
    let center = myView.getCenter()
    let zoom = myView.getZoom()
    localStorage.setItem(constants.CURRENT_CENTER_STORAGE_KEY, center)
    localStorage.setItem(constants.CURRENT_ZOOM_STORAGE_KEY, zoom)
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

map.addLayer(layersResource.layersGroup)

// Loading the state of the current layer
var currentLayerTitle = localStorage.getItem(constants.CURRENT_LAYER_STORGE_KEY)
if (currentLayerTitle != null) {

    let tableContainer = document.getElementById('table-container')
    let filter = document.getElementById('filter-field')
    let filterText
    
    switch (currentLayerTitle) {
        case constants.BASE_LAYER_TITLE:
            layerRadioButtons[0].checked = true
            tableContainer.style.display = 'none'
            mapElement.style.height = '100vh'
            map.updateSize()
            break
        case constants.WASHINGTON_LAYER_TITLE:
            layerRadioButtons[1].checked = true
            tableContainer.style.display = 'block'
            mapElement.style.height = '60vh'
            map.updateSize()

            filterText = localStorage.getItem(constants.WASHINGTON_FILTER_STORAGE_KEY)
            filterText === null ? filter.value = '' : filter.value = filterText
            tableModule.loadWashingtonTable()
            markerModule.loadWashingtonMarkers()
            break
        case constants.MOSCOW_LAYER_TITLE:
            layerRadioButtons[2].checked = true
            tableContainer.style.display = 'block'
            mapElement.style.height = '60vh'
            map.updateSize()
            
            filterText = localStorage.getItem(constants.MOSCOW_FILTER_STORAGE_KEY)
            filterText === null ? filter.value = '' : filter.value = filterText
            tableModule.loadMoscowTable()
            markerModule.loadMoscowMarkers()
            break
    }

    layersResource.layersGroup.getLayers().forEach(function(element, index, array) {
        let layerTitle = element.get('title')
        element.setVisible(layerTitle === currentLayerTitle)
    })
}

// Switching layers
for (let layerRadioButton of layerRadioButtons) {
    
    layerRadioButton.addEventListener('change', function() {

        let chosenLayerTitle = this.value
        localStorage.setItem(constants.CURRENT_LAYER_STORGE_KEY, chosenLayerTitle)

        layersResource.layersGroup.getLayers().forEach(function(element, index, array) {
            let layerTitle = element.get('title')
            element.setVisible(layerTitle === chosenLayerTitle)
        })

        let filter = document.getElementById('filter-field')
        let tableContainer = document.getElementById('table-container')
        let filterText

        switch (chosenLayerTitle) {
            case constants.BASE_LAYER_TITLE:
                tableModule.hideTable()
                tableContainer.style.display = 'none'
                mapElement.style.height = '100vh'
                filter.value = ''
                break
            case constants.WASHINGTON_LAYER_TITLE:
                tableContainer.style.display = 'block'
                mapElement.style.height = '60vh'

                filterText = localStorage.getItem(constants.WASHINGTON_FILTER_STORAGE_KEY)
                filterText === null ? filter.value = '' : filter.value = filterText
            
                tableModule.loadWashingtonTable()
                markerModule.loadWashingtonMarkers()
                moscowOverlay.setPosition(undefined)
                break
            case constants.MOSCOW_LAYER_TITLE:
                tableContainer.style.display = 'block'
                mapElement.style.height = '60vh'

                filterText = localStorage.getItem(constants.MOSCOW_FILTER_STORAGE_KEY)
                filterText === null ? filter.value = '' : filter.value = filterText

                tableModule.loadMoscowTable()
                markerModule.loadMoscowMarkers()
                washingtonOverlay.setPosition(undefined)
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

// On Washington marker click handler
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
            return layerCandidate.get('title') === constants.WASHINGTON_LAYER_TITLE
        }
    })
})

// Moskow marker click handler
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
            return layerCandidate.get('title') === constants.MOSCOW_LAYER_TITLE
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