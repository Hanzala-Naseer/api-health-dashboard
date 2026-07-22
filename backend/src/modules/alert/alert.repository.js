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

  }


};



module.exports = alertRepository;