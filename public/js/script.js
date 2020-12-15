$(function () {

    $(".btn-submit").click(function(){
        $(this).parent().submit();
    });

    $('#form-generate').validate({
        errorElement: 'small',
        errorClass: 'error text-danger text-small',
        rules: {
            key: {
                normalizer: function (value) {
                    return $.trim(value);
                }
            },
            urls: {
                required: true,

                normalizer: function (value) {
                    return $.trim(value);
                }
            }
        }
    });

    $("#example").click(function(){
        $("#urls").val(`https://github.com/thiagodnf/minijava.git\nhttps://github.com/thiagodnf/jacof.git\nhttps://github.com/thiagodnf/ms-email.git`);
    });
});
