const assert = require('chai').assert;
const help = require('./helpers/index.js');
const abiDecoder = require('abi-decoder');

const WTHotel = artifacts.require('Hotel.sol')
const WTIndex = artifacts.require('WTIndex.sol');
const LifToken = artifacts.require('LifToken.sol');
const Unit = artifacts.require('Unit.sol')

contract('Hotel / PrivateCall: bookings', function(accounts) {
  const augusto = accounts[1];
  const hotelAccount = accounts[2];
  const typeName = 'BASIC_ROOM';

  let index;
  let hotel;
  let unitType;
  let unit;
  let stubData;

  // Create and register a hotel
  beforeEach( async function(){
    index = await WTIndex.new();
    hotel = await help.createHotel(index, hotelAccount);
    unitType = await help.addUnitTypeToHotel(index, hotel, typeName, hotelAccount);
    stubData = index.contract.getHotels.getData();
  });

  describe.skip('reservations', function(){
    let beginCallData;
    let callerInitialBalance;
    let clientInitialBalance;
    let events;
    let hash;
    let token;
    let unit;
    let value;

    // Add a unit that accepts instant booking, execute a token.transferData booking
    beforeEach(async function() {
      unit = await help.addUnitToHotel(index, hotel, typeName, hotelAccount, false);
      ({
        beginCallData,
        hotelInitialBalance,
        clientInitialBalance,
        events,
        hash,
        token,
        value
      } = await help.runBeginCall(hotel, unit, augusto, 'approveData', accounts, stubData));
    });

    it('should make the reservation', async () => {

    });

    it('should fire a Book event with the correct info', async () => {

    });

    it('should throw if any of the days requested are already reserved', async() => {

    });

    it('should throw when reserving dates in the past', async() => {

    });

    it('should throw if zero days are reserved', async() => {

    });
  });

  describe.skip('instant payment with token', async () => {

    it('should transfer tokens from client account to the hotel account', async () => {

    });

    it('should revert the clients approval if the call fails', async () => {

    });

    it('should throw if the client does not use approveData to make an instant booking', async() => {

    });

    it('should throw if the client uses approveData and `waitConfirmation` is true', async() => {

    });

    it('should check the allowance and throw if the approval is less than the price', async() => {

    });

    it('should throw if the final transferFrom fails', async() => {

    });
  });
});

