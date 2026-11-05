import { z } from 'zod'
import { emptyToNull, emptyToUndefined } from '../utils/indefinite.js'

/*
    Campos opcionais de formulário
    - clientes enviam "" para campo não preenchido; sem tratar, "" cai na
      validação do campo (ex.: CNPJ "" -> 400) ou vai para o banco como ""
*/

// cadastro: campo vazio = não informado (o banco grava null)
export const optionalField = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.nullish())

// atualização: campo vazio = apagar o valor (grava null)
export const clearableField = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToNull, schema.nullable())
