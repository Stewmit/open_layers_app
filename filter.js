export function checkFieldForFilter(field, filterKey) {

    let filterText = localStorage.getItem(filterKey)
    if (filterText === null) filterText = ''
    return field.includes(filterText)
}