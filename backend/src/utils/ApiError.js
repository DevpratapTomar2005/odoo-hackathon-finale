class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        error = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.errors = Array.isArray(error) ? error : [error];
        this.success = false;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};