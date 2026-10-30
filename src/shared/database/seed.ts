import bcrypt from 'bcrypt'
import { connection, Usuario, Analise, Imagem, Processada, Classificacao } from '../models/index.model.js'
import { guardLocalDatabase } from './guard.js'

async function main() {
    guardLocalDatabase()

    const senha_hash = await bcrypt.hash('senha123', 10)

    // tudo ou nada: se um insert falhar, nada fica gravado
    await connection.transaction(async (transaction) => {
        const [produtor] = await Usuario.bulkCreate(
            [
                {
                    nome: 'Produtor Exemplo',
                    email: 'produtor@vita.dev',
                    senha_hash,
                    perfil: 'produtor',
                    cnpj: '00.000.000/0001-00'
                },
                {
                    nome: 'Estudante Exemplo',
                    email: 'estudante@vita.dev',
                    senha_hash,
                    perfil: 'estudante',
                    faculdade: 'Fatec',
                    curso: 'DSM'
                }
            ],
            { validate: true, transaction }
        )

        const analise = await Analise.create(
            { id_usuario: produtor.id, status: 'finalizada' },
            { transaction }
        )

        const imagem = await Imagem.create(
            {
                id_analise: analise.id,
                nome: 'folha-01.jpg',
                caminho: 'uploads/folha-01.jpg',
                tipo_mime: 'jpeg',
                tamanho: 245_760,
                // [longitude, latitude]
                coordenadas: {
                    type: 'Point',
                    coordinates: [-47.3331, -21.6806],
                    crs: { type: 'name', properties: { name: 'EPSG:4326' } }
                }
            },
            { transaction }
        )

        await Processada.create(
            {
                id_imagem: imagem.id,
                nome: 'folha-01-processada.png',
                caminho: 'uploads/processadas/folha-01-processada.png',
                tipo_mime: 'png',
                tamanho: 198_400
            },
            { transaction }
        )

        await Classificacao.create(
            {
                id_analise: analise.id,
                classe: 'saudavel',
                confianca: 0.93,
                modelo_cnn: 'vita-cnn',
                versao_modelo: '1.0.0',
                tempo_execucao: 840
            },
            { transaction }
        )
    })

    console.log('Seed concluído.')
}

main()
    .catch((erro) => {
        console.error('Falha no seed:', erro)
        process.exitCode = 1
    })
    .finally(() => connection.close())