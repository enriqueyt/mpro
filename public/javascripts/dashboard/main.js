$(document).ready(function () {
  if ('!{Object.keys(user).length > 0}' === 'true' && '!{user.username}' === '!{currentAccount.username}') {				
    var action = '/admin/!{currentAccount.identifier}/admin-activity-block';

    $.get(action, function (response) {
      $('#tabcontent').html(response);
    });
  }
});