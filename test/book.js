const assert = require('chai').assert;
const help = require('./helpers/index.js');

contract('Hotel / PrivateCall: bookings', function(accounts) {
  const augusto = accounts[1];
  const hotelAccount = accounts[2];
  const jakub = accounts[3];
  const typeName = 'BASIC_ROOM';

  describe('reservations', function(){
    let events;
    let hash;
    const fromDay = 60;
    const daysAmount = 5;
    const price = 1;

    // Add a unit that accepts instant booking, execute a token.transferData booking
    beforeEach(async function() {
      const args = [
        augusto,
        hotelAccount,
        accounts,
        fromDay,
        daysAmount,
        price
      ];

      ({ events, hash, unit } = await help.bookInstantly(...args));
    });

    it('should make a reservation', async () => {
      const range = _.range(fromDay, fromDay + daysAmount);

      for (let day of range) {
        const [ specialPrice, bookedBy ] = await unit.getReservation(day);
        assert.equal(bookedBy, augusto);
      }
    });

    it('should fire a Book event with the correct info', async () => {
      const bookEvent = events.filter(item => item && item.name === 'Book')[0].events;
      const fromTopic = bookEvent.filter(item => item && item.name === 'from')[0];
      const fromDayTopic = bookEvent.filter(item => item && item.name === 'fromDay')[0];
      const daysAmountTopic = bookEvent.filter(item => item && item.name === 'daysAmount')[0];

      assert.equal(fromTopic.value, augusto);
      assert.equal(fromDayTopic.value, fromDay);
      assert.equal(daysAmountTopic.value, daysAmount);
    });

    it('should make a res that starts on the day a previous res ends', async () => {
      const nextFrom = fromDay + daysAmount;
      const nextAmount = 2;
      const args = [
        jakub,
        hotelAccount,
        accounts,
        nextFrom,
        nextAmount,
        price
      ];
      ({ unit } = await help.bookInstantly(...args));

      const range = _.range(nextFrom, nextFrom + nextAmount);
      for (let day of range) {
        const [ specialPrice, bookedBy ] = await unit.getReservation(day);
        assert.equal(bookedBy, jakub);
      }
    })

    it('should throw if zero days are reserved', async () => {
      const nextFrom = fromDay + daysAmount;
      const nextAmount = 0;
      const args = [
        jakub,
        hotelAccount,
        accounts,
        nextFrom,
        nextAmount,
        price
      ];

      try {
        await help.bookInstantly(...args);
        assert(false);
      } catch (e) {
        help.isInvalidOpcodeEx(e);
      }
    });

    it('should should throw if any of the days requested are already reserved', async () => {
      const takenDay = fromDay + 1;
      const args = [
        jakub,
        hotelAccount,
        accounts,
        takenDay,
        daysAmount,
        price
      ];

      try {
        await help.bookInstantly(...args);
        assert(false);
      } catch (e) {
        help.isInvalidOpcodeEx(e);
      }
    })

    // This needs:
    // Contract logic about the current date.
    // Combing through the helpers and tests to remove '60' and provide an accurate date.
    it.skip('should throw when reserving dates in the past', async() => {

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
