const Alert = require('../../models/Alert.model');


const alertRepository = {


  async findActiveAlert(endpointId){

    return Alert.findOne({
      endpointId,
      status:'ACTIVE'
    });

  },



  async create(data){

    return Alert.create(data);

  },



  async resolve(endpointId){

    return Alert.findOneAndUpdate(

      {
        endpointId,
        status:'ACTIVE'
      },


      {
        status:'RESOLVED',
        resolvedAt:new Date()
      },


      {
        new:true
      }

    );

  },
  countActiveAlerts(userId) {
  return Alert.countDocuments({
    userId,
    status: 'ACTIVE',
  });
},

async findActiveAlertsByUser(
  userId,
  { skip, limit }
){

  return Alert.find({
    userId,
    status:'ACTIVE'
  })
  .sort({
    createdAt:-1
  })
  .skip(skip)
  .limit(limit)
  .populate(
    'endpointId',
    'name url method currentStatus'
  )
  .lean();

},

async countActiveAlertsByUser(userId){

  return Alert.countDocuments({
    userId,
    status:'ACTIVE'
  });

},

async findAlertHistoryByUser(
  userId,
  { skip, limit }
){

  return Alert.find({
    userId,
  })
  .sort({
    createdAt:-1
  })
  .skip(skip)
  .limit(limit)
  .populate(
    'endpointId',
    'name url method'
  )
  .lean();

},


async countAlertHistoryByUser(userId){

  return Alert.countDocuments({
    userId,
  });

},


};



module.exports = alertRepository;