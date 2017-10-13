const assert = require('chai').assert;
const help = require('./helpers/index.js');
const tokenHelp = require('../LifToken/test/helpers.js');
const abiDecoder = require('abi-decoder');

const WTIndex = artifacts.require('WTIndex.sol');
const WTHotel = artifacts.require('Hotel.sol');
const UnitType = artifacts.require('UnitType.sol');
const UnitTypeInterface = artifacts.require('UnitType_Interface.sol');
const Unit = artifacts.require('Unit.sol');
const UnitInterface = artifacts.require('Unit_Interface.sol');
const LifToken = artifacts.require('LifToken.sol');

abiDecoder.addABI(WTHotel._json.abi);
abiDecoder.addABI(WTIndex._json.abi);
abiDecoder.addABI(UnitType._json.abi);
abiDecoder.addABI(Unit._json.abi);
abiDecoder.addABI(LifToken._json.abi);

contract('Hotel', function(accounts) {
  const hotelName = 'WTHotel';
  const hotelDescription = 'WT Test Hotel';
  const hotelAccount = accounts[2];
  const nonOwnerAccount = accounts[3];
  let wtIndex;
  let wtHotel;
  let token;

  // Create and register a hotel
  beforeEach( async function(){
    const rate = 100000000000;
    const crowdsale = await help.simulateCrowdsale(rate, [40,30,20,10,0], accounts, 1);
    token = LifToken.at(await crowdsale.token.call());

    wtIndex = await WTIndex.new();
    await wtIndex.setLifToken(token.address);
    await wtIndex.registerHotel(hotelName, hotelDescription, {from: hotelAccount});
    let address = await wtIndex.getHotelsByManager(hotelAccount);
    wtHotel = WTHotel.at(address[0]);
  });

  describe('add a Unit and set price', async function() {
    const price = 10;
    const augusto = accounts[1];
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    const userInfo = web3.toHex('user info');

    it('should book a Unit through LifToken', async function() {
      const unitType = await help.addUnitTypeToHotel(wtIndex, wtHotel, typeName, hotelAccount);
      const unit = await help.addUnitToHotel(wtIndex, wtHotel, typeName, hotelAccount, false);
      const setPriceData = unit.contract.setDefaultLifTokenPrice.getData(price);
      let callData = wtHotel.contract.callUnit.getData(unit.address, setPriceData);
      await wtIndex.callHotel(0, callData, {from: hotelAccount});
      assert((await unit.defaultLifTokenPrice()).equals(price));

      let giveVoteData = wtIndex.contract.giveVote.getData(hotelAccount);
      let totalPrice = await unit.getPrice(60, 5);
      assert((await token.balanceOf(augusto)).gt(totalPrice));

      let bookData = wtHotel.contract.book.getData(unit.address, augusto, 60, 5, "");
      callData = wtHotel.contract.beginCall.getData(bookData, userInfo);
      let approveDataTx = await token.approveData(wtHotel.address, totalPrice, callData, {from: augusto});
      let reservation;
      for(var i = 60; i <= 65; i++) {
        reservation = await unit.getReservation(i)
        assert(reservation[1] == augusto);
      }
    })
  });
});
