$(document).ready(function () {
  $('#tabCompany a').click(function (e) {
    e.preventDefault()
    
    $(this).tab('show')
  });

  $('#addComapny').click(function (e) {
    $('#addCompanyModal').modal('show');
  });

  $('#addBranchCompany').click(function (e) {
    $('#addBranchCompanyModal').modal('show');
  });

  $('.addComapnySubmit, .addBranchCompanySubmit').click(function (e) {
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
          $('#addCompanyModal, #addBranchCompanyModal').modal('hide');
          window.location.reload(true);
        }
        else {

        }
      });
    }
  });			
});