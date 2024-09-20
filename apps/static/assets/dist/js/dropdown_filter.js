function updateOptions(filtered, value, currentLanguage, current_page = "all") {
    fetch(`/${currentLanguage}/dashboard/filter-options/`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            filtered: filtered,
            value: value
        }),
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Error: ' + response.status);
            }
        })
        .then(responseData => {
            console.log(responseData);
            if (Array.isArray(responseData) && "role_name" in responseData[0]) {
                $('#id_role').empty();
                $.each(responseData, function (index, option) {
                    $('#id_role').append('<option value="' + option.id + '">' + option.role_name + '</option>');
                });
            }
            else if ("organizations" in responseData) {
                if (current_page == "full_register") {
                    $('#id_organization').empty();
                    $.each(responseData['organizations'], function (index, option) {
                        $('#id_organization').append('<option value="' + option.id + '">' + option.organization_name + '</option>');
                    });
                    $('#id_role').empty();
                    $.each(responseData['roles'], function (index, option) {
                        $('#id_role').append('<option value="' + option.id + '">' + option.role_name + '</option>');
                    });
                }
                else {
                    $('#id_organization').empty();
                    $.each(responseData['organizations'], function (index, option) {
                        $('#id_organization').append('<option value="' + option.id + '">' + option.organization_name + '</option>');
                    });
                }
            }
        })
        .catch(error => {
            console.error(error);
        });
};

function getCSRFToken() {
    var cookieValue = null;
    var name = 'csrftoken';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
        }
    }
    return cookieValue;
}