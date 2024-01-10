import {
    clearSeatingInfoFromRedis,
    retrieveAndStoreSeatingInfoInRedis,
} from '../helpers/adminHelpers/studentSeat.js';

const updateSeatingInfoRedis = () => {
    clearSeatingInfoFromRedis().then(() =>
        retrieveAndStoreSeatingInfoInRedis(),
    );
};

export { updateSeatingInfoRedis };
