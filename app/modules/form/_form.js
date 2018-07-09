function inputLabel() {
    var inputs = document.querySelectorAll('.js-input');

    for (var i = 0; i < inputs.length; i++) {
        var $this = inputs[i],
            input_val = $this.value;

        if ( input_val !== '' ) {
            $this.classList.add('has-value');
        }

        inputs[i].addEventListener("blur", function() {
            var input_val = this.value;
            if ( input_val == '' ) {
                this.classList.remove('has-value');
            } else {
                this.classList.add('has-value');
            }
        });
    }
}
inputLabel();