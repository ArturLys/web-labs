const { URL, URLSearchParams } = require('url');

const currency = 'jpy';
const exact_date = '20240127';

const nbuUrl = new URL("/NBU_Exchange/exchange_site", "https://bank.gov.ua/");

const params = new URLSearchParams({
    start: exact_date,
    end: exact_date,
    valcode: currency,
    sort: 'exchangedate',
    order: 'desc',
    json: ''
});

nbuUrl.search = params.toString();
console.log(nbuUrl.toString());
