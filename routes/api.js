var Express = require('express');
var Sanitizer = require('sanitizer');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');

var EquipmentType = require('./entityResources/equipmentType');
var Equipment = require('./entityResources/equipment');
var MaintenanceActivity = require('./entityResources/maintenanceActivity');
var MaintenanceActivityAttention = require('./entityResources/maintenanceActivityAttention');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});

router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

/* ########################################################################## */
/* EQUIPMENT TYPES ROUTES                                                     */
/* ########################################################################## */

router.post(
  '/equipmentTypes',
  EquipmentType.createEquipmentType);

router.get(
  '/equipmentTypes/:page-:quantity/:search',
  EquipmentType.getEquipmentTypes);

router.get(
  '/equipmentTypes/:equipmentType',
  EquipmentType.getEquipmentType);

router.put(
  '/equipmentTypes/:equipmentType',
  EquipmentType.updateEquipmentType);


/* ########################################################################## */
/* EQUIPMENT ROUTES                                                           */
/* ########################################################################## */

router.post(
  '/equipments',
  Equipment.createEquipment);

router.get(
  '/equipments/:page-:quantity/:search',
  Equipment.getEquipments);

router.get(
  '/equipments/:equipment',
  Equipment.getEquipment);

router.put(
  '/equipments/:equipment',
  Equipment.updateEquipment);

router.put(
  '/equipments/maintenanceActivityDates/:maintenanceActivityDate',
  Equipment.updateMaintenanceActivityDate);


/* ########################################################################## */
/* MAINTENANCE ACTIVITY ROUTES                                                */
/* ########################################################################## */

router.post(
  '/maintenanceActivities',
  MaintenanceActivity.createMaintenanceActivities);

router.get(
  '/maintenanceActivities/:maintenanceActivity',
  MaintenanceActivity.getMaintenanceActivity);

router.put(
  '/maintenanceActivities/:maintenanceActivity',
  MaintenanceActivity.updateMaintenanceActivity);


/* ########################################################################## */
/* MAINTENANCE ACTIVITY ATTENTION ROUTES                                      */
/* ########################################################################## */

router.post(
  '/maintenanceActivityAttentions',
  MaintenanceActivityAttention.createMaintenanceActivityAttentions);

router.get(
  '/maintenanceActivityAttentions/:equipment/next',
  MaintenanceActivityAttention.getNextMaintenanceActivityAttention);

router.get(
  '/maintenanceActivityAttentions/activityDate/:identifier',
  MaintenanceActivityAttention.getMaintenanceActivityAttentionByActivityDate);

router.put(
  '/maintenanceActivityAttentions/:maintenanceActivityAttention',
  MaintenanceActivityAttention.updateMaintenanceActivityAttention
);


module.exports = router;
