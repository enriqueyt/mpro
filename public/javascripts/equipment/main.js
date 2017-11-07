function setDefaultDropDownListOption(containerName) {
  var container = $('select#'.concat(containerName));
  var option = '';

  container.empty();
  
  if (container.prop('multiple') === false) {
    option = option.concat('<option>Seleccione</option>');
  }

  container.append(option);

  return false;
}

function setDropDownListOptions(actionName, parameter, containerName) {
  var action = ''.concat('/', actionName ,'/', parameter);
  var container = $('select#'.concat(containerName)); 

  container.empty();
  
  $.get(action, function (response) {
    var options = '';
    
    if (container.prop('multiple') === false) {
      options = options.concat('<option>Seleccione</option>');
    }

    _.each(response.data, function (item, i) {
      options = options.concat('<option value="', item._id, '">', item.name, '</option>');
    });

    container.append(options);

    return false;
  });

  return false;
}

function searchEquipmentType(identifier) {
  var action = ''.concat('/equipmentTypes/', identifier);
  
  $.get(action)
  .done(function (response) {
    $('#updateEquipmentTypeModal input#equipmentType').val(response.data._id);
    $('#updateEquipmentTypeModal input#name').val(response.data.name);
    $('#updateEquipmentTypeModal textarea#description').text(response.data.description ? response.data.description : '');
    
    if ($('#updateEquipmentTypeModal select#company').length > 0) {
      $('#updateEquipmentTypeModal select#company').val(response.data.company._id).trigger('change');
    }

    $('#updateEquipmentTypeModal input[type=checkbox]#status').prop('checked', response.data.status).trigger('change');
        
    $('#updateEquipmentTypeModal').modal('show');
    
    return false;
  })
  .fail(function (xhr, status, error) {
    var response = xhr.responseJSON;
    
    console.log(JSON.stringify(response));
    
    return false;
  });
}

function updateEquipmentType(action, data, onSuccess, onFailure) {
  $.ajax({
    url: action,
    method: 'PUT',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(data),
    success: onSuccess,
    error: onFailure
  });
    
  return false;
}

function deleteEquipmentType(identifier) {
  var action = ''.concat('/equipmentTypes/', identifier);
  var data = {status: false, deleted: true};
  var onSuccess = function (response) {
    window.location.reload(true);
    
    return false;
  };
  var onFailure = function (xhr, status, error) {
    var response = xhr.responseJSON;
    
    console.log(JSON.stringify(response));
    
    return false;
  };

  updateEquipmentType(action, data, onSuccess, onFailure);

  return false;
}

function restoreEquipmentType(identifier) {
  var action = ''.concat('/equipmentTypes/', identifier);
  var data = {status: true, deleted: false};
  var onSuccess = function (response) {
    window.location.reload(true);
    
    return false;
  };
  var onFailure = function (xhr, status, error) {
    var response = xhr.responseJSON;
    
    console.log(JSON.stringify(response));
    
    return false;
  };

  updateEquipmentType(action, data, onSuccess, onFailure);

  return false;
}

$(document).ready(function () {
  $('#tabEquipmentType a').click(function (e) {
    e.preventDefault();
    
    $(this).tab('show');

    return false;
  });

  $('#addEquipmentType').click(function (e) {
    $('#addEquipmentTypeModal').modal('show');

    return false;
  });

  $('#addEquipment').click(function (e) {
    $('#addEquipmentModal').modal('show');

    return false;
  });

  $('select#company').change(function (e) {
    e.preventDefault();

    var companyId = $(this).find('option:selected').val();

    if (companyId === 'Seleccione') {
      setDefaultDropDownListOption('branchCompany');
      setDefaultDropDownListOption('equipmentType');
      setDefaultDropDownListOption('account');
    }
    else {
      setDropDownListOptions('branchCompaniesByCompany', companyId, 'branchCompany');
      setDropDownListOptions('equipmentTypesByCompany', companyId, 'equipmentType');
    }
  
    return false;
  });

  $('select#branchCompany').change(function (e) {
    e.preventDefault();

    var branchCompanyId = $(this).find('option:selected').val();

    if (branchCompanyId === 'Seleccione') {
      setDefaultDropDownListOption('account');
    }
    else {
      setDropDownListOptions('techniciansByBranchCompany', branchCompanyId, 'account');
    }
  });

  $('input[type=checkbox]#status').change(function (e) {
    e.preventDefault();

    $('input#statusValue').val($(this).prop('checked') ? 'Activo' : 'Inactivo');
    
    return false;
  });

  $('.addEquipmentTypeSubmit, .addEquipmentSubmit').click(function (e) {
    e.preventDefault();

    $(document).find('[name="requireFieldMessage"]').remove();				

    var form = document[$($(this).parents('form')).attr('name')];
    var data = {};

    _.each(form, function (item, i) {
      var control = $(item);

      if (control.attr('class').indexOf('form-control') > -1 || control.attr('type') === 'hidden') {
        if (control.prop('tagName').toLowerCase() === 'input' || control.prop('tagName').toLowerCase() === 'textarea') {
          if (control.val().trim().length > 0) {
            data[control.attr('name')] = control.val().trim();
          }
          else {
            control.after('<p style="color:red;" name="requireFieldMessage">Campo requerido</p>');
          }
        }
        else if (control.prop('tagName').toLowerCase() === 'select') {
          var itemValue = control.find('option:selected').attr('value');							

          if (itemValue !== undefined) {
            data[control.attr('name')] = itemValue;
          }
          else {
            control.after('<p style="color:red;" name="requireFieldMessage">Campo requerido</p>');
          }
        }
      }
    });

    if (!$(form).find('[name="requireFieldMessage"]').length > 0) {					
      var action = $($(this).parents('form')).attr('action');

      $.post(action, data, function (response) {						
        if (!response.error) {
          $('#addEquipmentTypeModal, #addEquipmentModal').modal('hide');
          
          window.location.reload(true);

          return false;
        }
        else {

        }
      });
    }

    return false;
  });

  $('#updateEquipmentTypeSubmit').click(function (e) {
    e.preventDefault();
    
    var form = document[$($(this).parents('form')).attr('name')];
    var action = $($(this).parents('form')).attr('action').concat('/', $(form).find('input[type=hidden]').val());
    var data = {};
    var onSuccess = function (response) {
      $('#updateEquipmentTypeModal').modal('hide');
      
      window.location.reload(true);
      
      return false;
    };
    var onFailure = function (xhr, status, error)  {
      var response = xhr.responseJSON;
      
      console.log(JSON.stringify(response));
      
      return false;
    };

    _.each(form, function (item) {
      var control = $(item);

      if (control.attr('class').indexOf('form-control') > -1 || control.attr('class').indexOf('form-control-custom') > -1 || control.attr('type') === 'hidden') {
        if (control.prop('tagName').toLowerCase() === 'input' || control.prop('tagName').toLowerCase() === 'textarea') {
          if (control.attr('type') === 'checkbox') {
            data[control.attr('name')] = control.prop('checked');
          }
          else if (control.val().trim().length > 0) {
            data[control.attr('name')] = control.val().trim();
          }
        }
        else if (control.prop('tagName').toLowerCase() === 'select') {
          var itemValue = control.find('option:selected').attr('value');							

          if (itemValue !== undefined) {
            data[control.attr('name')] = itemValue;
          }
        }
      }
    });

    updateEquipmentType(action, data, onSuccess, onFailure);

    return false;
  });

  return false;
});