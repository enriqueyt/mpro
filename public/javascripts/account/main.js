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
  var action = ''.concat(actionName ,'/', parameter);
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

$(document).ready(function () {

  $('#addAccount').click(function (e) {
    $('#addAccountModal').modal('show');
    $('input[type=checkbox]#status').trigger('change');

    return false;
  });

  $('select#company').change(function (e) {
    e.preventDefault();

    var companyId = $(this).find('option:selected').val();

    if (companyId === 'Seleccione') {
      setDefaultDropDownListOption('branchCompany');
    }
    else {
      setDropDownListOptions('/entities/branchCompanies/company', companyId, 'branchCompany');
    }

    return false;
  });

  $('input[type=checkbox]#status').change(function (e) {
    e.preventDefault();

    $('input#statusValue').val($(this).prop('checked') ? 'Activo' : 'Inactivo');
    
    return false;
  });

  $('.addAccountSubmit').click(function (e) {
    e.preventDefault();
    var data={}, _this=this;
    $('#warningAccountForm').css({display: 'none'});
    $('#warningAccountForm #content').empty();
    $(document).find('[name="requireFieldMessage"]').remove();

    var form = document[$($(this).parents('form')).attr('name')];
    var data = {};

    _.each(form, function (item, i) {					
      var control = $(item);

      if (control.attr('class').indexOf('form-control') > -1 || control.attr('class').indexOf('form-control-custom') > -1 || control.attr('type') === 'hidden') {
        if (control.prop('tagName').toLowerCase() === 'input' || control.prop('tagName').toLowerCase() === 'textarea') {
          if (control.attr('type') === 'checkbox') {
            data[control.attr('name')] = control.prop('checked');
          }
          else if (control.val().trim().length > 0) {
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
          else if (control.attr('required') !== undefined) {
            control.after('<p style="color:red;" name="requireFieldMessage">Campo requerido</p>');
          }
        }
      }
    });

    if (!$(form).find('[name="requireFieldMessage"]').length > 0) {
      var action = $($(this).parents('form')).attr('action');

      var request = $.ajax({
        url: action,
        method: 'PUT',
        data: data
      });
       
      request.done(function (response) {
        if (!response.error) {
          var obj = response.data;   
          
          if (obj) {
            if (obj.name !== $.trim($('#entityName').val())) {
              $('#entityName').text(obj.name);
            }
            
            if (obj.email !== $.trim($('#entityEmail').val())) {
              $('#entityEmail').text(obj.email);
            }
            
            if (obj.location !== $.trim($('#entityLocation').val())) {
              $('#entityLocation').val(obj.location);
            }           
          }

          $('#editEntityModal, #addBranchCompanyModal').modal('hide');
        }

        return false;
      });
       
      request.fail(function(j, error) {
        console.log("Fail on update: " + error);
      });
    }

    return false;
  });

  return false;
});