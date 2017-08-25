$(document).ready(function () {
  $('#addAccount').click(function (e) {
    $('#addAccountModal').modal('show');
  });

  $('.addAccountSubmit').click(function (e) {
    e.preventDefault();

    $('#warningAccountForm').css({display:'none'});
    $('#warningAccountForm #content').empty();
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
          else if ($(item).attr('required') !== undefined) {
            $(item).after('<p style="color:red;" name="description">Campo requerido</p>');
          }
        }
      }
    });

    if (!$(form).find('[name="description"]').length > 0) {
      var action = $($(this).parents('form')).attr('action');

      $.post(action, data, function (response) {						
        if (!response.error) {
          $('#addAccountModal').modal('hide');
          window.location.reload(true);
        }
        else {
          $('#warningAccountForm').css({display:''});
          $('#warningAccountForm #content').append(response.message);
        }
      });
    }
  });

  $('select#company').change(function (e) {
    e.preventDefault();

    $('#branchcompany').empty();

    if ($(this).find('option:selected').val() === 'Seleccione')
      return;

    var action = ''.concat('/get-branch-company-by-company/', $(this).find('option:selected').val());

    $.get(action, function (data) {
      var options = ''.concat('<option value="0">Seleccione</option>');

      _.each(data.data, function (item, i) {
        options = options.concat('<option value="', item._id, '">', item.name, '</option>');
      });

      $('#branchcompany').append(options);
    });
  });
});