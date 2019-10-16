exports.fabric_api_error = async function error_handling(reason){
    // extract the error code
    var err_code = reason.match(/\d+/g).map(Number);
    // '42' means logged user is not a registrar
    if (err_code[2] === 42){
        return 'logged user is not a registrar';
    }
    // '0' means identity already exists
    else if (err_code[0] === 0){
        return true;
    }
}