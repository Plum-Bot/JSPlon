/**
 * @param {string[]} list
 */
function Enum(list) {
    return list.reduce((obj, value) => {
        obj[value] = value;
        return obj
    }, {})
}

module.exports = Enum;