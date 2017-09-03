function setDefaultDropDownListOption(containerName) {
  var option = ''.concat('<option value="0">Seleccione</option>');

  $('#'.concat(containerName)).append(option);

  return false;
}

function setDropDownListOptions(actionName, parameter, containerName) {
  var action = ''.concat('/', actionName ,'/', parameter);

  $.get(action, function (response) {
    var options = ''.concat('<option value="0">Seleccione</option>');

    _.each(response.data, function (item, i) {
      options = options.concat('<option value="', item._id, '">', item.name, '</option>');
    });

    $('#'.concat(containerName)).append(options);
  });

  return false;
}

$(document).ready(function () {
  $('#tabEquipmentType a').click(function (e) {
    e.preventDefault()
    
    $(this).tab('show')
  });

  $('#addEquipmentType').click(function (e) {
    $('#addEquipmentTypeModal').modal('show');
  });

  $('#addEquipment').click(function (e) {
    $('#addEquipmentModal').modal('show');
  });

  $('.addEquipmentTypeSubmit, .addEquipmentSubmit').click(function (e) {
    e.preventDefault();

    $(document).find('[name="description"]').remove();				

    var form = document[$($(this).parents('form')).attr('name')];
    var data = {};

    _.each(form, function (item, i) {				
      if (item.getAttribute('class') === 'form-control' || item.type === 'hidden') {
        if (item.tagName.toLowerCase() === 'input' || item.tagName.toLowerCase() === 'textarea') {
          if (item.value.length > 0) {
            data[item.name] = item.value;
          }
          else {
            $(item).after('<p style="color:red;" name="description">Campo requerido</p>');
          }
        }
        else if (item.tagName.toLowerCase() === 'select') {
          var itemValue = $(item).find('option:selected').attr('value');							

          if (itemValue !== undefined) {
            data[item.name] = itemValue;
          }
          else {
            $(item).after('<p style="color:red;" name="description">Campo requerido</p>');
          }
        }
      }
    });

    if (!$(form).find('[name="description"]').length > 0) {					
      var action = $($(this).parents('form')).attr('action');

      $.post(action, data, function (response) {						
        if (!response.error) {
          $('#addEquipmentTypeModal, #addEquipmentModal').modal('hide');
          window.location.reload(true);
        }
        else {

        }
      });
    }
  });
  
  $('select#company').change(function (e) {
    e.preventDefault();

    $('#branchCompany').empty();
    $('#type').empty();

    var companyId = $(this).find('option:selected').val();

    if (companyId === 'Seleccione') {
      setDefaultDropDownListOption('branchCompany');
      setDefaultDropDownListOption('type');
      setDefaultDropDownListOption('account');
    }
    else {
      setDropDownListOptions('get-branch-companies-by-company', companyId, 'branchCompany');
      setDropDownListOptions('get-equipment-types-by-company', companyId, 'type');
    }
  });

  $('select#branchCompany').change(function (e) {
    e.preventDefault();

    $('#account').empty();

    var branchCompanyId = $(this).find('option:selected').val();

    if (branchCompanyId === 'Seleccione') {
      setDefaultDropDownListOption('account');
    }
    else {
      setDropDownListOptions('get-technicians-by-branch-company', branchCompanyId, 'account');
    }
  });

  return false;
});