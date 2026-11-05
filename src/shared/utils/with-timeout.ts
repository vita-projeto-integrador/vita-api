/*
    Função helper que define um prazo em milissegundos para uma promisse qualquer
*/
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;

    // cria promise que nunca é resolvida, sempre rejeitada
    // ela é rejeitada quando o tempo do setTimeout() é esgotado, gerando também um erro
    const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });

    // define corrida entre promisse original e timeout, retorna qual acabar primeiro e limpa timer
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}