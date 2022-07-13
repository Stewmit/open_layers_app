import { Feature } from 'ol/index'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'

import * as filterModule from './filter'
import * as constants from '../resources/constants'
import * as tableModule from './tables'
import * as layersResource from '../resources/layers'

export function loadWashingtonMarkers() {
    try {
        var markerList = []

        fetch("https://raw.githubusercontent.com/benbalter/dc-wifi-social/master/bars.geojson")
            .then(response => response.json())
            .then(data => {

                for (let feature of data.features) {

                    let name = feature.properties.name

                    if (filterModule.checkFieldForFilter(name, constants.WASHINGTON_FILTER_STORAGE_KEY)) {

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

                layersResource.washingtonLayer.setSource(new VectorSource({
                    features: markerList,
                }))
            })
    }
    catch (error) {
        console.error(error);
    }
}

export function loadMoscowMarkers() {
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
                if (filterModule.checkFieldForFilter(name_ru, constants.MOSCOW_FILTER_STORAGE_KEY)) {

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

            layersResource.moscowLayer.setSource(new VectorSource({
                features: markerList,
            }))
        })
    }
    catch (error) {
        console.error(error);
    }
}