const assert = require('chai').assert;
const help = require('./helpers/index.js');
const abiDecoder = require('abi-decoder');

const WTIndex = artifacts.require('WTIndex.sol');
const WTHotel = artifacts.require('Hotel.sol');
const UnitType = artifacts.require('UnitType.sol');
const UnitTypeInterface = artifacts.require('UnitType_Interface.sol');
const Unit = artifacts.require('Unit.sol');
const UnitInterface = artifacts.require('Unit_Interface.sol');

abiDecoder.addABI(WTHotel._json.abi);
abiDecoder.addABI(WTIndex._json.abi);
abiDecoder.addABI(UnitType._json.abi);
abiDecoder.addABI(Unit._json.abi);

contract('Hotel', function(accounts) {
  const hotelName = 'WTHotel';
  const hotelDescription = 'WT Test Hotel';
  const hotelAccount = accounts[2];
  const nonOwnerAccount = accounts[3];
  let wtIndex;
  let wtHotel;


  // Create and register a hotel
  beforeEach( async function(){
    wtIndex = await WTIndex.new();
    await wtIndex.registerHotel(hotelName, hotelDescription, {from: hotelAccount});
    let address = await wtIndex.getHotelsByManager(hotelAccount);
    wtHotel = WTHotel.at(address[0]);
  });

  describe('Constructor', function() {

    it('should be initialised with the correct data', async function(){
      const info = await help.getHotelInfo(wtHotel);
      assert.equal(info.name, hotelName);
      assert.equal(info.description, hotelDescription);
      assert.isAtMost(info.created, web3.eth.blockNumber);
      assert.equal(info.manager, hotelAccount);

      // These are false: why?
      assert.equal(info.unitTypeNames.length, 0);
      assert.equal(Object.keys(info.units).length, 0);
    });

    it('should be indexed', async function(){
      assert.equal(wtIndex.contract.address, await wtHotel.owner());
      assert.equal(hotelAccount, await wtHotel.manager());
    });
  })

  describe('editInfo', function(){

    it('should edit the hotel name and description', async function(){
      const newName = 'Claridges';
      const newDescription = 'Near everything';
      const data = wtHotel.contract.editInfo.getData(newName, newDescription);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.equal(info.name, newName);
      assert.equal(info.description, newDescription);
    });

    it('should throw if non-owner edits name / description', async function(){
      const newName = 'Claridges';
      const newDescription = 'Near everything';
      const data = wtHotel.contract.editInfo.getData(newName, newDescription);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch (e){
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('editAddress', function() {
    const lineOne = 'Common street 123';
    const lineTwo = '';
    const zip = '6655';
    const country = 'Spain';

    it('should edit the address', async function() {
      const data = wtHotel.contract.editAddress.getData(lineOne, lineTwo, zip, country);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.equal(info.lineOne, lineOne);
      assert.equal(info.lineTwo, null);
      assert.equal(info.zip, zip);
      assert.equal(info.country, country);
    });

    it('should throw if non-owner edits address', async function(){
      const data = wtHotel.contract.editAddress.getData(lineOne, lineTwo, zip, country);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch(e){
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  })

  describe('editLocation', function(){
    const timezone = 2;
    const longitude = 40.426371;
    const latitude = -3.703578;

    it('should edit the gps location', async function() {
      const { long, lat } = help.locationToUint(longitude, latitude);
      const data = wtHotel.contract.editLocation.getData(timezone, long, lat);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.equal(longitude, info.longitude);
      assert.equal(latitude, info.latitude);
    });

    it('should throw if non-owner edits gps location', async function() {
      const { long, lat } = help.locationToUint(longitude, latitude);
      const data = wtHotel.contract.editLocation.getData(timezone, long, lat);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch(e){
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('addUnitType', function(){
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    let unitType;

    beforeEach(async function(){
      unitType = await UnitType.new(wtHotel.address, typeNameHex, {from: hotelAccount});
    })

    it('should add a UnitType', async function(){
      const data = wtHotel.contract.addUnitType.getData(unitType.address);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.isDefined(info.unitTypes[typeName]);
    });

    it('should throw if non-owner adds a UnitType', async function(){
      const data = wtHotel.contract.addUnitType.getData(unitType.address);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch(e){
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if the added UnitType already exists', async function(){
      const data = wtHotel.contract.addUnitType.getData(unitType.address);
      await wtIndex.callHotel(0, data, {from: hotelAccount});

      try {
        await wtIndex.callHotel(0, data, {from: hotelAccount});
        assert(false)
      } catch(e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('addUnit', function(){
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    let unitType;

    beforeEach(async function(){
      unitType = await UnitType.new(wtHotel.address, typeNameHex, {from: hotelAccount});
      typeInterface = await UnitTypeInterface.at(unitType.address);
      const data = wtHotel.contract.addUnitType.getData(unitType.address);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
    });

    it('should add a Unit', async function(){
      const unitTypeCount = await typeInterface.totalUnits();
      const unit = await Unit.new(wtHotel.address, typeNameHex, {from: hotelAccount});
      const data = wtHotel.contract.addUnit.getData(unit.address);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.isDefined(info.units[unit.address]);
      assert.isTrue(unitTypeCount.plus(1).equals(await typeInterface.totalUnits()));
    });

    it('should throw if non-owner adds a Unit', async function(){
      const unit = await Unit.new(wtHotel.address, typeNameHex, {from: hotelAccount});
      const data = wtHotel.contract.addUnit.getData(unit.address);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch (e){
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if the UnitType of the Unit does not exist', async function(){
      const unknownTypeNameHex = web3.toHex('UNKNOWN');
      const unit = await Unit.new(wtHotel.address, unknownTypeNameHex, {from: hotelAccount});
      const data = wtHotel.contract.addUnit.getData(unit.address);

      try {
        await wtIndex.callHotel(0, data, {from: hotelAccount});
        assert(false);
      } catch (e){
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('removeUnitType', function(){
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    const validIndex = 1;
    let unitType;

    beforeEach(async function(){
      await help.addUnitTypeToHotel(wtIndex, wtHotel, typeName, hotelAccount);
    })

    it('should remove a UnitType', async function(){
      const data = wtHotel.contract.removeUnitType.getData(typeNameHex, validIndex);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.isUndefined(info.unitTypes[typeName]);
    });

    it('should throw if non-owner attempts removal', async function() {
      const data = wtHotel.contract.removeUnitType.getData(typeNameHex, validIndex);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if the unit type to be removed does not exist', async function(){
      const unknownTypeNameHex = web3.toHex('UNKNOWN');
      const data = wtHotel.contract.removeUnitType.getData(unknownTypeNameHex, validIndex);

      try {
        await wtIndex.callHotel(0, data, {from: hotelAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if the passed index does not match up with the UnitType', async function(){
      const invalidIndex = 2;
      const data = wtHotel.contract.removeUnitType.getData(typeNameHex, invalidIndex);

      try {
        await wtIndex.callHotel(0, data, {from: hotelAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('removeUnit', function(){
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    let unit;

    beforeEach(async function() {
      unitType = await help.addUnitTypeToHotel(wtIndex, wtHotel, typeName, hotelAccount);
      typeInterface = await UnitTypeInterface.at(unitType.address);
      unit = await help.addUnitToHotel(wtIndex, wtHotel, typeName, hotelAccount);
    })

    it('should remove a Unit', async function() {
      const unitTypeCount = await typeInterface.totalUnits();
      const data = wtHotel.contract.removeUnit.getData(unit.address);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.isUndefined(info.units[unit]);
      assert.isTrue(unitTypeCount.minus(1).equals(await typeInterface.totalUnits()));
    });

    it('should throw if non-owner removes unit', async function() {
      const data = wtHotel.contract.removeUnit.getData(unit.address);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('changeUnitType', function(){
    const typeNameBasic = 'BASIC_ROOM';
    const hexBasic = web3.toHex(typeNameBasic);
    let unitTypeBasic;
    let unitTypeReplacement;

    beforeEach(async function() {
      unitTypeBasic = await help.addUnitTypeToHotel(wtIndex, wtHotel, typeNameBasic, hotelAccount);
      unitTypeReplacement = await UnitType.new(wtHotel.address, hexBasic, {from: hotelAccount});
    });

    it('should reassign the address of an existing UnitType', async function(){
      const data = wtHotel.contract.changeUnitType.getData(hexBasic, unitTypeReplacement.address);
      await wtIndex.callHotel(0, data, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);

      assert.equal(info.unitTypes[typeNameBasic].address, unitTypeReplacement.address);
    });

    it('should should throw if the replacement typeName is mismatched', async function(){
      const hexMismatch = web3.toHex('MISMATCH');
      unitTypeMismatch = await UnitType.new(wtHotel.address, hexMismatch, {from: hotelAccount});
      const data = wtHotel.contract.changeUnitType.getData(hexBasic, unitTypeMismatch.address);

      try {
        await wtIndex.callHotel(0, data, {from: hotelAccount});
        assert(false)
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if a non-owner changes the UnitType', async function(){
      const data = wtHotel.contract.changeUnitType.getData(hexBasic, unitTypeReplacement.address);

      try {
        await wtIndex.callHotel(0, data, {from: nonOwnerAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if the UnitType does not exist', async function(){
      const hexUnknown = web3.toHex('UNKNOWN');
      const data = wtHotel.contract.changeUnitType.getData(hexUnknown, unitTypeReplacement.address);

      try {
        await wtIndex.callHotel(0, data, {from: hotelAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('callUnitType', function(){
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    const amenityNumber = 8;
    let unitType;
    let typeInterface;

    beforeEach(async function() {
      unitType = await help.addUnitTypeToHotel(wtIndex, wtHotel, typeName, hotelAccount);
      typeInterface = await UnitTypeInterface.at(unitType.address);
    });

    it('should add an amenity using a UnitType interface', async function(){
      const addAmenityData = typeInterface.contract.addAmenity.getData(amenityNumber);
      const callUnitTypeData = wtHotel.contract.callUnitType.getData(typeNameHex, addAmenityData);
      await wtIndex.callHotel(0, callUnitTypeData, {from: hotelAccount});
      const info = await help.getHotelInfo(wtHotel);
      const amenity = info.unitTypes[typeName].amenities.filter(item => item === amenityNumber)[0];

      assert.equal(amenity, amenityNumber);
    });

    it('should remove an amenity using a UnitType interface', async function(){
      const addAmenityData = typeInterface.contract.addAmenity.getData(amenityNumber);
      let callUnitTypeData = wtHotel.contract.callUnitType.getData(typeNameHex, addAmenityData);
      await wtIndex.callHotel(0, callUnitTypeData, {from: hotelAccount});

      const removeAmenityData = typeInterface.contract.removeAmenity.getData(amenityNumber);
      callUnitTypeData = wtHotel.contract.callUnitType.getData(typeNameHex, removeAmenityData);
      await wtIndex.callHotel(0, callUnitTypeData, {from: hotelAccount});

      const info = await help.getHotelInfo(wtHotel);
      const amenity = info.unitTypes[typeName].amenities.filter(item => item === amenityNumber)[0];

      assert.isUndefined(amenity);
    });

    it('should edit UnitType info using a UnitType interface', async function(){
      const description = 'Quiet'
      const minGuests = 1;
      const maxGuests = 2;
      const price = '200 euro';

      const editTypeData = typeInterface.contract.edit.getData(
        description,
        minGuests,
        maxGuests,
        price
      );

      let callUnitTypeData = wtHotel.contract.callUnitType.getData(typeNameHex, editTypeData);
      await wtIndex.callHotel(0, callUnitTypeData, {from: hotelAccount});

      const info = await help.getHotelInfo(wtHotel);
      const edits = info.unitTypes[typeName].info

      assert.equal(edits.description, description);
      assert.equal(edits.minGuests, minGuests);
      assert.equal(edits.maxGuests, maxGuests);
      assert.equal(edits.price, price);
    });

    it('should throw if non-owner executes the call', async function(){
      const addAmenityData = typeInterface.contract.addAmenity.getData(amenityNumber);
      const callUnitTypeData = wtHotel.contract.callUnitType.getData(typeNameHex, addAmenityData);

      try {
        await wtIndex.callHotel(0, callUnitTypeData, {from: nonOwnerAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should throw if the hotel does not have the UnitType being called', async function(){
      const hexUnknown = web3.toHex('UNKNOWN_ROOM');
      const unknownUnitType = await UnitType.new(wtHotel.address, hexUnknown, {from: hotelAccount});
      typeInterface = await UnitTypeInterface.at(unknownUnitType.address);

      const addAmenityData = typeInterface.contract.addAmenity.getData(amenityNumber);
      const callUnitTypeData = wtHotel.contract.callUnitType.getData(hexUnknown, addAmenityData);

      try {
        await wtIndex.callHotel(0, callUnitTypeData, {from: hotelAccount});
        assert(false);
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    // Not much throwing on UnitType except OnlyOwner which already throws.
    it.skip('should throw if the call to the UnitType returns false');
  });

  describe('callUnit', function(){
    const typeName = 'BASIC_ROOM';
    const typeNameHex = web3.toHex(typeName);
    const price = 10000;
    const fromDay = 10;
    const daysAmount = 3;
    let unitType;
    let unit;
    let typeInterface;
    let unitInterface;

    beforeEach(async function() {
      unitType = await help.addUnitTypeToHotel(wtIndex, wtHotel, typeName, hotelAccount);
      unit = await help.addUnitToHotel(wtIndex, wtHotel, typeName, hotelAccount);
      unitTypeInterface = await UnitTypeInterface.at(unitType.address);
      unitInterface = await UnitInterface.at(unit.address);
    });

    it('should execute a call on a Unit', async function(){
      setPriceData = unitInterface.contract.setSpecialPrice.getData(price, fromDay, daysAmount);
      callUnitData = wtHotel.contract.callUnit.getData(unit.address, setPriceData);
      await wtIndex.callHotel(0, callUnitData, {from: hotelAccount});
      const reservation = await unit.getReservation(10);

      assert.equal(reservation[0], price);
      assert(help.isZeroAddress(reservation[2]));
    });

    it('should fail if a non-owner calls the Unit', async function(){
      setPriceData = unitInterface.contract.setSpecialPrice.getData(price, fromDay, daysAmount);
      callUnitData = wtHotel.contract.callUnit.getData(unit.address, setPriceData);

      try {
        await wtIndex.callHotel(0, callUnitData, {from: nonOwnerAccount});
        assert(false);
      } catch(e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should fail if the Unit is not listed in the Hotels index of Units', async function(){
      const unknownUnit = await Unit.new(wtHotel.address, typeNameHex, {from: hotelAccount});
      setPriceData = unitInterface.contract.setSpecialPrice.getData(price, fromDay, daysAmount);
      callUnitData = wtHotel.contract.callUnit.getData(unknownUnit.address, setPriceData);

      try {
        await wtIndex.callHotel(0, callUnitData, {from: hotelAccount});
        assert(false);
      } catch(e) {
        assert(help.isInvalidOpcodeEx);
      }
    });
  });
});
