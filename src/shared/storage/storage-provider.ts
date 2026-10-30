import type { Readable } from 'node:stream'

/**
 * StorageProvider.ts
 *
 * Contrato (interface) que todo adaptador de storage precisa cumprir.
 *
 * O resto da aplicação (services, worker, scripts) depende APENAS deste
 * contrato, nunca de um adaptador específico. Por isso dá para trocar o
 * disco local por um bucket na nuvem mudando só a variável STORAGE_DRIVER.
 *
 * Regras que todo adaptador deve seguir:
 *   - Trabalha só com keys lógicas (ex.: `analyses/1/abc/original.jpg`).
 *     Nenhum método recebe ou devolve caminhos de disco.
 *   - Oferece apenas operações que também existem em object storage (S3/R2).
 *   - Lança somente `StorageError`, nunca erros HTTP.
 *
 * Implementações:
 *   - LocalStorageProvider → disco local (atual)
 *   - R2StorageProvider    → Cloudflare R2 (futuro, quando necessário)
 */

// ===========================================================================
// Metadados
// ===========================================================================

/**
 * Informações sobre um arquivo guardado no storage.
 * O formato é o mesmo para qualquer adaptador.
 */
export interface StoredObjectInfo {
    /** Endereço lógico do arquivo. Ex.: `analyses/1/abc/original.jpg` */
    key: string

    /** Tamanho do arquivo, em bytes. */
    size: number

    /** Tipo do conteúdo (ex.: `image/jpeg`), derivado da extensão da key. */
    contentType: string

    /** Data da última gravação do arquivo. */
    updatedAt: Date
}

/**
 * Resultado de `getStream`: o stream de leitura e os metadados do arquivo.
 * Os metadados servem para montar os headers da resposta HTTP
 * (`Content-Type` e `Content-Length`).
 */
export interface StoredObjectStream {
    stream: Readable
    info: StoredObjectInfo
}

// ===========================================================================
// Contrato
// ===========================================================================

export interface StorageProvider {
    // -----------------------------------------------------------------------
    // Ciclo de vida
    // -----------------------------------------------------------------------

    /**
     * Prepara o storage para uso e verifica se é possível gravar nele.
     * Chamado uma única vez, no boot do servidor (`server.ts`).
     *
     * @throws StorageError `STORAGE_UNAVAILABLE` se não houver permissão de escrita.
     */
    init(): Promise<void>

    /**
     * Verifica se o storage continua gravável.
     * Usado pela rota de readiness do health check.
     *
     * @throws StorageError `STORAGE_UNAVAILABLE` se não for possível gravar.
     */
    healthCheck(): Promise<void>

    // -----------------------------------------------------------------------
    // Escrita
    // -----------------------------------------------------------------------

    /**
     * Grava um arquivo de forma atômica: quem lê nunca vê o arquivo pela metade.
     * Se a key já existir, o arquivo é substituído.
     *
     * @returns Os metadados do arquivo gravado.
     * @throws StorageError `STORAGE_INVALID_KEY`, `STORAGE_UNAVAILABLE` ou `STORAGE_FAILURE`.
     */
    put(key: string, data: Buffer): Promise<StoredObjectInfo>

    // -----------------------------------------------------------------------
    // Leitura
    // -----------------------------------------------------------------------

    /**
     * Lê o arquivo inteiro para a memória.
     * Indicado para processamento (ex.: Sharp no worker).
     *
     * @throws StorageError `STORAGE_NOT_FOUND` se o arquivo não existir.
     */
    getBuffer(key: string): Promise<Buffer>

    /**
     * Abre o arquivo como stream, sem carregá-lo inteiro na memória.
     * Indicado para enviar o arquivo na resposta HTTP.
     *
     * A existência do arquivo é verificada ANTES de abrir o stream,
     * para que o erro aconteça antes de qualquer header ser enviado.
     *
     * @throws StorageError `STORAGE_NOT_FOUND` se o arquivo não existir.
     */
    getStream(key: string): Promise<StoredObjectStream>

    /**
     * Consulta os metadados de um arquivo.
     * Perguntar se algo existe é normal, então este método NÃO lança erro
     * quando o arquivo não existe: ele devolve `null`.
     *
     * @returns Os metadados, ou `null` se o arquivo não existir.
     */
    stat(key: string): Promise<StoredObjectInfo | null>

    /**
     * Percorre todos os arquivos cujo endereço começa com o prefixo.
     * Um prefixo que não existe gera uma lista vazia, não um erro.
     *
     * Uso: `for await (const item of storage.list('analyses/1')) { ... }`
     */
    list(prefix: string): AsyncIterable<StoredObjectInfo>

    // -----------------------------------------------------------------------
    // Deleção
    // -----------------------------------------------------------------------

    /**
     * Apaga um arquivo.
     * É idempotente: apagar algo que não existe é considerado sucesso.
     * Isso torna seguro repetir a operação em retries.
     */
    delete(key: string): Promise<void>

    /**
     * Apaga todos os arquivos sob o prefixo (ex.: todas as imagens de uma análise).
     * Por segurança, prefixos muito amplos (como `analyses`) são recusados.
     *
     * @returns A quantidade de arquivos apagados.
     * @throws StorageError `STORAGE_INVALID_KEY` se o prefixo for amplo demais.
     */
    deletePrefix(prefix: string): Promise<number>
}