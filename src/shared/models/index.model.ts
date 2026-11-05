import connection from '../config/sequelize.config.js'
import { Usuario } from './usuario.model.js'
import { Analise } from './analise.model.js'
import { Imagem } from './imagem.model.js'
import { Processada } from './processada.model.js'
import { Classificacao } from './classificacao.model.js'
import { registerCascadeDelete } from './cascade-delete.js'

/*
    USUÁRIO 1-N ANÁLISE
*/
Usuario.hasMany(Analise, { foreignKey: 'id_usuario', as: 'analises' })
Analise.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' })

/*
    ANÁLISE 1-N IMAGEM
*/
Analise.hasMany(Imagem, { foreignKey: 'id_analise', as: 'imagens' })
Imagem.belongsTo(Analise, { foreignKey: 'id_analise', as: 'analise' })

/*
    IMAGEM 1-N PROCESSADA
*/
Imagem.hasMany(Processada, { foreignKey: 'id_imagem', as: 'processadas' })
Processada.belongsTo(Imagem, { foreignKey: 'id_imagem', as: 'imagem' })

/*
    ANÁLISE 1-1 CLASSIFICAÇÃO
*/
Analise.hasOne(Classificacao, { foreignKey: 'id_analise', as: 'classificacao' })
Classificacao.belongsTo(Analise, { foreignKey: 'id_analise', as: 'analise' })

/*
    Configura exclusão em cascata
*/
registerCascadeDelete({ Usuario, Analise, Imagem, Processada, Classificacao })

export { connection, Usuario, Analise, Imagem, Processada, Classificacao }