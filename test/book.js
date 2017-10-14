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
  const fromDay = 60;
  const daysAmount = 5;
  const unitPrice = 1;

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

  describe('reservations', function(){
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
      } = await help.runBeginCall(hotel, unit, augusto, fromDay, daysAmount, unitPrice, 'approveData', accounts, stubData));
    });

    it('should return successfully when calling book on itself from PrivateCall', async () => {
      let pendingCall = await hotel.pendingCalls(hash);
      assert(pendingCall[3]);
    })

    it('should make the reservation', async () => {
      const toDay = fromDay + daysAmount;
      for(var i = fromDay; i < toDay; i++) {
        assert.equal((await unit.getReservation(i))[1], augusto);
      }
    });

    it('should fire a Book event with the correct info', async () => {
      const bookEvent = events.filter(item => item && item.name === 'Book')[0].events;
      const fromValue = bookEvent.filter(item => item && item.name === 'from')[0].value;
      const fromDayValue = bookEvent.filter(item => item && item.name === 'fromDay')[0].value;
      const daysAmountValue = bookEvent.filter(item => item && item.name === 'daysAmount')[0].value;
      assert.equal(fromValue, augusto);
      assert.equal(fromDayValue, fromDay);
      assert.equal(daysAmountValue, daysAmount);
    });

    it('should not return successfully if any of the days requested are already reserved', async() => {
      const bookData = hotel.contract.book.getData(unit.address, augusto, fromDay-2, daysAmount, stubData);
      const beginCallData = hotel.contract.beginCall.getData(bookData, web3.toHex('user info'));
      const approveDataTx = await token.approveData(hotel.address, value, beginCallData, {from: augusto});

      const events = abiDecoder.decodeLogs(approveDataTx.receipt.logs);
      const callStarted = events.filter(item => item && item.name === 'CallStarted')[0];
      const dataHashTopic = callStarted.events.filter(item => item.name === 'dataHash')[0];
      let pendingCall = await hotel.pendingCalls(dataHashTopic.value);
      assert(!pendingCall[3]);
    })

    it.skip('should throw if any of the days requested are already reserved', async() => {

    });

    it.skip('should throw when reserving dates in the past', async() => {

    });

    it.skip('should throw if zero days are reserved', async() => {

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
