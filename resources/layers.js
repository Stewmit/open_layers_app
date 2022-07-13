import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'
import OSM from 'ol/source/OSM'
import Tile from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import { Group } from 'ol/layer'

import * as constants from './constants'

const markerStyle = new Style({
    image: new Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: 'http://openlayers.org/en/latest/examples/data/icon.png'
    })
})

export const baseLayer = new Tile({
    source: new OSM(),
    visible: true,
    title: constants.BASE_LAYER_TITLE
})

export const washingtonLayer = new VectorLayer({
    visible: false,
    style: markerStyle,
    title: constants.WASHINGTON_LAYER_TITLE
})

export const moscowLayer = new VectorLayer({
    visible: false,
    style: markerStyle,
    title: constants.MOSCOW_LAYER_TITLE
})

export const layersGroup = new Group({
    layers: [
        baseLayer,
        washingtonLayer,
        moscowLayer
    ]
})