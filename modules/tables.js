import * as resources from '../resources'
import * as filterModule from '../filter'

export var moscowHeaders = []

function getWashingtonHeaders() {
    let html = ''
    html += '<tr>'
    html += '<th>Name</th>'
    html += '<th>Address</th>'
    html += '<th>Longitude</th>'
    html += '<th>Latitude</th>'
    html += '</tr>'
    return html
}

export function loadWashingtonTable() {
    try {
        fetch("https://raw.githubusercontent.com/benbalter/dc-wifi-social/master/bars.geojson")
            .then(response => response.json())
            .then(data => {

                let table = document.getElementById('data-table')
                let html = getWashingtonHeaders()

                for (let feature of data.features) {

                    let name = feature.properties.name

                    if (filterModule.checkFieldForFilter(name, resources.WASHINGTON_FILTER_STORAGE_KEY)) {
                        html += '<tr class="tab-row">'
                        html += `<td>${name}</td>`
                        html += `<td>${feature.properties.address}</td>`
                        html += `<td>${feature.geometry.coordinates[0]}</td>`
                        html += `<td>${feature.geometry.coordinates[1]}</td>`
                        html += '</tr>'
                    }
                }

                table.innerHTML = html
            })
    }
    catch (error) {
        console.error(error)
    }
}

export function loadMoscowTable() {
    try {
        fetch('https://raw.githubusercontent.com/nextgis/metro4all/master/data/msk/portals.csv')
            .then(response => response.text())
            .then(v => Papa.parse(v))
            .then(v => {

                let table = document.getElementById('data-table')
                let html = ''
                moscowHeaders = []

                html += '<tr>'
                for (let i = 0; i < v.data[0].length; i++) {
                    let header = v.data[0][i]
                    html += `<th>${header}</th>`
                    moscowHeaders.push(header)
                }
                html += '</tr>'

                for (let i = 1; i < v.data.length - 1; i++) {
                    let name = v.data[i][2]
                    if (filterModule.checkFieldForFilter(name, resources.MOSCOW_FILTER_STORAGE_KEY)) {
                        html += '<tr class="tab-row">'
                        for (let j = 0; j < v.data[i].length; j++) {
                            html += `<td>${v.data[i][j]}</td>`
                        }
                        html += '</tr>'
                    }
                }
            
                table.innerHTML = html
            })
    }
    catch (error) {
        console.error(error)
    }
}

export function hideTable() {
    document.getElementById('data-table').innerHTML = ''
}