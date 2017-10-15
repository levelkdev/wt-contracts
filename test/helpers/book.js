const privateCallLib = require('./privateCall');
const hotelLib = require('./hotel');

const WTHotel = artifacts.require('Hotel.sol')
const WTIndex = artifacts.require('WTIndex.sol');
const LifToken = artifacts.require('LifToken.sol');
const Unit = artifacts.require('Unit.sol')

const typeName = 'BASIC_ROOM';

let index;
let hotel;
let unitType;
let stubData;
let accounts;

async function initializeHotel(hotelAccount){
  index = await WTIndex.new();
  hotel = await hotelLib.createHotel(index, hotelAccount);
  unitType = await hotelLib.addUnitTypeToHotel(index, hotel, typeName, hotelAccount);
  stubData = index.contract.getHotels.getData();
}

async function bookInstantly(client, hotelAccount, accounts, fromDay, daysAmount, unitPrice) {
  await initializeHotel(hotelAccount);
  const unit = await hotelLib.addUnitToHotel(index, hotel, typeName, hotelAccount, false);

  const args = [
    hotel,
    unit,
    client,
    fromDay,
    daysAmount,
    unitPrice,
    'approveData',
    accounts,
    stubData
  ];
  const result = await privateCallLib.runBeginCall(...args);

  result.hotel = hotel;
  result.index = index;
  result.unit = unit;
  return result;
}

module.exports = {
  bookInstantly: bookInstantly
}