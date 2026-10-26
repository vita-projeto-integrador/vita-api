const errorMiddleware = (err, req, res, next) => {
    // define propriedades dos erros (previstos || bugs)
    const statusCode = err.statusCode || 500
    const message = err.message || 'Erro interno do servidor'
    const errorContent = err.errorDetails || {
        code: err.code || 'INTERNAL_ERROR',
        message: message
    }

    // logs diferentes
    if (err.isOperational) {
        console.error('AppError: ', err)
    } else {
        console.error('Critical bug: ', err)
    }

    // single exit point
    return res.status(statusCode).json({
        success: false,
        // status: statusCode,
        message: message,
        error: errorContent
    })
}

export default errorMiddleware