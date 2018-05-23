var Mongoose = require('mongoose');
var _ = require('underscore');
var Utils = require('../../libs/utils');
var Log = require('../../libs/log');
var EmailService = require('../../libs/emailServices');
var mongoEquipment = Mongoose.model('equipment');
var mongoNotification = Mongoose.model('notification');
var mongoMaintenanceActivityAttention = Mongoose.model('maintenanceActivityAttention');
var DATE_FORMAT = 'DD/MM/YYYY';

exports.sendNotifications = function (req, res, next) {
    
    var findMantenance = new Promise(function (resolve, reject) {
      var today = new Date(), tomorrow = new Date();

      today.setDate(today.getDate()-1)
      console.log(today)

      tomorrow.setDate(tomorrow.getDate()+2);
      console.log(tomorrow)

      var query = {"date":{"$gte":new Date(today), "$lt":new Date(tomorrow)}}, 
          projection={_id:0, "equipment":1, "date":-1, "checked":1};
      
      mongoMaintenanceActivityAttention
        .find(query, projection)
        .populate({
          path: 'equipment', 
          select: {
            _id: 1, 
            name: 1,
            userAssigned:1,
            branchCompany:1
          },
          populate:{
            path:'userAssigned',
            model:'account'
          }/*,
          populate:{
            path:'branchCompany',
            model:'entity'
        }*/})
        .lean()
        .exec()
        .then(function (equipment) {          
          if (!equipment || equipment.length === 0) {
            var message = 'No equipment found';
            reject(new Error(message));
          }
          else {
            resolve(groupBy(equipment));
          }
        })
    });

    var validateUserNotification = function(equipments){
      return new Promise(function(resolve, reject){

        var users = _.map(equipments, function(value){return value.idUserAssigned})
        
        var query = {"userAssigned":{$in:users}}
        
        mongoNotification
          .find(query).lean().exec()
          .then(function(not){
            if(!not.length){
              var arr = equipments.toString();
              _.each(equipments, function(v, k){
                notify(v);
              })
              resolve([equipments, []]);
            }
            else{
              var newArr=[];
              console.log("equipments------------Begin--------------")
              console.log(equipments)
              console.log("equipments------------End--------------")
              newArr = _.filter(equipments,(diff(not)));
              console.log("newArr------------BEGIN--------------")
              console.log(newArr)
              console.log("newArr------------FIN--------------")
              resolve([newArr, not])
            }            
          })
          .catch(function(err){
            reject(err);
          });
      });
    };

    var groupBy = function(list, groupby){
      var result = [], obj = {};
      result = _.reduce(list, function(arrEmpty, val){        
        var key = "".concat(val.equipment._id,"-",val.date);
        if(!obj[key]&&val.checked==false){
          obj[key]={ ...{id:val.equipment._id,date:val.date, userAssigned:val.equipment.userAssigned.username, name:val.equipment.userAssigned.name, equipment:val.equipment.name}};
          arrEmpty.push({
            id:val.equipment._id,
            date:val.date, 
            userAssigned:val.equipment.userAssigned.username,
            idUserAssigned:val.equipment.userAssigned._id,
            name:val.equipment.userAssigned.name, 
            equipment:val.equipment.name
          });
        }
        return arrEmpty;
      },[]);
      return result;
    };

    var diff = function(firstArr){
      var func = function(secondArr){
        return _.filter(firstArr, function(val){
          return (val.date).getTime() != (secondArr.date).getTime() && val.equipment!=secondArr.text
        });
      };

      return func;

    };
    
    var notify = function(account){

      EmailService.send({
        to:account.userAssigned,
        subject:'Notificacion de servicio',
        text:`${account.name}, 
        
        Se le informa que tiene un servicio programado, anexo detalle:
        
        Fecha: ${account.date},
        Equipo: ${account.equipment}
        
        Gracias,`
      });

    };

    var markAsNotified = function(notifications){
      return new Promise(function(resolve, reject){
        var result = [];

        var createNotification = _.reduce(notifications[0], function (arrEmpty, notification) {   
                 
          arrEmpty.push(saveNotification({
            name: notification.name,
            text: notification.equipment,
            userAssigned: notification.idUserAssigned,
            date:notification.date
          }));
          return arrEmpty;
        }, []);
        resolve(createNotification);
      });
    };

    var saveNotification = function (notification) {
      var promise = new Promise(function (resolve, reject) {
        var onCreateDocument = function (err, document) {
          
          if (err) {
            resolve({error: true, message: err.message});
          };
          
          resolve({error: false, data: document});
        };
    
        var newNotification = new mongoNotification(notification);
      
        newNotification.save(onCreateDocument);
      });
  
      return promise;
    };
  
    var onFinish = function (data) {
      res.status(200).send(data);
    };
  
    findMantenance
    .then(validateUserNotification)
    .then(markAsNotified)
    .then(onFinish)
    .catch(function (err) {
      console.log("----------------------------")
      console.log(err)
      console.log("----------------------------")
      res.status(500).send(err.message);
    });
  };