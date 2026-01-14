
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('C:/Users/gabriel.palazini/Documents/Melhoria Contínua/CI - Group/Framework/opex-action-plans/web/src/locales/en/common.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('C:/Users/gabriel.palazini/Documents/Melhoria Contínua/CI - Group/Framework/opex-action-plans/web/src/locales/pt/common.json', 'utf8'));

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const k in obj) {
        if (typeof obj[k] === 'object' && obj[k] !== null) {
            keys = keys.concat(getKeys(obj[k], prefix + k + '.'));
        } else {
            keys.push(prefix + k);
        }
    }
    return keys;
}

const enKeys = getKeys(en);
const ptKeys = getKeys(pt);

const missingInPt = enKeys.filter(k => !ptKeys.includes(k));
const missingInEn = ptKeys.filter(k => !enKeys.includes(k));

console.log('Missing in PT:', missingInPt);
console.log('Missing in EN:', missingInEn);
