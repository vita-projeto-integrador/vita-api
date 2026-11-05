import type { Model, ModelStatic } from 'sequelize'
import { AnyFunction } from 'sequelize/lib/utils'

type AnyModel = ModelStatic<Model>

interface CascadeModels {
    Usuario: AnyModel
    Analise: AnyModel
    Imagem: AnyModel
    Processada: AnyModel
    Classificacao: AnyModel
}

/*
    Regras de segurança para exclusão
    - addHook ao invés de model.beforeBulkDestroy()
    - pais e filhos são excluídos juntos, ou nada acontece
    - exclui filhos antes dos pais
*/

// rejeita exclusão física
function rejectHardDelete(model: AnyModel): void {
    const message = `Exclusão física não permitida em ${model.name}`

    model.addHook('beforeDestroy', (_instance, options) => {
        if (options.force) throw new Error(message)
    })
    model.addHook('beforeBulkDestroy', (options) => {
        if (options.force) throw new Error(message)
    })
}

// exige transação
function requireTransaction(model: AnyModel): void {
    const withoutTransaction = `Exclusa ${model.name} dentro de uma transação`
    const withoutHooks = `Exclusa ${model.name} em lote com individualHooks: true`

    model.addHook('beforeDestroy', (_instance, options) => {
        if (!options.transaction) throw new Error(withoutTransaction)
    })
    model.addHook('beforeBulkDestroy', (options) => {
        if (!options.transaction) throw new Error(withoutTransaction)
        if (!options.individualHooks) throw new Error(withoutHooks)
    })
}

// propaga exclusão
function spreadExclusion(father: AnyModel, son: AnyModel, fk: string): void {
    father.addHook('beforeDestroy', async (instance, options) => {
        await son.destroy({
            where: { [fk]: instance.get('id') },
            transaction: options.transaction,
            individualHooks: true
        })
    })
}

// roda travas e hooks antes da exclusão
export function registerCascadeDelete(m: CascadeModels): void {
    for (const model of [m.Analise, m.Classificacao, m.Imagem, m.Processada, m.Usuario]) {
        rejectHardDelete(model)
    }
    for (const model of [m.Analise, m.Imagem, m.Usuario]) {
        requireTransaction(model)
    }
    spreadExclusion(m.Usuario, m.Analise, 'id_usuario')
    spreadExclusion(m.Analise, m.Imagem, 'id_analise')
    spreadExclusion(m.Analise, m.Classificacao, 'id_analise')
    spreadExclusion(m.Imagem, m.Processada, 'id_imagem')
}