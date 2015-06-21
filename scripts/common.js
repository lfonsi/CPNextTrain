function buildSelects() {
        $.each(stations.cp, function(key, value) {
            var upperCased = value.replace(/\b\w/g, capitalize);
            $('#origin').append($('<option>', {
                    value: upperCased
                })
                .text(upperCased));

            $('#destination').append($('<option>', {
                    value: upperCased
                })
                .text(upperCased));
        });
}

function renderError(msg, hasTimeout) {
    $('#error-container').html(msg);
    $('#error-container').removeClass('hide');

    if (hasTimeout) {
        setTimeout(function() {
            $('#error-container').addClass('hide');
        }, 900);
    }

}

function renderSuccess(msg, hasTimeout) {
    $('#success-container').html(msg);

    if (hasTimeout) {
        setTimeout(function() {
            $('#success-container').empty();
        }, 900);
    }
}

function renderStatus(msg) {
    $('#status-container').html(msg);
    $('#status-container').removeClass('hide');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}