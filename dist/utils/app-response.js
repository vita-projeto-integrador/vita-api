// classe HTTP para respostas bem-sucedidas
export class AppResponse {
    success;
    statusCode;
    message;
    data; // recebe vários tipos de dados
    constructor(statusCode, message, data) {
        this.success = statusCode >= 200 && statusCode < 300; // se estiver no intervalo, ganha true
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
    // método para enviar response de sucesso
    static send(res, status, message, data) {
        // instancia classe - usa desestruturação p/ não imprimir statusCode
        const { statusCode, ...response } = new AppResponse(status, message, data);
        // retorna response
        return res.status(statusCode).json(response);
    }
}
