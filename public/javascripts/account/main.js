$(document).ready(function () {

  $('#addAccount').click(function (e) {
    $('#addAccountModal').modal('show');
  });

  $('.addAccountSubmit').click(function (e) {
    e.preventDefault();
    var data={}, _this=this;
    $('#warningAccountForm').css({display: 'none'});
    $('#warningAccountForm #content').empty();
    $(document).find('[name="description"]').remove();
    
    getAvatar(function(avatar){
      data.image=avatar;
      var form = document[$($(_this).parents('form')).attr('name')];

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
        
        var action = $($(_this).parents('form')).attr('action');

        $.post(action, data, function (response) {						
          if (!response.error) {
            $('#addAccountModal').modal('hide');
            window.location.reload(true);
          }
          else {
            $('#warningAccountForm').css({display: ''});
            $('#warningAccountForm #content').append(response.message);
          }
        });
      }

    });
  });

  $('select#company').change(function (e) {
    e.preventDefault();

    $('#branchcompany').empty();

    if ($(this).find('option:selected').val() === 'Seleccione')
      return;

    var action = ''.concat('/get-branch-companies-by-company/', $(this).find('option:selected').val());

    $.get(action, function (data) {
      var options = ''.concat('<option value="0">Seleccione</option>');

      _.each(data.data, function (item, i) {
        options = options.concat('<option value="', item._id, '">', item.name, '</option>');
      });

      $('#branchcompany').append(options);
    });
  });

  function getAvatar(done){
    var arr=[];
    var url='https://octodex.github.com';
    $.get(url, function(data){      
      $(data).find('.item a').each(function(index, value){
        var gitavatar = $(this).first().children().attr('data-src');
        if(gitavatar!=undefined){
          var aux = ''.concat(url, gitavatar);
          arr.push(aux);
        }
      });
      result=arr[getRamdom(0, arr.length)];
      done(result);
    });
  };

  function getRamdom(min, max){
    return Math.floor(Math.random()*(max-min+1))+min;
  };

  $('.editEntitySubmit').click(function (e) {
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

      var request = $.ajax({
        url: action,
        method: 'PUT',
        data: data
      });
       
      request.done(function( response ) {
        if (!response.error) {
          var obj = response.data;   
          
          if(obj){
            if(obj.name!=$.trim($('#entityName').val())) $('#entityName').text(obj.name);
            if(obj.email!=$.trim($('#entityEmail').val())) $('#entityEmail').text(obj.email);
            if(obj.location!=$.trim($('#entityLocation').val())) $('#entityLocation').val(obj.location);            
          }

          $('#editEntityModal, #addBranchCompanyModal').modal('hide');
        
        }
      });
       
      request.fail(function(j,error) {
        console.log( "fallo al actualizar" + error);
      });

    }
  });

});