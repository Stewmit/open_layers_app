import * as tableModule from './tables'
import * as markerModule from './markers'
import * as constants from '../resources/constants'

export function checkFieldForFilter(field, filterKey) {
    let filterText = localStorage.getItem(filterKey)
    if (filterText === null) filterText = ''
    return field.includes(filterText)
}

export function onFilterChanged() {
    let layerRadioButtons = document.querySelectorAll('.layer-bar > input[type=radio]')
    let filter = document.getElementById('filter-field')
    let filterText = filter.value

    if (layerRadioButtons[1].checked === true) {
        localStorage.setItem(constants.WASHINGTON_FILTER_STORAGE_KEY, filterText)
        markerModule.loadWashingtonMarkers()
        tableModule.loadWashingtonTable() 
    }
    else if (layerRadioButtons[2].checked === true) {
        localStorage.setItem(constants.MOSCOW_FILTER_STORAGE_KEY, filterText)
        markerModule.loadMoscowMarkers()
        tableModule.loadMoscowTable()
    }
}